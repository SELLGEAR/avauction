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
