-- Seller contact identity: full contact set (name, email, phone, physical
-- address) collected at seller signup for ALL account types. Decision
-- Aug 22, 2026: for a high-end verified marketplace, asking for identity
-- is a trust signal, not friction — and it advances the INFORM Consumers
-- Act module (launch-blocking), which requires seller identity collection.
--
-- HIDDEN BY DEFAULT: sellers RLS (sellers_select_own, 0006) restricts
-- reads to the seller's own user or admin, and public API routes select
-- only anonymous_username / verification_status / seller_tier. These new
-- columns are therefore never buyer-visible. The reveal-after-funded-sale
-- mechanism (contact block on GET /api/transactions/[id] once status is
-- at/past payment_captured) is deliberately NOT built yet — post-Korea
-- checkout slice.
--
-- Columns are nullable: demo sellers predate the requirement and are not
-- backfilled. Requiredness is enforced at the signup path (create_seller
-- below + the API route), not by constraints.

alter table sellers
  add column if not exists contact_name text,
  add column if not exists contact_email text,
  add column if not exists address_line1 text,
  add column if not exists address_line2 text,
  add column if not exists city text,
  add column if not exists state text,
  add column if not exists postal_code text,
  add column if not exists country text not null default 'US';

comment on column sellers.contact_name is
  'Contact person, private. Never buyer-visible until the (unbuilt) post-escrow reveal.';
comment on column sellers.contact_email is
  'Business contact email, may differ from the login email. Private, as above.';
comment on column sellers.address_line1 is
  'Seller physical address, private. Distinct from display_location (public opt-in blurb) and listing zip_code (gear location).';

-- create_seller(): identical to 0031 except it stores the contact fields
-- and requires the core set (contact_name, contact_email, phone,
-- address_line1, city, state, postal_code) for every account type.
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
  v_missing text[] := '{}';
  f text;
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
  -- Onboarding step 3: the agreement checkbox is required, not optional
  if coalesce((p ->> 'agreement_accepted')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'agreement_required');
  end if;
  -- Full contact set required for ALL sellers (Aug 22, 2026 decision)
  foreach f in array array['contact_name', 'contact_email', 'phone',
                           'address_line1', 'city', 'state', 'postal_code']
  loop
    if nullif(trim(coalesce(p ->> f, '')), '') is null then
      v_missing := v_missing || f;
    end if;
  end loop;
  if array_length(v_missing, 1) > 0 then
    return jsonb_build_object('ok', false, 'error', 'contact_details_required',
                              'missing', to_jsonb(v_missing));
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
    website, phone, years_in_business, display_location, anonymous_username,
    agreement_accepted_at,
    contact_name, contact_email, address_line1, address_line2,
    city, state, postal_code, country
  ) values (
    p_user_id, v_account_type,
    p ->> 'business_name', p ->> 'ein', p ->> 'business_type',
    p ->> 'website', p ->> 'phone', (p ->> 'years_in_business')::int,
    p ->> 'display_location', v_username,
    now(),
    trim(p ->> 'contact_name'), trim(p ->> 'contact_email'),
    trim(p ->> 'address_line1'), nullif(trim(coalesce(p ->> 'address_line2', '')), ''),
    trim(p ->> 'city'), trim(p ->> 'state'), trim(p ->> 'postal_code'),
    coalesce(nullif(trim(coalesce(p ->> 'country', '')), ''), 'US')
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
