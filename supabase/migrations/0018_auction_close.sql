-- Auction close logic. A cron sweep (close_due_auction_lots) closes each
-- active auction lot whose auction_end has passed. Per-lot closing is
-- atomic and takes the same listing row lock as place_bid(), so a close
-- and a late bid on the same lot serialize: whichever wins the lock
-- decides — a bid that got in first auto-extends and the close skips; a
-- close that got in first makes the bid see 'auction_closed'.

insert into pricing_engine_settings (key, value, description) values
  ('auction_commission_pct', '10',
   'Seller commission on auction final sale price. In the seller agreement — change carefully.');

-- Close one lot. Outcomes:
--   sold                — winner + reserve met (or no reserve): transaction
--                         created at pending_payment, listing -> sold
--   reserve_not_met     — bumped to buy-it-now at the seller's pre-set
--                         asking price (also covers zero-bid lots that have
--                         an asking price)
--   expired             — zero bids and no asking price to bump to
--   skipped_*           — not actually due / not an active auction
create or replace function public.close_auction_lot(p_listing_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  winner record;
  equip record;
  commission_pct numeric;
  commission numeric;
  tx_id uuid;
begin
  select * into l from listings where id = p_listing_id for update;

  if not found then
    return jsonb_build_object('listing_id', p_listing_id, 'outcome', 'skipped_not_found');
  end if;
  if l.listing_type <> 'auction' or l.status <> 'active' then
    return jsonb_build_object('listing_id', p_listing_id, 'outcome', 'skipped_not_active_auction');
  end if;
  -- Re-check after acquiring the lock: a concurrent bid may have auto-extended
  if l.auction_end is null or l.auction_end > now() then
    return jsonb_build_object('listing_id', p_listing_id, 'outcome', 'skipped_not_due');
  end if;

  select b.bidder_id, b.id into winner
  from bids b
  where b.listing_id = p_listing_id and b.is_current_high;

  if winner.bidder_id is not null
     and (l.reserve_price is null or l.current_bid >= l.reserve_price) then
    -- SOLD. Denormalized pricing capture at sale time — no exceptions.
    select value::text::numeric into commission_pct
    from pricing_engine_settings where key = 'auction_commission_pct';
    commission := round(l.current_bid * commission_pct / 100.0, 2);

    select manufacturer, model into equip
    from master_equipment where id = l.master_equipment_id;

    insert into transactions (
      listing_id, buyer_id, seller_id, master_equipment_id,
      manufacturer, model, condition_grade, final_price, commission_amount,
      listing_type, zip_code, status
    ) values (
      l.id, winner.bidder_id, l.seller_id, l.master_equipment_id,
      equip.manufacturer, equip.model, coalesce(l.condition_grade, 'B'),
      l.current_bid, commission,
      'auction', l.zip_code, 'pending_payment'
    ) returning id into tx_id;

    update listings set status = 'sold' where id = l.id;
    -- The winning bid keeps is_current_high as the historical marker

    return jsonb_build_object(
      'listing_id', l.id, 'outcome', 'sold',
      'transaction_id', tx_id, 'winner_id', winner.bidder_id,
      'seller_id', l.seller_id, 'final_price', l.current_bid,
      'commission', commission, 'title', l.title
    );

  elsif l.asking_price is not null then
    -- Reserve not met (or no bids): auto-bump to buy-it-now at the seller's
    -- pre-set asking price. No action required from the seller.
    update listings
    set listing_type = 'buy_it_now',
        status = 'active',
        auction_start = null,
        auction_end = null,
        current_bid = null
    where id = l.id;
    -- Clear the high flag so a future return to auction starts clean
    update bids set is_current_high = false where listing_id = l.id;

    return jsonb_build_object(
      'listing_id', l.id, 'outcome', 'reserve_not_met',
      'seller_id', l.seller_id, 'asking_price', l.asking_price,
      'had_bids', winner.bidder_id is not null, 'title', l.title
    );

  else
    -- Nothing to bump to
    update listings set status = 'expired' where id = l.id;
    update bids set is_current_high = false where listing_id = l.id;

    return jsonb_build_object(
      'listing_id', l.id, 'outcome', 'expired',
      'seller_id', l.seller_id, 'title', l.title
    );
  end if;
end;
$$;

-- The sweep: close every due lot, oldest close time first. p_limit bounds
-- the transaction size; the next cron tick picks up any remainder.
create or replace function public.close_due_auction_lots(p_limit int default 50)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  results jsonb := '[]'::jsonb;
  closed int := 0;
begin
  for r in
    select id from listings
    where listing_type = 'auction' and status = 'active' and auction_end <= now()
    order by auction_end asc
    limit p_limit
  loop
    results := results || close_auction_lot(r.id);
    closed := closed + 1;
  end loop;

  return jsonb_build_object('processed', closed, 'results', results);
end;
$$;

revoke execute on function public.close_auction_lot(uuid) from public, anon, authenticated;
revoke execute on function public.close_due_auction_lots(int) from public, anon, authenticated;
grant execute on function public.close_auction_lot(uuid) to service_role;
grant execute on function public.close_due_auction_lots(int) to service_role;
