-- Seller anonymity layer for listing photos.
--
-- 1) Delivery lock-down (no schema change): every photo is now uploaded
--    with Cloudinary type=authenticated, so neither the original nor any
--    derived version is addressable without a server-side delivery
--    signature over the exact transformation. listing_photos.url stores
--    the SIGNED buyer URL (blur regions + watermark). Stripping or editing
--    the transformation from that URL breaks the signature (401). Clean
--    originals are signed only inside admin routes.
--
-- 2) blur_regions: the seller-approved rectangles (normalized 0..1 of the
--    original) blurred on delivery via e_blur_region — the original asset
--    is never modified. detection: what the vision scan suggested and its
--    outcome (done / failed / unavailable / skipped) so admin can compare
--    suggested vs accepted. Both are written only by submit_listing()
--    (service role) after the API route has validated them.
--
-- 3) submit_listing(): identical to 0036 plus the two new columns.
--
-- Grants unchanged: listing_photos keeps select-only for anon/authenticated
-- (0026) with the seller-own policies (0027). blur_regions/detection are
-- readable wherever the row is — the coordinates of a blurred rectangle on
-- a blurred image reveal nothing.

alter table listing_photos
  add column if not exists blur_regions jsonb not null default '[]'::jsonb,
  add column if not exists detection jsonb;

comment on column listing_photos.blur_regions is
  'Seller-approved blur rectangles {x,y,w,h,label?} normalized 0..1 of the original; applied on delivery (e_blur_region), original untouched.';
comment on column listing_photos.detection is
  'Identifying-mark scan record {status, suggested[], model, note}. Suggested vs blur_regions shows what the seller changed.';
comment on column listing_photos.url is
  'Buyer-facing SIGNED delivery URL (type=authenticated): blur regions + watermark. The clean original is addressable only via public_id + cloudinary_version with an admin-side signature.';

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

  for ph in select * from jsonb_array_elements(coalesce(p -> 'photos', '[]'::jsonb))
  loop
    insert into listing_photos (
      listing_id, url, photo_type, position,
      public_id, cloudinary_version, format, width, height, bytes,
      blur_regions, detection
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
      (ph ->> 'bytes')::int,
      case when jsonb_typeof(ph -> 'blur_regions') = 'array'
           then ph -> 'blur_regions' else '[]'::jsonb end,
      case when jsonb_typeof(ph -> 'detection') = 'object'
           then ph -> 'detection' else null end
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
