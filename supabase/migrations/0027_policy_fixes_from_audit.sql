-- Fixes from the empirical security audit.
--
-- 1) CRITICAL: seller-own policies subqueried the sellers table directly.
--    Policy subqueries run with the CALLER's privileges, and anon has no
--    grant on sellers (correctly) — so every table whose select policies
--    OR'd in a sellers subquery was completely unreadable anonymously:
--    listings, listing_photos, qc_responses, qa_messages. The public
--    marketplace 500'd for logged-out visitors. Fix: current_seller_id()
--    is SECURITY DEFINER (same pattern as is_admin()) so policy
--    evaluation never touches sellers with caller privileges.
-- 2) seller_strikes: read-own policy existed with no base grant (inert).
-- 3) master_equipment: RLS + public read of approved records per the
--    CLAUDE.md RLS spec (idempotent — 0001 never enabled RLS);
--    scrape log locked with RLS enabled, service-role only.

create or replace function public.current_seller_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from sellers where user_id = auth.uid();
$$;

-- ---- listings ----------------------------------------------------------
drop policy if exists listings_seller_read_own on listings;
create policy listings_seller_read_own on listings
  for select using (seller_id = current_seller_id() or is_admin());

drop policy if exists listings_seller_insert_own on listings;
create policy listings_seller_insert_own on listings
  for insert with check (seller_id = current_seller_id());

drop policy if exists listings_seller_update_own on listings;
create policy listings_seller_update_own on listings
  for update using (seller_id = current_seller_id() or is_admin());

-- ---- listing_photos ----------------------------------------------------
drop policy if exists listing_photos_seller_read_own on listing_photos;
create policy listing_photos_seller_read_own on listing_photos
  for select using (
    listing_id in (select id from listings where seller_id = current_seller_id())
    or is_admin()
  );

drop policy if exists listing_photos_seller_insert_own on listing_photos;
create policy listing_photos_seller_insert_own on listing_photos
  for insert with check (
    listing_id in (select id from listings where seller_id = current_seller_id())
  );

drop policy if exists listing_photos_seller_delete_own on listing_photos;
create policy listing_photos_seller_delete_own on listing_photos
  for delete using (
    listing_id in (select id from listings where seller_id = current_seller_id())
    or is_admin()
  );

-- ---- qc_responses ------------------------------------------------------
drop policy if exists qc_seller_own on qc_responses;
create policy qc_seller_own on qc_responses
  for select using (
    listing_id in (select id from listings where seller_id = current_seller_id())
    or is_admin()
  );

drop policy if exists qc_seller_insert_own on qc_responses;
create policy qc_seller_insert_own on qc_responses
  for insert with check (
    listing_id in (select id from listings where seller_id = current_seller_id())
  );

drop policy if exists qc_seller_update_own on qc_responses;
create policy qc_seller_update_own on qc_responses
  for update using (
    listing_id in (select id from listings where seller_id = current_seller_id())
    or is_admin()
  );

-- ---- qa_messages -------------------------------------------------------
drop policy if exists qa_seller_read_own_listings on qa_messages;
create policy qa_seller_read_own_listings on qa_messages
  for select using (
    listing_id in (select id from listings where seller_id = current_seller_id())
    or is_admin()
  );

-- ---- transactions / disputes / reviews ---------------------------------
drop policy if exists transactions_parties_read on transactions;
create policy transactions_parties_read on transactions
  for select using (
    buyer_id = auth.uid() or seller_id = current_seller_id() or is_admin()
  );

drop policy if exists disputes_parties_read on disputes;
create policy disputes_parties_read on disputes
  for select using (
    transaction_id in (
      select id from transactions
      where buyer_id = auth.uid() or seller_id = current_seller_id()
    )
    or is_admin()
  );

drop policy if exists disputes_party_insert on disputes;
create policy disputes_party_insert on disputes
  for insert with check (
    filed_by = auth.uid()
    and transaction_id in (
      select id from transactions
      where buyer_id = auth.uid() or seller_id = current_seller_id()
    )
  );

drop policy if exists reviews_party_insert on reviews;
create policy reviews_party_insert on reviews
  for insert with check (
    reviewer_id = auth.uid()
    and transaction_id in (
      select id from transactions
      where buyer_id = auth.uid() or seller_id = current_seller_id()
    )
  );

-- ---- seller_strikes ----------------------------------------------------
drop policy if exists seller_strikes_seller_read_own on seller_strikes;
create policy seller_strikes_seller_read_own on seller_strikes
  for select using (seller_id = current_seller_id() or is_admin());

grant select on seller_strikes to authenticated;

-- ---- master_equipment: public reference, approved records only ---------
alter table master_equipment enable row level security;
alter table master_equipment_scrape_log enable row level security;

drop policy if exists master_equipment_public_read_approved on master_equipment;
create policy master_equipment_public_read_approved on master_equipment
  for select using (status = 'approved' or is_admin());

grant select on master_equipment to anon, authenticated;
-- scrape log: RLS on, no policies, no client grants — service role only
