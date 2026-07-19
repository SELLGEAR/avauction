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
