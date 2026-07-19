-- Cross-source duplicate prevention: the 7 Tier 1 dealer-site scrapers
-- (GearSource, Gearsupply, SoundBroker, AVGear, AVLAuction, UsedAVGear,
-- Clair Used Gear) can all discover the same physical product AV-iQ already
-- seeded, or that another one of these 7 already inserted. A per-source id
-- (like av_iq_product_id) can't catch that — only a normalized identity of
-- the product itself can. product_key is that identity: lowercased
-- manufacturer + model with punctuation collapsed to single spaces, so
-- "d&b audiotechnik" / "d&b Audiotechnik" / "D&B AUDIOTECHNIK" all resolve
-- to the same key and the unique index rejects the second insert outright.
create or replace function normalize_product_key(manufacturer text, model text)
returns text
language sql
immutable
as $$
  select trim(regexp_replace(lower(coalesce(manufacturer, '') || ' ' || coalesce(model, '')), '[^a-z0-9]+', ' ', 'g'))
$$;

-- IF NOT EXISTS: a prior run of this migration may have gotten this far
-- before the unique index step below failed on real duplicate data, so this
-- needs to be safe to re-run from the top.
alter table master_equipment
  add column if not exists product_key text generated always as (normalize_product_key(manufacturer, model)) stored;

-- AV-iQ's own re-crawls produced multiple master_equipment rows for the same
-- real-world product under different av_iq_product_id values (e.g. "Wohler
-- Technologies AMP1-2SDA" existed as two separate rows) — nothing before this
-- migration ever checked manufacturer+model identity, only the AV-iQ id. The
-- unique index below enforces that identity going forward, but existing
-- collisions have to be resolved first or the index creation fails.
--
-- For each product_key group, keep one row and drop the rest. "Keep" is
-- decided by: admin-reviewed rows outrank pending/rejected ones, then the
-- most complete row (most non-null descriptive fields) outranks a thinner
-- one, then the oldest row wins ties. This is a one-time cleanup of bad
-- historical data — the unique index is what prevents new duplicates from
-- this point forward.
with ranked as (
  select
    id,
    row_number() over (
      partition by product_key
      order by
        case status when 'approved' then 0 when 'pending_review' then 1 else 2 end asc,
        (
          (case when description is not null then 1 else 0 end) +
          (case when image_url is not null then 1 else 0 end) +
          (case when spec_sheet_url is not null then 1 else 0 end) +
          (case when manufacturer_website_url is not null then 1 else 0 end) +
          (case when coalesce(array_length(bullet_points, 1), 0) > 0 then 1 else 0 end) +
          (case when msrp is not null then 1 else 0 end) +
          (case when year_introduced is not null then 1 else 0 end)
        ) desc,
        created_at asc,
        id asc
    ) as rn
  from master_equipment
  where product_key <> ''
),
deleted as (
  delete from master_equipment
  where id in (select id from ranked where rn > 1)
  returning id
)
select count(*) as duplicate_rows_removed from deleted;

-- Partial predicate excludes the theoretical empty-string case (manufacturer
-- and model both blank) from the uniqueness guarantee, same reasoning as the
-- av_iq_product_id fix in 0003 — real product rows should never collide here.
drop index if exists master_equipment_product_key_key;
create unique index master_equipment_product_key_key
  on master_equipment (product_key)
  where product_key <> '';

-- Resume/skip checkpoint for the new scrapers. AV-iQ's completed.ts uses
-- presence in master_equipment itself as the "already done" signal, which
-- works because every successful AV-iQ fetch produces a row. That doesn't
-- hold here: a page can be successfully processed and still produce no new
-- row (product_key already exists from another source), and that page still
-- needs to be skipped on the next run rather than re-fetched forever. This
-- table logs every URL a scraper has visited, independent of whether it
-- resulted in a new master_equipment row.
create table if not exists master_equipment_scrape_log (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_url text not null,
  outcome text not null
    check (outcome in ('inserted', 'duplicate_skipped', 'error')),
  master_equipment_id uuid references master_equipment(id) on delete set null,
  message text,
  scraped_at timestamptz not null default now()
);

create unique index if not exists master_equipment_scrape_log_source_url_key
  on master_equipment_scrape_log (source, source_url);

create index if not exists master_equipment_scrape_log_source_idx
  on master_equipment_scrape_log (source);

grant select, insert, update, delete on public.master_equipment_scrape_log to service_role;
