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
