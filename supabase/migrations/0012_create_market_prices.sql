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
