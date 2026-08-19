-- Adds the "most watched" sort option to search_listings(), needed by the
-- auction browse page's sort chips (ending soonest / most watched /
-- closest to me / price). The function previously supported five sorts
-- (best_match, ending_soonest, newly_letting -> newly_listed, price_low,
-- price_high, nearest) but had no watcher-count sort; passing
-- sort=most_watched silently fell through to the created_at desc
-- tiebreaker instead of erroring, which would have shipped a chip that
-- looked wired up but wasn't. This just adds the missing ORDER BY case —
-- same pattern as the other five, no other behavior changes.
create or replace function public.search_listings(p jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_q text := nullif(trim(coalesce(p ->> 'q', '')), '');
  v_tsq tsquery;
  v_category text := p ->> 'category';
  v_grades text[] := case when p ? 'condition_grades'
    then (select array_agg(upper(x)) from jsonb_array_elements_text(p -> 'condition_grades') x)
    else null end;
  v_price_min numeric := (p ->> 'price_min')::numeric;
  v_price_max numeric := (p ->> 'price_max')::numeric;
  v_type text := p ->> 'listing_type';
  v_buyer_zip text := p ->> 'buyer_zip';
  v_within numeric := (p ->> 'within_miles')::numeric;
  v_sort text := coalesce(p ->> 'sort', case when p ->> 'q' is not null then 'best_match' else 'newly_listed' end);
  v_page int := greatest(coalesce((p ->> 'page')::int, 1), 1);
  v_per_page int := least(greatest(coalesce((p ->> 'per_page')::int, 24), 1), 100);
  v_blat numeric;
  v_blng numeric;
  v_min_watchers int;
  v_result jsonb;
begin
  if v_q is not null then
    v_tsq := build_search_query(v_q);
  end if;

  if v_buyer_zip is not null then
    select lat, lng into v_blat, v_blng from zip_codes where zip = v_buyer_zip;
  end if;
  if v_sort = 'nearest' and v_blat is null then
    return jsonb_build_object('error', 'buyer_zip_required_for_nearest');
  end if;
  if v_within is not null and v_blat is null then
    return jsonb_build_object('error', 'buyer_zip_required_for_distance_filter');
  end if;

  select value::text::int into v_min_watchers
  from pricing_engine_settings where key = 'min_watchers_to_display';

  with filtered as (
    select
      l.id, l.title, me.manufacturer, me.model, me.category,
      l.condition_grade, l.listing_type, l.asking_price, l.current_bid,
      l.bid_count, l.auction_end, l.zip_code, l.quantity, l.created_at,
      case l.listing_type when 'auction' then coalesce(l.current_bid, l.asking_price)
           else l.asking_price end as effective_price,
      case when v_blat is not null and zl.zip is not null
           then haversine_miles(v_blat, v_blng, zl.lat, zl.lng) end as distance_miles,
      case when v_tsq is not null then ts_rank(
        to_tsvector('simple',
          coalesce(me.manufacturer, '') || ' ' || coalesce(me.model, '') || ' ' ||
          array_to_string(me.aliases, ' ') || ' ' || coalesce(l.title, '')),
        v_tsq) end as rank,
      (select count(*) from watchlists w where w.listing_id = l.id) as watchers,
      (select ph.url from listing_photos ph
       where ph.listing_id = l.id and ph.moderation_status = 'approved'
       order by ph.position asc limit 1) as photo_url
    from listings l
    join master_equipment me on me.id = l.master_equipment_id
    left join zip_codes zl on zl.zip = l.zip_code
    where l.status = 'active'
      and (v_tsq is null or to_tsvector('simple',
            coalesce(me.manufacturer, '') || ' ' || coalesce(me.model, '') || ' ' ||
            array_to_string(me.aliases, ' ') || ' ' || coalesce(l.title, '')) @@ v_tsq)
      and (v_category is null or me.category = v_category)
      and (v_grades is null or l.condition_grade = any(v_grades))
      and (v_type is null or l.listing_type = v_type)
      and (v_price_min is null or
           (case l.listing_type when 'auction' then coalesce(l.current_bid, l.asking_price)
                 else l.asking_price end) >= v_price_min)
      and (v_price_max is null or
           (case l.listing_type when 'auction' then coalesce(l.current_bid, l.asking_price)
                 else l.asking_price end) <= v_price_max)
      and (v_within is null or
           (zl.zip is not null and haversine_miles(v_blat, v_blng, zl.lat, zl.lng) <= v_within))
  ),
  page as (
    select * from filtered
    order by
      case when v_sort = 'best_match' then rank end desc nulls last,
      case when v_sort = 'ending_soonest' then auction_end end asc nulls last,
      case when v_sort = 'most_watched' then watchers end desc nulls last,
      case when v_sort = 'price_low' then effective_price end asc nulls last,
      case when v_sort = 'price_high' then effective_price end desc nulls last,
      case when v_sort = 'nearest' then distance_miles end asc nulls last,
      created_at desc
    limit v_per_page offset (v_page - 1) * v_per_page
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'page', v_page,
    'per_page', v_per_page,
    'results', coalesce((select jsonb_agg(jsonb_build_object(
      'id', pg.id,
      'title', pg.title,
      'manufacturer', pg.manufacturer,
      'model', pg.model,
      'category', pg.category,
      'condition_grade', pg.condition_grade,
      'listing_type', pg.listing_type,
      'asking_price', pg.asking_price,
      'current_bid', pg.current_bid,
      'bid_count', pg.bid_count,
      'auction_end', pg.auction_end,
      'zip_code', pg.zip_code,
      'quantity', pg.quantity,
      'effective_price', pg.effective_price,
      'distance_miles', case when pg.distance_miles is not null
                             then round(pg.distance_miles) end,
      -- Social-proof threshold: hidden entirely below the minimum
      'watcher_count', case when pg.watchers >= coalesce(v_min_watchers, 10)
                            then pg.watchers end,
      'photo_url', pg.photo_url
    )) from page pg), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;
