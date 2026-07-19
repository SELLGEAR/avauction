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
