-- Auth flows + privilege-escalation fix.
--
-- SECURITY FIX (part 1): 0006's policies let an authenticated client
-- insert/update their own users row with ANY values — including
-- role='admin', which is exactly what is_admin() checks — and insert their
-- own sellers row with industry_verified=true or any tier. All client
-- write policies on users and sellers are dropped: rows are created by the
-- signup trigger below and mutated only through service-role API routes.

drop policy if exists users_insert_own on users;
drop policy if exists users_update_own on users;
drop policy if exists sellers_insert_own on sellers;
drop policy if exists sellers_update_own on sellers;

-- Signup: every new auth user gets a public.users row with role 'buyer'.
-- The buyer default is enforced by the database, not client honesty.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is not null then
    insert into public.users (id, email, role)
    values (new.id, new.email, 'buyer')
    on conflict (id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill any auth users that predate the trigger
insert into public.users (id, email, role)
select au.id, au.email, 'buyer'
from auth.users au
where au.email is not null
on conflict (id) do nothing;

-- Seller upgrade: atomic role flip + sellers row + platform-assigned
-- anonymous username (anonymity is the default, not an option).
-- p: { account_type: 'individual'|'business', business_name?, ein?,
--      business_type?, website?, phone?, years_in_business?,
--      display_location? }
create or replace function public.create_seller(
  p_user_id uuid,
  p jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account_type text := coalesce(p ->> 'account_type', 'individual');
  v_username text;
  v_seller_id uuid;
  v_tries int := 0;
begin
  -- Lock the user row so two concurrent upgrades serialize
  perform 1 from users where id = p_user_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;
  if exists (select 1 from sellers where user_id = p_user_id) then
    return jsonb_build_object('ok', false, 'error', 'already_seller');
  end if;
  if v_account_type not in ('individual', 'business') then
    return jsonb_build_object('ok', false, 'error', 'invalid_account_type');
  end if;
  -- Business accounts require name and EIN (Account Types spec)
  if v_account_type = 'business' and
     (nullif(trim(coalesce(p ->> 'business_name', '')), '') is null or
      nullif(trim(coalesce(p ->> 'ein', '')), '') is null) then
    return jsonb_build_object('ok', false, 'error', 'business_name_and_ein_required');
  end if;

  loop
    v_username := 'VerifiedSeller_' ||
      lpad(floor(random() * 10000)::int::text, 4, '0');
    exit when not exists (select 1 from sellers where anonymous_username = v_username);
    v_tries := v_tries + 1;
    if v_tries > 50 then
      -- 4-digit space nearly exhausted: fall back to a longer suffix
      v_username := 'VerifiedSeller_' ||
        substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
      exit;
    end if;
  end loop;

  insert into sellers (
    user_id, account_type, business_name, ein, business_type,
    website, phone, years_in_business, display_location, anonymous_username
  ) values (
    p_user_id, v_account_type,
    p ->> 'business_name', p ->> 'ein', p ->> 'business_type',
    p ->> 'website', p ->> 'phone', (p ->> 'years_in_business')::int,
    p ->> 'display_location', v_username
  ) returning id into v_seller_id;

  -- Admins keep their role; everyone else becomes a seller
  update users set role = 'seller' where id = p_user_id and role <> 'admin';

  return jsonb_build_object(
    'ok', true,
    'seller_id', v_seller_id,
    'anonymous_username', v_username,
    'account_type', v_account_type,
    'verification_status', 'provisional'
  );
end;
$$;

revoke execute on function public.create_seller(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.create_seller(uuid, jsonb) to service_role;
