-- Platform user and seller tables, plus the two helper functions every
-- subsequent migration's RLS policies depend on.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- users — one row per auth account. id mirrors auth.users so auth.uid()
-- works directly in RLS policies.
create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'buyer'
    check (role in ('buyer', 'seller', 'admin')),
  buyer_tier text not null default 'standard'
    check (buyer_tier in ('standard', 'concierge_basic', 'concierge_pro', 'concierge_premium')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on users
  for each row execute function set_updated_at();

-- is_admin() must be created AFTER the users table: sql-language function
-- bodies are validated at creation time, so defining it earlier fails on the
-- missing table. It is SECURITY DEFINER so RLS policies on the users table
-- itself can call it without infinite recursion (a plain subquery on users
-- inside a users policy re-triggers the policy).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from users where id = auth.uid() and role = 'admin'
  );
$$;

alter table users enable row level security;

create policy users_select_own on users
  for select using (id = auth.uid() or is_admin());

create policy users_insert_own on users
  for insert with check (id = auth.uid());

-- role and buyer_tier changes go through the service role (API routes), not
-- direct client updates — this policy only lets a user edit their own row,
-- and the API layer restricts which columns.
create policy users_update_own on users
  for update using (id = auth.uid() or is_admin());

create policy users_admin_delete on users
  for delete using (is_admin());

-- sellers — business identity, verification, and payout linkage. Individual
-- accounts get a row too (account_type = 'individual', business fields null).
create table sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references users (id) on delete cascade,
  account_type text not null default 'business'
    check (account_type in ('individual', 'business')),
  business_name text,
  ein text,
  business_type text
    check (business_type in ('rental_house', 'integrator', 'production_company', 'dealer', 'other')),
  website text,
  phone text,
  years_in_business int,
  verification_status text not null default 'provisional'
    check (verification_status in ('provisional', 'verified', 'trusted')),
  seller_tier text not null default 'standard'
    check (seller_tier in ('standard', 'power', 'enterprise')),
  -- Invitation-only top trust badge, granted personally by Tom
  industry_verified boolean not null default false,
  -- Platform-assigned public identity (e.g. VerifiedSeller_4471). Company
  -- name is never shown to buyers until escrow is funded.
  anonymous_username text unique,
  -- Optional general location display ("Nashville, TN rental house") for the
  -- trust boost — never the exact address
  display_location text,
  stripe_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sellers_set_updated_at
  before update on sellers
  for each row execute function set_updated_at();

alter table sellers enable row level security;

-- No public select: business_name, ein, and contact details must stay hidden
-- from buyers. Public-safe seller info (anonymous_username, trust tier)
-- reaches listings via API routes using the service role.
create policy sellers_select_own on sellers
  for select using (user_id = auth.uid() or is_admin());

create policy sellers_insert_own on sellers
  for insert with check (user_id = auth.uid());

create policy sellers_update_own on sellers
  for update using (user_id = auth.uid() or is_admin());

create policy sellers_admin_delete on sellers
  for delete using (is_admin());
