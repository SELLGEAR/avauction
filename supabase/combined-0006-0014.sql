-- Combined migrations 0006-0014 — generated 2026-07-18 for one-shot paste into the Supabase SQL editor.
-- Runs as a single transaction: if any statement fails, nothing is applied.
-- Do not re-run after success: these are plain CREATE statements, not idempotent.

begin;

-- ============================================================
-- 0006_create_users_sellers.sql
-- ============================================================

-- Platform user and seller tables, plus the two helper functions every
-- subsequent migration's RLS policies depend on.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- users — one row per auth account. id mirrors auth.users so auth.uid()
-- works directly in RLS policies.
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'buyer'
    check (role in ('buyer', 'seller', 'admin')),
  buyer_tier text not null default 'standard'
    check (buyer_tier in ('standard', 'concierge_basic', 'concierge_pro', 'concierge_premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

-- is_admin() must be created AFTER the users table: sql-language function
-- bodies are validated at creation time, so defining it earlier fails on the
-- missing table. It is SECURITY DEFINER so RLS policies on the users table
-- itself can call it without infinite recursion (a plain subquery on users
-- inside a users policy re-triggers the policy).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$;

alter table users enable row level security;

create policy users_select_own on users
  for select using (id = auth.uid() or is_admin());

create policy users_insert_own on users
  for insert with check (id = auth.uid());

-- role and buyer_tier changes go through the service role (API routes), not
-- direct client updates — this policy only lets a user edit their own row,
-- and the API layer restricts which columns.
create policy users_update_own on users
  for update using (id = auth.uid() or is_admin());

create policy users_admin_delete on users
  for delete using (is_admin());

-- sellers — business identity, verification, and payout linkage. Individual
-- accounts get a row too (account_type = 'individual', business fields null).
create table sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users (id) on delete cascade,
  account_type text not null default 'business'
    check (account_type in ('individual', 'business')),
  business_name text,
  ein text,
  business_type text
    check (business_type in ('rental_house', 'integrator', 'production_company', 'dealer', 'other')),
  website text,
  phone text,
  years_in_business int,
  verification_status text not null default 'provisional'
    check (verification_status in ('provisional', 'verified', 'trusted')),
  seller_tier text not null default 'standard'
    check (seller_tier in ('standard', 'power', 'enterprise')),
  -- Invitation-only top trust badge, granted personally by Tom
  industry_verified boolean not null default false,
  -- Platform-assigned public identity (e.g. VerifiedSeller_4471). Company
  -- name is never shown to buyers until escrow is funded.
  anonymous_username text unique,
  -- Optional general location display ("Nashville, TN rental house") for the
  -- trust boost — never the exact address
  display_location text,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sellers_set_updated_at
  before update on sellers
  for each row execute function set_updated_at();

alter table sellers enable row level security;

-- No public select: business_name, ein, and contact details must stay hidden
-- from buyers. Public-safe seller info (anonymous_username, trust tier)
-- reaches listings via API routes using the service role.
create policy sellers_select_own on sellers
  for select using (user_id = auth.uid() or is_admin());

create policy sellers_insert_own on sellers
  for insert with check (user_id = auth.uid());

create policy sellers_update_own on sellers
  for update using (user_id = auth.uid() or is_admin());

create policy sellers_admin_delete on sellers
  for delete using (is_admin());

-- ============================================================
-- 0007_create_listings_listing_photos.sql
-- ============================================================

-- listings — seller inventory. Every listing links to a master_equipment
-- record and never stores product specs (database rule: specs are inherited
-- from the master record; the listing carries only seller-specific details).
create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers (id) on delete cascade,
  master_equipment_id uuid not null references master_equipment (id),
  title text not null,
  -- Seller/AI-written condition narrative — not product specs
  description text,
  condition_grade text
    check (condition_grade in ('A', 'B', 'C', 'D')),
  -- Flagged for admin review when the seller overrode the QC-suggested grade
  grade_override boolean not null default false,
  quantity int not null default 1 check (quantity > 0),
  hours_of_use int,
  serial_numbers text[] not null default '{}',
  year_of_manufacture int,
  purchase_year int,
  zip_code text not null,
  asking_price numeric,
  reserve_price numeric,
  -- Week 2 Session 1 locked decision: single table for all listing types
  listing_type text not null
    check (listing_type in ('auction', 'buy_it_now', 'flash_listing')),
  auction_start timestamptz,
  auction_end timestamptz,
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'active', 'sold', 'expired', 'delisted')),
  -- When a seller delists, platform asks "Was this sold through AVauction?"
  -- No answer logs a private-sale flag (non-circumvention review signal)
  delist_reason text
    check (delist_reason in ('sold_on_platform', 'sold_privately', 'no_longer_selling', 'no_answer')),
  featured boolean not null default false,
  priority int not null default 0,
  entry_method text
    check (entry_method in ('manual', 'barcode_scan', 'form')),
  flight_case_included boolean,
  -- Required disclosure — cannot be blank (business rule)
  known_issues text not null default 'None disclosed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger listings_set_updated_at
  before update on listings
  for each row execute function set_updated_at();

create index listings_seller_id_idx on listings (seller_id);
create index listings_master_equipment_id_idx on listings (master_equipment_id);
create index listings_status_type_idx on listings (status, listing_type);
create index listings_auction_end_idx on listings (auction_end)
  where listing_type = 'auction';

alter table listings enable row level security;

create policy listings_public_read_active on listings
  for select using (status in ('active', 'sold'));

create policy listings_seller_read_own on listings
  for select using (
    seller_id in (select id from sellers where user_id = auth.uid())
    or is_admin()
  );

create policy listings_seller_insert_own on listings
  for insert with check (
    seller_id in (select id from sellers where user_id = auth.uid())
  );

-- Sellers edit their own listings; status transitions to 'active' happen via
-- admin approval through the service role, not client updates.
create policy listings_seller_update_own on listings
  for update using (
    seller_id in (select id from sellers where user_id = auth.uid())
    or is_admin()
  );

create policy listings_admin_delete on listings
  for delete using (is_admin());

-- listing_photos — minimum 8 enforced at the application layer; each photo
-- has a guided shot type and carries its moderation outcome.
create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  url text not null,
  photo_type text not null default 'other'
    check (photo_type in (
      'front', 'back', 'left_side', 'right_side', 'damage_closeup',
      'powered_on', 'serial_label', 'flight_case', 'packaging_preship', 'other'
    )),
  position int not null default 0,
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'rejected', 'borderline')),
  moderation_score numeric,
  created_at timestamptz not null default now()
);

create index listing_photos_listing_id_idx on listing_photos (listing_id);

alter table listing_photos enable row level security;

create policy listing_photos_public_read on listing_photos
  for select using (
    moderation_status = 'approved'
    and listing_id in (select id from listings where status in ('active', 'sold'))
  );

create policy listing_photos_seller_read_own on listing_photos
  for select using (
    listing_id in (
      select l.id from listings l
      join sellers s on s.id = l.seller_id
      where s.user_id = auth.uid()
    )
    or is_admin()
  );

create policy listing_photos_seller_insert_own on listing_photos
  for insert with check (
    listing_id in (
      select l.id from listings l
      join sellers s on s.id = l.seller_id
      where s.user_id = auth.uid()
    )
  );

create policy listing_photos_seller_delete_own on listing_photos
  for delete using (
    listing_id in (
      select l.id from listings l
      join sellers s on s.id = l.seller_id
      where s.user_id = auth.uid()
    )
    or is_admin()
  );

create policy listing_photos_admin_update on listing_photos
  for update using (is_admin());

-- ============================================================
-- 0008_create_bids_watchlists_saved_searches.sql
-- ============================================================

-- bids — Week 2 Session 1 locked decision: proxy bidding. The proxy ceiling
-- (max_bid_encrypted) is encrypted at rest by the application before insert
-- and is never visible to anyone, including admins reading the table.
create table bids (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  bidder_id uuid not null references users (id),
  bid_amount numeric not null check (bid_amount > 0),
  max_bid_encrypted text,
  is_proxy_bid boolean not null default false,
  created_at timestamptz not null default now()
);

create index bids_listing_id_created_idx on bids (listing_id, created_at desc);
create index bids_bidder_id_idx on bids (bidder_id);

alter table bids enable row level security;

-- No public select on the base table: max_bid_encrypted must never be
-- exposed. Public bid history goes through the bid_history view below.
create policy bids_bidder_read_own on bids
  for select using (bidder_id = auth.uid() or is_admin());

-- Bid inserts run through the API layer (validation, proxy resolution,
-- auto-extend) using the service role. The direct-insert policy still checks
-- identity so a client can only ever bid as itself.
create policy bids_bidder_insert_own on bids
  for insert with check (bidder_id = auth.uid());

-- Public bid history — amounts and timing only, never the proxy ceiling and
-- never the bidder's real identity (anonymous usernames resolve in the API).
create view bid_history
  with (security_invoker = false)
  as
  select b.id, b.listing_id, b.bid_amount, b.is_proxy_bid, b.created_at
  from bids b
  join listings l on l.id = b.listing_id
  where l.status in ('active', 'sold');

grant select on bid_history to anon, authenticated;

-- watchlists — Week 2 locked: a row watches either a specific listing OR a
-- model generally. Doubles as demand intelligence for the trading desk
-- (grouped by master_equipment_id).
create table watchlists (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users (id) on delete cascade,
  listing_id uuid references listings (id) on delete cascade,
  master_equipment_id uuid references master_equipment (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (listing_id is not null or master_equipment_id is not null)
);

create unique index watchlists_buyer_listing_key
  on watchlists (buyer_id, listing_id) where listing_id is not null;
create unique index watchlists_buyer_model_key
  on watchlists (buyer_id, master_equipment_id) where master_equipment_id is not null;
create index watchlists_master_equipment_idx on watchlists (master_equipment_id);

alter table watchlists enable row level security;

create policy watchlists_own on watchlists
  for all using (buyer_id = auth.uid() or is_admin())
  with check (buyer_id = auth.uid());

-- saved_searches — criteria-based searches with email alerts (distinct from
-- watchlists, which track a specific listing or model).
create table saved_searches (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references users (id) on delete cascade,
  name text,
  -- Filter criteria: category, manufacturer, model, condition grades, price
  -- range, zip/distance, listing_type — kept as jsonb so the search UI can
  -- evolve without migrations
  filters jsonb not null default '{}'::jsonb,
  email_alerts boolean not null default true,
  last_alerted_at timestamptz,
  created_at timestamptz not null default now()
);

create index saved_searches_buyer_id_idx on saved_searches (buyer_id);

alter table saved_searches enable row level security;

create policy saved_searches_own on saved_searches
  for all using (buyer_id = auth.uid() or is_admin())
  with check (buyer_id = auth.uid());

-- ============================================================
-- 0009_create_transactions_disputes.sql
-- ============================================================

-- transactions — every completed sale. Records the full pricing-intelligence
-- capture set (manufacturer, model, condition, final price, date, zip,
-- listing type) denormalized at sale time — no exceptions. This is the data
-- asset everything else is built on.
create table transactions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id),
  buyer_id uuid not null references users (id),
  seller_id uuid not null references sellers (id),
  master_equipment_id uuid references master_equipment (id),
  -- Denormalized capture at sale time (master records can change later;
  -- the transaction record must not)
  manufacturer text not null,
  model text not null,
  condition_grade text not null
    check (condition_grade in ('A', 'B', 'C', 'D')),
  final_price numeric not null check (final_price >= 0),
  commission_amount numeric not null default 0,
  listing_type text not null
    check (listing_type in ('auction', 'buy_it_now', 'flash_listing')),
  zip_code text not null,
  stripe_payment_intent_id text,
  -- Week 2 Session 1 locked decision: complete transaction state machine.
  -- Replaces the earlier held/released/disputed escrow_status field — escrow
  -- state is derivable from status.
  status text not null default 'pending_payment'
    check (status in (
      'pending_payment', 'payment_captured', 'awaiting_shipment', 'shipped',
      'delivered', 'inspection_open', 'inspection_closed', 'released',
      'disputed', 'dispute_resolved', 'refunded', 'cancelled'
    )),
  tracking_number text,
  -- Inspection window duration comes from pricing_engine_settings
  -- (inspection_window_hours, default 72)
  inspection_deadline timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger transactions_set_updated_at
  before update on transactions
  for each row execute function set_updated_at();

create index transactions_buyer_id_idx on transactions (buyer_id);
create index transactions_seller_id_idx on transactions (seller_id);
create index transactions_master_equipment_idx on transactions (master_equipment_id);
create index transactions_status_idx on transactions (status);

alter table transactions enable row level security;

-- Buyer and seller read their own transactions only; no public access.
-- All writes (state transitions, escrow moves) happen via the service role —
-- clients never write transaction rows directly.
create policy transactions_parties_read on transactions
  for select using (
    buyer_id = auth.uid()
    or seller_id in (select id from sellers where user_id = auth.uid())
    or is_admin()
  );

-- disputes — buyer-raised issues freeze the payout (status -> 'disputed').
create table disputes (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id) on delete cascade,
  filed_by uuid not null references users (id),
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'resolved')),
  resolution text,
  created_at timestamptz not null default now()
);

create index disputes_transaction_id_idx on disputes (transaction_id);

alter table disputes enable row level security;

create policy disputes_parties_read on disputes
  for select using (
    transaction_id in (
      select t.id from transactions t
      where t.buyer_id = auth.uid()
         or t.seller_id in (select id from sellers where user_id = auth.uid())
    )
    or is_admin()
  );

create policy disputes_party_insert on disputes
  for insert with check (
    filed_by = auth.uid()
    and transaction_id in (
      select t.id from transactions t
      where t.buyer_id = auth.uid()
         or t.seller_id in (select id from sellers where user_id = auth.uid())
    )
  );

create policy disputes_admin_update on disputes
  for update using (is_admin());

-- ============================================================
-- 0010_create_reviews_seller_strikes.sql
-- ============================================================

-- reviews — bidirectional, one per transaction per direction. Buyers rate
-- accuracy/condition/communication/shipping; sellers rate payment and
-- communication. Both give an overall star rating.
create table reviews (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references transactions (id) on delete cascade,
  reviewer_id uuid not null references users (id),
  reviewee_user_id uuid not null references users (id),
  direction text not null
    check (direction in ('buyer_of_seller', 'seller_of_buyer')),
  accuracy_rating int check (accuracy_rating between 1 and 5),
  condition_rating int check (condition_rating between 1 and 5),
  communication_rating int check (communication_rating between 1 and 5),
  shipping_rating int check (shipping_rating between 1 and 5),
  payment_rating int check (payment_rating between 1 and 5),
  overall_rating int not null check (overall_rating between 1 and 5),
  comment text,
  -- Set when the reviewer opened a dispute on this transaction and lost —
  -- the review stays visible but is weighted lower in the trust score
  flagged boolean not null default false,
  weight numeric not null default 1.0,
  -- Admin moderation: removed reviews stay in the table for the audit trail
  removed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (transaction_id, direction)
);

create index reviews_reviewee_idx on reviews (reviewee_user_id);

alter table reviews enable row level security;

-- Reviews are public trust signals — visible to buyers on every listing
create policy reviews_public_read on reviews
  for select using (not removed);

create policy reviews_admin_read_all on reviews
  for select using (is_admin());

create policy reviews_party_insert on reviews
  for insert with check (
    reviewer_id = auth.uid()
    and transaction_id in (
      select t.id from transactions t
      where t.buyer_id = auth.uid()
         or t.seller_id in (select id from sellers where user_id = auth.uid())
    )
  );

create policy reviews_admin_update on reviews
  for update using (is_admin());

-- seller_strikes — the fulfillment strike system. Three strikes = permanent
-- suspension. Strikes are issued by admin only.
create table seller_strikes (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers (id) on delete cascade,
  violation_type text not null
    check (violation_type in (
      'sold_privately_not_updated',   -- item sold privately, listing left up
      'failed_fulfillment',           -- listed available, could not fulfill
      'condition_mismatch',           -- gear significantly different from listing
      'serial_mismatch',              -- serial number does not match listing
      'location_mismatch',            -- gear not at listed zip code
      'private_sale_flag'             -- soft flag from delist prompt, not a full strike
    )),
  -- Private-sale flags accumulate toward non-circumvention review but do not
  -- count as strikes
  is_strike boolean not null default true,
  listing_id uuid references listings (id),
  transaction_id uuid references transactions (id),
  notes text,
  issued_by uuid references users (id),
  created_at timestamptz not null default now()
);

create index seller_strikes_seller_id_idx on seller_strikes (seller_id);

alter table seller_strikes enable row level security;

create policy seller_strikes_seller_read_own on seller_strikes
  for select using (
    seller_id in (select id from sellers where user_id = auth.uid())
    or is_admin()
  );

create policy seller_strikes_admin_write on seller_strikes
  for insert with check (is_admin());

create policy seller_strikes_admin_update on seller_strikes
  for update using (is_admin());

create policy seller_strikes_admin_delete on seller_strikes
  for delete using (is_admin());

-- ============================================================
-- 0011_create_qa_messages_qc_responses.sql
-- ============================================================

-- qa_messages — the only buyer-seller communication channel. Every message
-- is scanned by Claude for identifying information before posting; flagged
-- messages are blocked and logged (business rule: AI contact scanning).
create table qa_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  buyer_id uuid not null references users (id),
  question text not null,
  answer text,
  -- Seller chooses public or private per answer
  is_public boolean not null default false,
  -- AI contact scan hit — blocked from display, kept for the audit log
  flagged boolean not null default false,
  flag_reason text,
  answered_at timestamptz,
  created_at timestamptz not null default now()
);

create index qa_messages_listing_id_idx on qa_messages (listing_id);

alter table qa_messages enable row level security;

create policy qa_public_read on qa_messages
  for select using (is_public and not flagged and answer is not null);

create policy qa_buyer_read_own on qa_messages
  for select using (buyer_id = auth.uid());

create policy qa_seller_read_own_listings on qa_messages
  for select using (
    listing_id in (
      select l.id from listings l
      join sellers s on s.id = l.seller_id
      where s.user_id = auth.uid()
    )
    or is_admin()
  );

-- Inserts and answers flow through the API layer (service role) so the AI
-- contact scan always runs first — no direct client insert policy on purpose.

create policy qa_admin_update on qa_messages
  for update using (is_admin());

-- qc_responses — the gear entry checklist. The platform calculates
-- suggested_grade from these answers; seller accepts or overrides (overrides
-- flagged for admin review via listings.grade_override).
create table qc_responses (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null unique references listings (id) on delete cascade,
  powers_on boolean not null,
  all_components boolean not null,
  flight_case boolean not null,
  cosmetic_damage text not null
    check (cosmetic_damage in ('none', 'minor', 'significant')),
  known_issues boolean not null,
  known_issues_description text,
  serviced boolean not null,
  service_description text,
  serial_confirmed boolean not null default false,
  suggested_grade text
    check (suggested_grade in ('A', 'B', 'C', 'D')),
  seller_accepted_grade boolean not null default true,
  created_at timestamptz not null default now()
);

alter table qc_responses enable row level security;

-- QC answers surface on the public listing page (buyers see the checklist
-- outcomes for active listings)
create policy qc_public_read_active on qc_responses
  for select using (
    listing_id in (select id from listings where status in ('active', 'sold'))
  );

create policy qc_seller_own on qc_responses
  for select using (
    listing_id in (
      select l.id from listings l
      join sellers s on s.id = l.seller_id
      where s.user_id = auth.uid()
    )
    or is_admin()
  );

create policy qc_seller_insert_own on qc_responses
  for insert with check (
    listing_id in (
      select l.id from listings l
      join sellers s on s.id = l.seller_id
      where s.user_id = auth.uid()
    )
  );

create policy qc_seller_update_own on qc_responses
  for update using (
    listing_id in (
      select l.id from listings l
      join sellers s on s.id = l.seller_id
      where s.user_id = auth.uid()
    )
    or is_admin()
  );

-- ============================================================
-- 0012_create_market_prices.sql
-- ============================================================

-- market_prices — the pricing intelligence table. The single most valuable
-- asset on the platform (see Security: Protect the Moat). No public access
-- of any kind: RLS is enabled with no anon/authenticated policies, so only
-- the service role (scrapers, gauge API, admin panel) can touch it.
create table market_prices (
  id uuid primary key default gen_random_uuid(),
  -- Platform name: ebay, reverb, gearsource, gearsupply, soundbroker,
  -- avgear, soldtiger, avlauction, liveauctioneers, westauctions,
  -- usedavgear, clair, solaris, cuesale, churchgear, sweetwater,
  -- guitarcenter, bhphoto, audiogon, hifishark, usaudiomart, avauction
  source text not null,
  -- Data quality tier — every record carries its own quality signal so the
  -- pricing engine never needs to look up the source name
  source_category text not null
    check (source_category in ('sold_verified', 'asking_dealer', 'asking_marketplace')),
  manufacturer text not null,
  model text not null,
  master_equipment_id uuid references master_equipment (id),
  -- Grade inference for scraped data
  ebay_condition_label text,
  inferred_grade text
    check (inferred_grade in ('A', 'B', 'C', 'D')),
  grade_confidence text
    check (grade_confidence in ('high', 'medium', 'low')),
  grade_source text
    check (grade_source in ('ebay_label', 'description_parse', 'photo_analysis')),
  -- Full listing description kept for re-parsing if the grade inference
  -- prompt improves later
  description_raw text,
  -- Asking and sold prices are never conflated — separate columns, and
  -- sold_price stays null for asking-price sources
  asking_price numeric,
  sold_price numeric,
  -- Exact page scraped — required for validation and audit trail
  listing_url text not null,
  -- Confidence weight for the pricing engine: 1.0 own transactions,
  -- 0.7 sold_verified, 0.5 asking_dealer, 0.2 asking_marketplace
  weight numeric not null default 0.2,
  scraped_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  check (asking_price is not null or sold_price is not null)
);

create index market_prices_master_equipment_idx on market_prices (master_equipment_id);
create index market_prices_manufacturer_model_idx on market_prices (manufacturer, model);
create index market_prices_source_idx on market_prices (source);
create index market_prices_scraped_at_idx on market_prices (scraped_at desc);

alter table market_prices enable row level security;

-- Intentionally no policies for anon/authenticated — deny all. The gauge
-- API route reads via the service role and returns ranges only, rate
-- limited, never raw records.
grant select, insert, update, delete on market_prices to service_role;

-- ============================================================
-- 0013_create_platform_ops.sql
-- ============================================================

-- Platform operations tables: settings, scraper health, weekly metrics,
-- stolen gear registry, cliff events.

-- pricing_engine_settings — adjustable platform parameters (admin panel).
-- Week 2 locked decisions store their tunables here.
create table pricing_engine_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_at timestamptz not null default now()
);

create trigger pricing_engine_settings_set_updated_at
  before update on pricing_engine_settings
  for each row execute function set_updated_at();

insert into pricing_engine_settings (key, value, description) values
  ('inspection_window_hours', '72',
   'Escrow inspection window after confirmed delivery. In the seller agreement — change carefully once real transactions are running.'),
  ('auction_auto_extend_minutes', '5',
   'Any bid in the final N minutes extends the lot by N minutes.'),
  ('min_watchers_to_display', '10',
   'Watcher count is hidden below this threshold; above it shows "X people watching".');

alter table pricing_engine_settings enable row level security;

create policy pricing_engine_settings_admin on pricing_engine_settings
  for all using (is_admin()) with check (is_admin());

-- scraper_logs — one row per scraper run, feeds the admin scraper health
-- panel (last run per source, records pulled, errors).
create table scraper_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  run_started_at timestamptz not null default now(),
  run_finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'error')),
  records_scraped int not null default 0,
  records_inserted int not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index scraper_logs_source_started_idx on scraper_logs (source, run_started_at desc);

alter table scraper_logs enable row level security;

create policy scraper_logs_admin_read on scraper_logs
  for select using (is_admin());

grant select, insert, update on scraper_logs to service_role;

-- weekly_metrics — the phase 1 success metrics, one row per week: database
-- growing, sellers onboarding, buyers returning.
create table weekly_metrics (
  id uuid primary key default gen_random_uuid(),
  week_start date not null unique,
  listings_created int not null default 0,
  sellers_onboarded int not null default 0,
  buyers_registered int not null default 0,
  transactions_completed int not null default 0,
  gmv numeric not null default 0,
  commission_revenue numeric not null default 0,
  market_prices_added int not null default 0,
  master_equipment_added int not null default 0,
  newsletter_subscribers int not null default 0,
  created_at timestamptz not null default now()
);

alter table weekly_metrics enable row level security;

create policy weekly_metrics_admin on weekly_metrics
  for all using (is_admin()) with check (is_admin());

-- stolen_gear_registry — public serial-number check (anyone can verify a
-- serial before buying); writes are admin only.
create table stolen_gear_registry (
  id uuid primary key default gen_random_uuid(),
  serial_number text not null,
  manufacturer text,
  model text,
  description text,
  reported_by text,
  source_url text,
  status text not null default 'active'
    check (status in ('active', 'recovered', 'removed')),
  created_at timestamptz not null default now()
);

create index stolen_gear_registry_serial_idx on stolen_gear_registry (serial_number);

alter table stolen_gear_registry enable row level security;

create policy stolen_gear_public_read on stolen_gear_registry
  for select using (status = 'active' or is_admin());

create policy stolen_gear_admin_write on stolen_gear_registry
  for insert with check (is_admin());

create policy stolen_gear_admin_update on stolen_gear_registry
  for update using (is_admin());

create policy stolen_gear_admin_delete on stolen_gear_registry
  for delete using (is_admin());

-- cliff_events — Week 2 locked decision: manual admin entry only. Tom flags
-- market-moving events (EOL, FCC reallocation, firmware EOL), admin logs
-- them. Nothing auto-populates until phase 3 anomaly detection.
create table cliff_events (
  id uuid primary key default gen_random_uuid(),
  manufacturer text not null,
  -- null means the entire manufacturer line is affected
  model_affected text,
  event_type text not null
    check (event_type in ('eol', 'new_product', 'fcc_reallocation', 'firmware_eol', 'parts_discontinued')),
  event_date date not null,
  -- Admin's estimated % price impact
  price_impact_pct numeric,
  source_url text,
  notes text,
  created_at timestamptz not null default now()
);

alter table cliff_events enable row level security;

create policy cliff_events_admin on cliff_events
  for all using (is_admin()) with check (is_admin());

-- ============================================================
-- 0014_create_subscriptions_concierge_requests.sql
-- ============================================================

-- subscriptions — seller tier billing. Schema built now to support all tiers
-- from day one; power seller plans activate in phase 2.
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users (id) on delete cascade,
  plan text not null
    check (plan in ('standard', 'power', 'enterprise')),
  stripe_subscription_id text,
  status text not null default 'active'
    check (status in ('active', 'cancelled', 'past_due')),
  created_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on subscriptions (user_id);

alter table subscriptions enable row level security;

create policy subscriptions_own_read on subscriptions
  for select using (user_id = auth.uid() or is_admin());

-- Writes come from Stripe webhooks via the service role only.

-- concierge_requests — the "Find It For Me" form (Week 2 locked field list).
-- Concierge is a manual service in phase 1: form in, phone call out. The
-- form should feel like talking to a knowledgeable broker.
create table concierge_requests (
  id uuid primary key default gen_random_uuid(),
  -- null when submitted without an account (public form)
  buyer_id uuid references users (id),
  name text not null,
  email text not null,
  phone text not null,
  company text not null,
  gear_description text not null,
  quantity_needed int,
  budget numeric,
  need_by_date date,
  project_type text not null
    check (project_type in ('touring', 'permanent_install', 'broadcast', 'house_of_worship', 'corporate', 'other')),
  venue_or_location text,
  project_name text,
  condition_preference text not null default 'any'
    check (condition_preference in ('any', 'a', 'b', 'c')),
  open_to_multiple_sellers boolean not null default true,
  accessories_required text,
  firmware_version text,
  power_requirements text
    check (power_requirements in ('120v', '240v', 'either')),
  rack_mounting_required boolean not null default false,
  preferred_manufacturers text,
  additional_notes text,
  status text not null default 'new'
    check (status in ('new', 'in_progress', 'fulfilled', 'closed')),
  -- sean or tom
  assigned_to text,
  -- Never visible to the buyer
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger concierge_requests_set_updated_at
  before update on concierge_requests
  for each row execute function set_updated_at();

create index concierge_requests_status_idx on concierge_requests (status);

alter table concierge_requests enable row level security;

-- Submissions go through an API route (service role) so rate limiting and
-- validation run first — no direct anon insert. Buyers with accounts can see
-- their own requests; internal_notes exposure is prevented at the API layer
-- (clients never select this table directly in phase 1).
create policy concierge_requests_own_read on concierge_requests
  for select using (buyer_id = auth.uid() or is_admin());

create policy concierge_requests_admin_update on concierge_requests
  for update using (is_admin());

commit;
