-- Seller listing submission. submit_listing() inserts the listing, its
-- photos, the QC checklist responses, and the admin-only metadata in one
-- transaction, enforcing the hard rules (minimum 8 photos, known_issues
-- never blank, master link required — the column is NOT NULL by design).
--
-- listing_admin_meta is a separate table because RLS is row-level:
-- listings rows are publicly readable when active, so the quality score
-- (admin-only, 0-100) cannot live there as a column without leaking.

create table listing_admin_meta (
  listing_id uuid primary key references listings (id) on delete cascade,
  quality_score int not null check (quality_score between 0 and 100),
  score_breakdown jsonb not null default '{}'::jsonb,
  -- Grade the QC rules computed, alongside what the seller chose
  suggested_grade text
    check (suggested_grade in ('A', 'B', 'C', 'D')),
  -- Pricing engine output at submission time, for admin review context
  price_suggestion jsonb,
  created_at timestamptz not null default now()
);

alter table listing_admin_meta enable row level security;

create policy listing_admin_meta_admin_read on listing_admin_meta
  for select using (is_admin());
-- Writes: service role only (the submission API)

-- p payload:
-- {
--   seller_id, master_equipment_id, title, description, condition_grade,
--   grade_override, quantity, hours_of_use, serial_numbers[],
--   year_of_manufacture, purchase_year, zip_code, asking_price,
--   reserve_price, listing_type, known_issues, flight_case_included,
--   entry_method,
--   photos: [{url, photo_type, position}],
--   qc: {powers_on, all_components, flight_case, cosmetic_damage,
--        known_issues, known_issues_description, serviced,
--        service_description, serial_confirmed, suggested_grade,
--        seller_accepted_grade},
--   admin_meta: {quality_score, score_breakdown, suggested_grade,
--                price_suggestion}
-- }
create or replace function public.submit_listing(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_photo_count int;
  v_known_issues text;
  v_listing_type text;
  v_equip_status text;
  v_listing_id uuid;
  ph jsonb;
begin
  v_photo_count := coalesce(jsonb_array_length(p -> 'photos'), 0);
  if v_photo_count < 8 then
    return jsonb_build_object('ok', false, 'error', 'min_8_photos_required',
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
