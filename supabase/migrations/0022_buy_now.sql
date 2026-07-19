-- Buy-it-now purchase flow. purchase_buy_now() atomically claims an active
-- listing and creates the pending_payment transaction; from there the
-- existing escrow machinery takes over unchanged (checkout -> capture ->
-- ship -> deliver -> inspect -> release).
--
-- Commission is read from settings and seeded at 0 — the phase 1 founding
-- seller launch benefit. Phase 2 fee review is a settings change, not a
-- migration.

-- ON CONFLICT: the key may already exist (e.g. added manually via the
-- admin panel / SQL editor). Never overwrite an existing value — it may
-- have been tuned deliberately.
insert into pricing_engine_settings (key, value, description) values
  ('buy_now_commission_pct', '0',
   'Seller commission on buy-it-now sales. 0 in phase 1 (founding seller launch benefit — not advertised as free forever). Reviewed at phase 2.')
on conflict (key) do nothing;

create or replace function public.purchase_buy_now(
  p_listing_id uuid,
  p_buyer_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  seller_user uuid;
  equip record;
  commission_pct numeric;
  commission numeric;
  tx_id uuid;
begin
  -- Same row-lock discipline as the auction functions: two buyers clicking
  -- Buy at the same moment serialize here — one wins, one sees already_sold
  select * into l from listings where id = p_listing_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'listing_not_found');
  end if;
  if l.listing_type <> 'buy_it_now' then
    return jsonb_build_object('ok', false, 'error', 'not_buy_now');
  end if;
  if l.status = 'sold' then
    return jsonb_build_object('ok', false, 'error', 'already_sold');
  end if;
  if l.status <> 'active' then
    return jsonb_build_object('ok', false, 'error', 'not_available');
  end if;
  if l.asking_price is null or l.asking_price <= 0 then
    return jsonb_build_object('ok', false, 'error', 'no_asking_price');
  end if;

  select user_id into seller_user from sellers where id = l.seller_id;
  if seller_user = p_buyer_id then
    return jsonb_build_object('ok', false, 'error', 'self_purchase');
  end if;

  select value::text::numeric into commission_pct
  from pricing_engine_settings where key = 'buy_now_commission_pct';
  commission := round(l.asking_price * coalesce(commission_pct, 0) / 100.0, 2);

  select manufacturer, model into equip
  from master_equipment where id = l.master_equipment_id;

  -- Denormalized pricing capture at sale time — no exceptions
  insert into transactions (
    listing_id, buyer_id, seller_id, master_equipment_id,
    manufacturer, model, condition_grade, final_price, commission_amount,
    listing_type, zip_code, status
  ) values (
    l.id, p_buyer_id, l.seller_id, l.master_equipment_id,
    equip.manufacturer, equip.model, coalesce(l.condition_grade, 'B'),
    l.asking_price, commission,
    'buy_it_now', l.zip_code, 'pending_payment'
  ) returning id into tx_id;

  update listings set status = 'sold' where id = l.id;

  return jsonb_build_object(
    'ok', true,
    'transaction_id', tx_id,
    'final_price', l.asking_price,
    'commission', commission
  );
end;
$$;

revoke execute on function public.purchase_buy_now(uuid, uuid) from public, anon, authenticated;
grant execute on function public.purchase_buy_now(uuid, uuid) to service_role;
