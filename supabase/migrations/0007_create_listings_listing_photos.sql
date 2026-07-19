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
