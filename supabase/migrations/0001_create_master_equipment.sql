create extension if not exists pgcrypto;

create table master_equipment (
  id uuid primary key default gen_random_uuid(),

  -- core identity (CLAUDE.md: "Master Equipment Database" fields)
  manufacturer text not null,
  model text not null,
  series text,
  aliases text[] not null default '{}',
  category text not null default 'other'
    check (category in ('led_video', 'audio', 'lighting', 'staging', 'rigging', 'other')),
  description text,
  bullet_points text[] not null default '{}',
  image_url text,
  spec_sheet_url text,
  manufacturer_website_url text,
  year_introduced int,
  year_discontinued int,
  msrp numeric,

  -- admin review gate (CLAUDE.md: "Admin reviews and approves before anything enters the master database")
  status text not null default 'pending_review'
    check (status in ('pending_review', 'approved', 'rejected')),

  -- scraper provenance (AV-iQ seeding, week 1)
  source text not null default 'av_iq',
  av_iq_product_id text,
  category_raw text,
  source_url text,
  scraped_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- idempotent re-scraping: same AV-iQ product should upsert, not duplicate
create unique index master_equipment_av_iq_product_id_key
  on master_equipment (av_iq_product_id)
  where av_iq_product_id is not null;

create index master_equipment_manufacturer_model_idx
  on master_equipment (manufacturer, model);

create index master_equipment_status_idx
  on master_equipment (status);
