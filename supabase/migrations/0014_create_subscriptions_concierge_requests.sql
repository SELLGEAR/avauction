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
