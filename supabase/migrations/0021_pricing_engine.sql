-- Pricing engine core: suggest_price() computes a suggested range,
-- weighted median, and confidence tier for a model + condition grade.
--
-- Data sources, unioned at query time (approved design):
--   - transactions (AVauction's own sales) at weight 1.0 — gold standard;
--     the market_prices moat table stays pure scraped data
--   - market_prices rows, each carrying its own source-quality weight
--     (0.7 sold_verified / 0.5 asking_dealer / 0.2 asking_marketplace)
--
-- Method: time decay (half-life) on every observation's weight; grade
-- normalization via per-grade factors; weighted median for the center;
-- weighted IQR for the range; confidence tiers from effective (decayed)
-- model-record weight; bootstrap for thin models (< 30 records) widens to
-- same-manufacturer + same-category observations at reduced weight, a
-- wider range multiplier, and confidence capped at 'low'.
-- Every tunable lives in pricing_engine_settings.

insert into pricing_engine_settings (key, value, description) values
  ('pricing_time_decay_half_life_days', '180',
   'Observation weight halves every N days. Old prices fade, never vanish.'),
  ('pricing_bootstrap_min_records', '30',
   'Below this many model records, the engine bootstraps from same-manufacturer/category data.'),
  ('pricing_iqr_multiplier', '1.0',
   'Range = median ± (quartile distance x this). 1.0 = the weighted IQR itself.'),
  ('pricing_bootstrap_range_multiplier', '1.5',
   'Extra range widening when bootstrap data is in use.'),
  ('pricing_bootstrap_weight_multiplier', '0.25',
   'Weight multiplier applied to bootstrap (non-model) observations.'),
  ('pricing_grade_factors', '{"A": 1.15, "B": 1.0, "C": 0.8, "D": 0.5}',
   'Relative value by condition grade, used to normalize observations to the requested grade.'),
  ('pricing_confidence_thresholds', '{"low": 3, "medium": 10, "high": 30}',
   'Effective (decayed) model-record weight required for each confidence tier.');

create or replace function public.suggest_price(
  p_master_equipment_id uuid,
  p_condition_grade text default 'B'
) returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_half_life numeric;
  v_min_records int;
  v_iqr_mult numeric;
  v_boot_range_mult numeric;
  v_boot_weight_mult numeric;
  v_factors jsonb;
  v_conf jsonb;
  v_target record;
  v_model_n int;
  v_bootstrap boolean := false;
  v_model_eff numeric;
  v_total_eff numeric;
  v_median numeric;
  v_q1 numeric;
  v_q3 numeric;
  v_mult numeric;
  v_confidence text;
  v_req_factor numeric;
begin
  select value::text::numeric into v_half_life from pricing_engine_settings where key = 'pricing_time_decay_half_life_days';
  select value::text::int into v_min_records from pricing_engine_settings where key = 'pricing_bootstrap_min_records';
  select value::text::numeric into v_iqr_mult from pricing_engine_settings where key = 'pricing_iqr_multiplier';
  select value::text::numeric into v_boot_range_mult from pricing_engine_settings where key = 'pricing_bootstrap_range_multiplier';
  select value::text::numeric into v_boot_weight_mult from pricing_engine_settings where key = 'pricing_bootstrap_weight_multiplier';
  select value into v_factors from pricing_engine_settings where key = 'pricing_grade_factors';
  select value into v_conf from pricing_engine_settings where key = 'pricing_confidence_thresholds';

  select manufacturer, category into v_target
  from master_equipment where id = p_master_equipment_id;
  if not found then
    return jsonb_build_object('has_data', false, 'error', 'unknown_equipment');
  end if;

  v_req_factor := coalesce((v_factors ->> upper(p_condition_grade))::numeric, 1.0);

  -- Model-record count decides bootstrap before scoring
  select count(*) into v_model_n from (
    select 1 from market_prices where master_equipment_id = p_master_equipment_id
    union all
    select 1 from transactions
    where master_equipment_id = p_master_equipment_id
      and status not in ('cancelled', 'refunded')
  ) c;
  v_bootstrap := v_model_n < v_min_records;

  -- One scoring pass. Non-model (sibling) observations participate only in
  -- bootstrap mode, at reduced weight, and never count toward confidence.
  with obs as (
    -- Own transactions: gold standard, weight 1.0
    select
      t.final_price as price,
      1.0::numeric as base_weight,
      t.created_at as observed_at,
      coalesce(t.condition_grade, 'B') as grade,
      true as is_model
    from transactions t
    where t.master_equipment_id = p_master_equipment_id
      and t.status not in ('cancelled', 'refunded')
      and t.final_price > 0
    union all
    -- Scraped observations for this model, plus same-manufacturer/category
    -- siblings when bootstrapping
    select
      coalesce(mp.sold_price, mp.asking_price),
      mp.weight * case when mp.master_equipment_id = p_master_equipment_id
                       then 1.0 else v_boot_weight_mult end,
      mp.scraped_at,
      coalesce(mp.inferred_grade, 'B'),
      mp.master_equipment_id = p_master_equipment_id
    from market_prices mp
    join master_equipment me on me.id = mp.master_equipment_id
    where coalesce(mp.sold_price, mp.asking_price) > 0
      and (
        mp.master_equipment_id = p_master_equipment_id
        or (v_bootstrap
            and me.manufacturer = v_target.manufacturer
            and me.category = v_target.category)
      )
  ),
  scored as (
    select
      -- Normalize to the requested grade
      price * v_req_factor / coalesce((v_factors ->> upper(grade))::numeric, 1.0) as adj_price,
      -- Time decay: weight halves every half-life
      base_weight * power(
        0.5,
        greatest(extract(epoch from (now() - observed_at)) / 86400.0, 0) / v_half_life
      ) as eff,
      is_model
    from obs
  ),
  ordered as (
    select adj_price, eff,
           sum(eff) over (order by adj_price, eff) as cum,
           sum(eff) over () as total
    from scored
    where eff > 0.001
  )
  select
    (select coalesce(sum(eff), 0) from scored where is_model),
    (select coalesce(sum(eff), 0) from scored),
    (select min(adj_price) from ordered where cum >= total * 0.5),
    (select min(adj_price) from ordered where cum >= total * 0.25),
    (select min(adj_price) from ordered where cum >= total * 0.75)
  into v_model_eff, v_total_eff, v_median, v_q1, v_q3;

  if v_median is null then
    return jsonb_build_object(
      'has_data', false,
      'model_records', v_model_n,
      'confidence', 'none'
    );
  end if;

  -- Confidence from decayed model-record weight only; bootstrap can never
  -- raise it above 'low'
  if v_bootstrap and v_total_eff > v_model_eff then
    v_confidence := case when v_total_eff >= (v_conf ->> 'low')::numeric
                         then 'low' else 'none' end;
  else
    v_confidence := case
      when v_model_eff >= (v_conf ->> 'high')::numeric then 'high'
      when v_model_eff >= (v_conf ->> 'medium')::numeric then 'medium'
      when v_model_eff >= (v_conf ->> 'low')::numeric then 'low'
      else 'none'
    end;
  end if;

  v_mult := v_iqr_mult * case when v_bootstrap and v_total_eff > v_model_eff
                              then v_boot_range_mult else 1.0 end;

  return jsonb_build_object(
    'has_data', true,
    'suggested_low', round(v_median - (v_median - v_q1) * v_mult, 2),
    'suggested_high', round(v_median + (v_q3 - v_median) * v_mult, 2),
    'median', round(v_median, 2),
    'confidence', v_confidence,
    'model_records', v_model_n,
    'effective_weight', round(v_total_eff, 3),
    'bootstrap_used', v_bootstrap and v_total_eff > v_model_eff,
    'grade', upper(p_condition_grade)
  );
end;
$$;

revoke execute on function public.suggest_price(uuid, text) from public, anon, authenticated;
grant execute on function public.suggest_price(uuid, text) to service_role;
