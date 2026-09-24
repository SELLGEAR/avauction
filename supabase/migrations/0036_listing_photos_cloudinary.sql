-- Seller photo upload (Cloudinary, signed direct uploads).
--
-- 1) listing_photos carries the Cloudinary identity of each photo so the
--    stored ORIGINAL is always recoverable: public_id (unique), version,
--    format, width, height, bytes. `url` stays the buyer-facing delivery
--    URL — a Cloudinary transformation URL that watermarks "avauction.com"
--    on the fly. The original asset is never altered; the watermark is a
--    delivery transform derived from public_id (lib/photos/cloudinary.ts).
--
-- 2) min_photos_per_listing flips 0 -> 8. This is the 0031 launch blocker:
--    the rule (min 8, powered-on shot, serial label) was only deferred
--    while there was no upload path. Idempotent — an explicit later change
--    to any other value is left alone (only 0 is flipped).
--
-- 3) required_photo_types: the two shots CLAUDE.md makes mandatory
--    (powered-on test for electronic gear, serial number label), as a
--    tunable JSON array. Enforced by submit_listing() whenever the photo
--    minimum is > 0, so the photoless dev phase (minimum 0) is unaffected.
--
-- 4) submit_listing(): identical to 0031 plus (a) the new photo columns,
--    (b) required-type enforcement, (c) duplicate public_id rejection.
--    Error codes added: required_photo_types_missing, duplicate_photo.
--
-- Grants: listing_photos already has select for anon/authenticated (0026)
-- and the seller-own policies from 0027 (current_seller_id(), SECURITY
-- DEFINER — never subqueries sellers). Photo rows are written ONLY by
-- submit_listing() (service role) after the API route has verified each
-- Cloudinary upload signature, so client insert/update/delete on
-- listing_photos stays deliberately ungranted — a client-side insert would
-- let a seller store an arbitrary URL, bypassing verification. The absence
-- of the grant is the enforcement; scripts/audit-security.ts checks it.

-- ---- 1. Cloudinary identity columns ------------------------------------

alter table listing_photos
  add column if not exists public_id text,
  add column if not exists cloudinary_version bigint,
  add column if not exists format text,
  add column if not exists width int,
  add column if not exists height int,
  add column if not exists bytes int;

-- Legacy demo rows (public/demo/*.jpg, seeded locally) have no public_id;
-- every Cloudinary-backed row must be unique on it.
create unique index if not exists listing_photos_public_id_key
  on listing_photos (public_id) where public_id is not null;

comment on column listing_photos.url is
  'Buyer-facing delivery URL. For Cloudinary photos this is a watermark transformation URL; the untouched original is addressable by public_id + cloudinary_version.';
comment on column listing_photos.public_id is
  'Cloudinary public_id, namespaced listings/<seller_id>/<uuid>. Null only for legacy locally-seeded demo photos.';

-- ---- 2. Photo minimum: 0 -> 8 (the 0031 launch blocker) -----------------

insert into pricing_engine_settings (key, value, description) values
  ('min_photos_per_listing', '8',
   'Minimum photos required by submit_listing(). Business rule: 8.')
on conflict (key) do update
  set value = excluded.value,
      description = excluded.description
  where pricing_engine_settings.value = '0';

-- ---- 3. Required shot types ---------------------------------------------

insert into pricing_engine_settings (key, value, description) values
  ('required_photo_types', '["powered_on", "serial_label"]',
   'photo_type values every submission must include when min_photos_per_listing > 0 (CLAUDE.md: powered-on test shot, serial number label).')
on conflict (key) do nothing;

-- ---- 4. submit_listing() ------------------------------------------------

create or replace function public.submit_listing(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_min_photos int;
  v_photo_count int;
  v_required_types text[];
  v_present_types text[];
  v_missing_types text[];
  v_public_ids text[];
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

  -- Required shot types (only while a photo minimum is in force)
  if v_min_photos > 0 then
    select coalesce(
      (select array_agg(x) from jsonb_array_elements_text(value) x),
      array['powered_on', 'serial_label']
    ) into v_required_types
    from pricing_engine_settings where key = 'required_photo_types';
    if not found then
      v_required_types := array['powered_on', 'serial_label'];
    end if;

    select coalesce(array_agg(distinct x ->> 'photo_type'), '{}'::text[])
      into v_present_types
    from jsonb_array_elements(coalesce(p -> 'photos', '[]'::jsonb)) x;

    select coalesce(array_agg(t), '{}'::text[]) into v_missing_types
    from unnest(v_required_types) t
    where not (t = any (v_present_types));

    if array_length(v_missing_types, 1) > 0 then
      return jsonb_build_object('ok', false, 'error', 'required_photo_types_missing',
                                'missing', to_jsonb(v_missing_types));
    end if;
  end if;

  -- One row per Cloudinary asset: a duplicated public_id in the payload
  -- would hit the unique index mid-insert and abort with a raw error
  select coalesce(array_agg(x ->> 'public_id'), '{}'::text[]) into v_public_ids
  from jsonb_array_elements(coalesce(p -> 'photos', '[]'::jsonb)) x
  where x ->> 'public_id' is not null;
  if (select count(*) from unnest(v_public_ids)) <>
     (select count(distinct u) from unnest(v_public_ids) u) then
    return jsonb_build_object('ok', false, 'error', 'duplicate_photo');
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

  -- moderation_status stays at its default ('pending'): admin approval of
  -- the listing approves its photos (lib/admin/listings.ts) — the human
  -- backstop layer of the CLAUDE.md moderation design.
  for ph in select * from jsonb_array_elements(coalesce(p -> 'photos', '[]'::jsonb))
  loop
    insert into listing_photos (
      listing_id, url, photo_type, position,
      public_id, cloudinary_version, format, width, height, bytes
    ) values (
      v_listing_id,
      ph ->> 'url',
      coalesce(ph ->> 'photo_type', 'other'),
      coalesce((ph ->> 'position')::int, 0),
      ph ->> 'public_id',
      (ph ->> 'version')::bigint,
      ph ->> 'format',
      (ph ->> 'width')::int,
      (ph ->> 'height')::int,
      (ph ->> 'bytes')::int
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
