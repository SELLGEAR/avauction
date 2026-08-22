-- Photo-minimum as a tunable + seller agreement acceptance.
--
-- 1) min_photos_per_listing: the 8-photo rule was hardcoded in
--    submit_listing(). Photo upload is deferred (no Cloudinary yet), so the
--    minimum becomes a pricing_engine_settings tunable, set to 0 for the
--    photoless build phase. ⚠️ LAUNCH-BLOCKING: flip to 8 when photo upload
--    ships — the business rule (min 8 photos, powered-on shot, serial label)
--    is unchanged, only deferred.
--
-- 2) sellers.agreement_accepted_at: onboarding step 3 (sign the seller
--    agreement) previously recorded nothing. create_seller() now requires
--    agreement_accepted=true in its payload and stamps the time. The
--    agreement TEXT shown in the UI is a placeholder pending attorney
--    review — this column records that *an* agreement was accepted, and
--    versioning of agreement text can come later with the real terms.

-- ---- 1. Tunable photo minimum ------------------------------------------

insert into pricing_engine_settings (key, value, description) values
  ('min_photos_per_listing', '0',
   'Minimum photos required by submit_listing(). TEMPORARILY 0 while photo upload is deferred (no Cloudinary). ⚠️ Set to 8 before soft launch.')
on conflict (key) do nothing;

-- submit_listing(): identical to 0023 except the photo minimum is read
-- from pricing_engine_settings (fallback 8 if the setting is missing) and
-- the error code is generalized to min_photos_required.
create or replace function public.submit_listing(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_min_photos int;
  v_photo_count int;
  v_known_issues text;
  v_listing_type text;
  v_equip_status text;
  v_listing_id uuid;
  ph jsonb;
begin
  select coalesce((value #>> '{}')::int, 8) into v_min_photos
  from pricing_engine_settings where key = 'min_photos_per_listing';
  if not found then
    v_min_photos := 8;
  end if;

  v_photo_count := coalesce(jsonb_array_length(p -> 'photos'), 0);
  if v_photo_count < v_min_photos then
    return jsonb_build_object('ok', false, 'error', 'min_photos_required',
                              'required', v_min_photos,
                              'photo_count', v_photo_count);
  end if;

  v_known_issues := trim(coalesce(p ->> 'known_issues', ''));
  if v_known_issues = '' then
    return jsonb_build_object('ok', false, 'error', 'known_issues_required');
  end if;

  v_listing_type := p ->> 'listing_type';
  if v_listing_type not in ('auction', 'buy_it_now') then
    return jsonb_build_object('ok', false, 'error', 'invalid_listing_type');
  end if;
  if v_listing_type = 'buy_it_now'
     and coalesce((p ->> 'asking_price')::numeric, 0) <= 0 then
    return jsonb_build_object('ok', false, 'error', 'asking_price_required');
  end if;

  select status into v_equip_status
  from master_equipment where id = (p ->> 'master_equipment_id')::uuid;
  if not found or v_equip_status = 'rejected' then
    return jsonb_build_object('ok', false, 'error', 'invalid_master_equipment');
  end if;

  insert into listings (
    seller_id, master_equipment_id, title, description, condition_grade,
    grade_override, quantity, hours_of_use, serial_numbers,
    year_of_manufacture, purchase_year, zip_code, asking_price,
    reserve_price, listing_type, status, entry_method,
    flight_case_included, known_issues
  ) values (
    (p ->> 'seller_id')::uuid,
    (p ->> 'master_equipment_id')::uuid,
    p ->> 'title',
    p ->> 'description',
    p ->> 'condition_grade',
    coalesce((p ->> 'grade_override')::boolean, false),
    coalesce((p ->> 'quantity')::int, 1),
    (p ->> 'hours_of_use')::int,
    coalesce(
      (select array_agg(x) from jsonb_array_elements_text(p -> 'serial_numbers') x),
      '{}'::text[]
    ),
    (p ->> 'year_of_manufacture')::int,
    (p ->> 'purchase_year')::int,
    p ->> 'zip_code',
    (p ->> 'asking_price')::numeric,
    (p ->> 'reserve_price')::numeric,
    v_listing_type,
    'pending_review',
    coalesce(p ->> 'entry_method', 'form'),
    (p ->> 'flight_case_included')::boolean,
    v_known_issues
  ) returning id into v_listing_id;

  for ph in select * from jsonb_array_elements(p -> 'photos')
  loop
    insert into listing_photos (listing_id, url, photo_type, position)
    values (
      v_listing_id,
      ph ->> 'url',
      coalesce(ph ->> 'photo_type', 'other'),
      coalesce((ph ->> 'position')::int, 0)
    );
  end loop;

  insert into qc_responses (
    listing_id, powers_on, all_components, flight_case, cosmetic_damage,
    known_issues, known_issues_description, serviced, service_description,
    serial_confirmed, suggested_grade, seller_accepted_grade
  ) values (
    v_listing_id,
    (p -> 'qc' ->> 'powers_on')::boolean,
    (p -> 'qc' ->> 'all_components')::boolean,
    (p -> 'qc' ->> 'flight_case')::boolean,
    p -> 'qc' ->> 'cosmetic_damage',
    (p -> 'qc' ->> 'known_issues')::boolean,
    p -> 'qc' ->> 'known_issues_description',
    (p -> 'qc' ->> 'serviced')::boolean,
    p -> 'qc' ->> 'service_description',
    coalesce((p -> 'qc' ->> 'serial_confirmed')::boolean, false),
    p -> 'qc' ->> 'suggested_grade',
    coalesce((p -> 'qc' ->> 'seller_accepted_grade')::boolean, true)
  );

  insert into listing_admin_meta (
    listing_id, quality_score, score_breakdown, suggested_grade, price_suggestion
  ) values (
    v_listing_id,
    coalesce((p -> 'admin_meta' ->> 'quality_score')::int, 0),
    coalesce(p -> 'admin_meta' -> 'score_breakdown', '{}'::jsonb),
    p -> 'admin_meta' ->> 'suggested_grade',
    p -> 'admin_meta' -> 'price_suggestion'
  );

  return jsonb_build_object('ok', true, 'listing_id', v_listing_id,
                            'status', 'pending_review');
end;
$$;

revoke execute on function public.submit_listing(jsonb) from public, anon, authenticated;
grant execute on function public.submit_listing(jsonb) to service_role;

-- ---- 2. Seller agreement acceptance ------------------------------------

alter table sellers
  add column if not exists agreement_accepted_at timestamptz;

comment on column sellers.agreement_accepted_at is
  'When the seller accepted the seller agreement at onboarding. Agreement text is PLACEHOLDER pending attorney review; add versioning when real terms exist.';

-- create_seller(): identical to 0025 except it now requires
-- agreement_accepted=true in the payload and stamps agreement_accepted_at.
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
  -- Onboarding step 3: the agreement checkbox is required, not optional
  if coalesce((p ->> 'agreement_accepted')::boolean, false) is not true then
    return jsonb_build_object('ok', false, 'error', 'agreement_required');
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
    agreement_accepted_at
  ) values (
    p_user_id, v_account_type,
    p ->> 'business_name', p ->> 'ein', p ->> 'business_type',
    p ->> 'website', p ->> 'phone', (p ->> 'years_in_business')::int,
    p ->> 'display_location', v_username,
    now()
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
