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
