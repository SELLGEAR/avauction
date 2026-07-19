-- Proxy bidding engine. All bid placement goes through place_bid() — an
-- atomic function that serializes concurrent bids with a row lock on the
-- listing, resolves proxy battles, applies auto-extend, and keeps the
-- public-safe current_bid/bid_count columns on listings in sync (clients
-- subscribe to the listings row via Supabase realtime; the bids table
-- itself is not publicly readable because of max_bid_encrypted).

-- Public-safe live auction state. Updated only by place_bid().
alter table listings
  add column current_bid numeric,
  add column bid_count int not null default 0;

-- The current high bid row is flagged explicitly rather than derived by
-- sorting: rows inserted in the same transaction share a created_at, so
-- amount+time ordering is nondeterministic on ties (and picks the stale
-- ceiling row on self-raises).
alter table bids
  add column is_current_high boolean not null default false;

create unique index bids_one_current_high_per_listing
  on bids (listing_id) where is_current_high;

-- Tiered bid increment ladder — admin-tunable without a code change.
-- "up_to" null = no upper bound (top tier).
insert into pricing_engine_settings (key, value, description) values
  ('bid_increment_tiers',
   '[{"up_to": 500, "increment": 25},
     {"up_to": 2500, "increment": 50},
     {"up_to": 10000, "increment": 100},
     {"up_to": 25000, "increment": 250},
     {"up_to": 100000, "increment": 500},
     {"up_to": null, "increment": 1000}]',
   'Minimum raise by current-bid bracket. A bid must be at least current_bid + increment for its bracket.'),
  ('auction_opening_bid_minimum', '25',
   'Minimum first bid on any lot. Placeholder policy — Tom to confirm whether lots should open at a set floor instead.');

-- Increment for a given current-bid amount, from the ladder above.
create or replace function public.get_bid_increment(p_amount numeric, p_tiers jsonb)
returns numeric
language plpgsql
immutable
as $$
declare
  tier jsonb;
begin
  for tier in select * from jsonb_array_elements(p_tiers)
  loop
    if tier->>'up_to' is null or p_amount < (tier->>'up_to')::numeric then
      return (tier->>'increment')::numeric;
    end if;
  end loop;
  return 1000; -- unreachable if the ladder has a null top tier; safe fallback
end;
$$;

-- place_bid — the single entry point for all bids.
--
-- p_max_bid is the bidder's proxy ceiling (for a non-proxy mental model the
-- bidder's entered amount IS their ceiling). It arrives in plaintext for
-- this transaction only; what's stored is pgp_sym_encrypt ciphertext using
-- p_key, which the API layer supplies from its environment. The key is
-- never stored in the database. NOTE: rotating the key mid-auction breaks
-- resolution for open lots — rotate only between auction weeks.
--
-- Proxy rules (eBay-standard):
--   - challenger's ceiling > incumbent's: challenger leads at
--     min(incumbent_max + increment, challenger_max)
--   - challenger's ceiling <= incumbent's (ties included): incumbent holds
--     at min(challenger_max + increment, incumbent_max); challenger is
--     outbid immediately
--   - the incumbent raising their own ceiling never raises the visible bid
create or replace function public.place_bid(
  p_listing_id uuid,
  p_bidder_id uuid,
  p_max_bid numeric,
  p_key text
) returns jsonb
language plpgsql
security definer
-- extensions schema included because Supabase installs pgcrypto there
set search_path = public, extensions
as $$
declare
  l record;
  tiers jsonb;
  opening_min numeric;
  extend_min int;
  inc numeric;
  required_min numeric;
  incumbent record;
  incumbent_max numeric;
  new_display numeric;
  outbid_user uuid := null;
  extended boolean := false;
  new_end timestamptz;
begin
  -- Serialize all bidding on this lot
  select * into l from listings where id = p_listing_id for update;

  if not found then
    return jsonb_build_object('accepted', false, 'error', 'listing_not_found');
  end if;
  if l.listing_type <> 'auction' or l.status <> 'active' then
    return jsonb_build_object('accepted', false, 'error', 'not_biddable');
  end if;
  if l.auction_start is null or now() < l.auction_start then
    return jsonb_build_object('accepted', false, 'error', 'bidding_not_open');
  end if;
  if l.auction_end is null or now() >= l.auction_end then
    return jsonb_build_object('accepted', false, 'error', 'auction_closed');
  end if;

  select value into tiers from pricing_engine_settings where key = 'bid_increment_tiers';
  select value::text::numeric into opening_min from pricing_engine_settings where key = 'auction_opening_bid_minimum';
  select value::text::int into extend_min from pricing_engine_settings where key = 'auction_auto_extend_minutes';

  select b.id, b.bidder_id, b.max_bid_encrypted
    into incumbent
  from bids b
  where b.listing_id = p_listing_id and b.is_current_high;

  if incumbent.id is null then
    -- First bid on the lot
    if p_max_bid < opening_min then
      return jsonb_build_object('accepted', false, 'error', 'below_opening_minimum',
                                'minimum', opening_min);
    end if;
    new_display := opening_min;
    insert into bids (listing_id, bidder_id, bid_amount, max_bid_encrypted, is_proxy_bid, is_current_high)
    values (p_listing_id, p_bidder_id, new_display,
            encode(pgp_sym_encrypt(p_max_bid::text, p_key), 'base64'), false, true);

  elsif incumbent.bidder_id = p_bidder_id then
    -- Incumbent raising their own ceiling: visible bid unchanged, high flag
    -- moves to the new ceiling row
    incumbent_max := pgp_sym_decrypt(decode(incumbent.max_bid_encrypted, 'base64'), p_key)::numeric;
    if p_max_bid <= incumbent_max then
      return jsonb_build_object('accepted', false, 'error', 'ceiling_not_raised',
                                'minimum', incumbent_max);
    end if;
    new_display := l.current_bid;
    update bids set is_current_high = false where id = incumbent.id;
    insert into bids (listing_id, bidder_id, bid_amount, max_bid_encrypted, is_proxy_bid, is_current_high)
    values (p_listing_id, p_bidder_id, new_display,
            encode(pgp_sym_encrypt(p_max_bid::text, p_key), 'base64'), false, true);

  else
    -- Challenger vs incumbent
    inc := get_bid_increment(l.current_bid, tiers);
    required_min := l.current_bid + inc;
    if p_max_bid < required_min then
      return jsonb_build_object('accepted', false, 'error', 'bid_too_low',
                                'minimum', required_min);
    end if;

    incumbent_max := pgp_sym_decrypt(decode(incumbent.max_bid_encrypted, 'base64'), p_key)::numeric;
    update bids set is_current_high = false where id = incumbent.id;

    if p_max_bid > incumbent_max then
      -- Challenger takes the lead
      new_display := least(incumbent_max + get_bid_increment(incumbent_max, tiers), p_max_bid);
      -- Incumbent's proxy defends up to its ceiling before losing
      if incumbent_max > l.current_bid then
        insert into bids (listing_id, bidder_id, bid_amount, max_bid_encrypted, is_proxy_bid, is_current_high)
        values (p_listing_id, incumbent.bidder_id, incumbent_max,
                incumbent.max_bid_encrypted, true, false);
      end if;
      insert into bids (listing_id, bidder_id, bid_amount, max_bid_encrypted, is_proxy_bid, is_current_high)
      values (p_listing_id, p_bidder_id, new_display,
              encode(pgp_sym_encrypt(p_max_bid::text, p_key), 'base64'), false, true);
      outbid_user := incumbent.bidder_id;
    else
      -- Incumbent's proxy holds (ties favor the earlier ceiling)
      new_display := least(p_max_bid + get_bid_increment(p_max_bid, tiers), incumbent_max);
      insert into bids (listing_id, bidder_id, bid_amount, max_bid_encrypted, is_proxy_bid, is_current_high)
      values (p_listing_id, p_bidder_id, p_max_bid,
              encode(pgp_sym_encrypt(p_max_bid::text, p_key), 'base64'), false, false);
      insert into bids (listing_id, bidder_id, bid_amount, max_bid_encrypted, is_proxy_bid, is_current_high)
      values (p_listing_id, incumbent.bidder_id, new_display,
              incumbent.max_bid_encrypted, true, true);
      outbid_user := p_bidder_id;
    end if;
  end if;

  -- Auto-extend: a bid inside the final window pushes the close out
  new_end := l.auction_end;
  if l.auction_end - now() <= make_interval(mins => extend_min) then
    new_end := l.auction_end + make_interval(mins => extend_min);
    extended := true;
  end if;

  update listings
  set current_bid = new_display,
      bid_count = (select count(*) from bids where listing_id = p_listing_id),
      auction_end = new_end
  where id = p_listing_id;

  return jsonb_build_object(
    'accepted', true,
    'current_bid', new_display,
    'is_high_bidder', outbid_user is distinct from p_bidder_id,
    'outbid_user_id', outbid_user,
    'extended', extended,
    'auction_end', new_end,
    'reserve_met', l.reserve_price is not null and new_display >= l.reserve_price
  );
end;
$$;

-- Service role only — bids never come from clients directly. The API route
-- authenticates the buyer, rate limits, and supplies the encryption key.
revoke execute on function public.place_bid(uuid, uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.place_bid(uuid, uuid, numeric, text) to service_role;
