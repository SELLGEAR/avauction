-- Search and browse. search_listings() is the single query surface for
-- the public marketplace: reference-database-first full-text (buyers
-- search by manufacturer/model/alias, not seller free text), five
-- filters, five sorts, pagination with total count. Distance uses the
-- static zip_codes centroid table (seeded from the Census gazetteer by
-- scripts/seed-zipcodes.ts) — no live geocoding.

create table zip_codes (
  zip text primary key,
  lat numeric not null,
  lng numeric not null,
  city text,
  state text
);

alter table zip_codes enable row level security;
-- Service role only: distance math happens inside search_listings()

create or replace function public.haversine_miles(
  lat1 numeric, lng1 numeric, lat2 numeric, lng2 numeric
) returns numeric
language sql
immutable
as $$
  select 3959 * acos(least(1.0,
    cos(radians(lat1)) * cos(radians(lat2)) *
    cos(radians(lng2) - radians(lng1)) +
    sin(radians(lat1)) * sin(radians(lat2))
  ));
$$;

-- Build a prefix-matching tsquery from user input: "alpha 500" ->
-- 'alpha:* & 500:*'. simple dictionary — gear names are not English words.
create or replace function public.build_search_query(q text)
returns tsquery
language sql
immutable
as $$
  select to_tsquery('simple',
    (select string_agg(term || ':*', ' & ')
     from unnest(regexp_split_to_array(
       trim(regexp_replace(lower(coalesce(q, '')), '[^a-z0-9]+', ' ', 'g')), ' '
     )) term
     where term <> '')
  );
$$;

-- p: { q, category, condition_grades: [..], price_min, price_max,
--      listing_type, buyer_zip, within_miles, sort, page, per_page }
-- sort: best_match | ending_soonest | newly_listed | price_low |
--       price_high | nearest
create or replace function public.search_listings(p jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_q text := nullif(trim(coalesce(p ->> 'q', '')), '');
  v_tsq tsquery;
  v_category text := p ->> 'category';
  v_grades text[] := case when p ? 'condition_grades'
    then (select array_agg(upper(x)) from jsonb_array_elements_text(p -> 'condition_grades') x)
    else null end;
  v_price_min numeric := (p ->> 'price_min')::numeric;
  v_price_max numeric := (p ->> 'price_max')::numeric;
  v_type text := p ->> 'listing_type';
  v_buyer_zip text := p ->> 'buyer_zip';
  v_within numeric := (p ->> 'within_miles')::numeric;
  v_sort text := coalesce(p ->> 'sort', case when p ->> 'q' is not null then 'best_match' else 'newly_listed' end);
  v_page int := greatest(coalesce((p ->> 'page')::int, 1), 1);
  v_per_page int := least(greatest(coalesce((p ->> 'per_page')::int, 24), 1), 100);
  v_blat numeric;
  v_blng numeric;
  v_min_watchers int;
  v_result jsonb;
begin
  if v_q is not null then
    v_tsq := build_search_query(v_q);
  end if;

  if v_buyer_zip is not null then
    select lat, lng into v_blat, v_blng from zip_codes where zip = v_buyer_zip;
  end if;
  if v_sort = 'nearest' and v_blat is null then
    return jsonb_build_object('error', 'buyer_zip_required_for_nearest');
  end if;
  if v_within is not null and v_blat is null then
    return jsonb_build_object('error', 'buyer_zip_required_for_distance_filter');
  end if;

  select value::text::int into v_min_watchers
  from pricing_engine_settings where key = 'min_watchers_to_display';

  with filtered as (
    select
      l.id, l.title, me.manufacturer, me.model, me.category,
      l.condition_grade, l.listing_type, l.asking_price, l.current_bid,
      l.bid_count, l.auction_end, l.zip_code, l.quantity, l.created_at,
      case l.listing_type when 'auction' then coalesce(l.current_bid, l.asking_price)
           else l.asking_price end as effective_price,
      case when v_blat is not null and zl.zip is not null
           then haversine_miles(v_blat, v_blng, zl.lat, zl.lng) end as distance_miles,
      case when v_tsq is not null then ts_rank(
        to_tsvector('simple',
          coalesce(me.manufacturer, '') || ' ' || coalesce(me.model, '') || ' ' ||
          array_to_string(me.aliases, ' ') || ' ' || coalesce(l.title, '')),
        v_tsq) end as rank,
      (select count(*) from watchlists w where w.listing_id = l.id) as watchers,
      (select ph.url from listing_photos ph
       where ph.listing_id = l.id and ph.moderation_status = 'approved'
       order by ph.position asc limit 1) as photo_url
    from listings l
    join master_equipment me on me.id = l.master_equipment_id
    left join zip_codes zl on zl.zip = l.zip_code
    where l.status = 'active'
      and (v_tsq is null or to_tsvector('simple',
            coalesce(me.manufacturer, '') || ' ' || coalesce(me.model, '') || ' ' ||
            array_to_string(me.aliases, ' ') || ' ' || coalesce(l.title, '')) @@ v_tsq)
      and (v_category is null or me.category = v_category)
      and (v_grades is null or l.condition_grade = any(v_grades))
      and (v_type is null or l.listing_type = v_type)
      and (v_price_min is null or
           (case l.listing_type when 'auction' then coalesce(l.current_bid, l.asking_price)
                 else l.asking_price end) >= v_price_min)
      and (v_price_max is null or
           (case l.listing_type when 'auction' then coalesce(l.current_bid, l.asking_price)
                 else l.asking_price end) <= v_price_max)
      and (v_within is null or
           (zl.zip is not null and haversine_miles(v_blat, v_blng, zl.lat, zl.lng) <= v_within))
  ),
  page as (
    select * from filtered
    order by
      case when v_sort = 'best_match' then rank end desc nulls last,
      case when v_sort = 'ending_soonest' then auction_end end asc nulls last,
      case when v_sort = 'price_low' then effective_price end asc nulls last,
      case when v_sort = 'price_high' then effective_price end desc nulls last,
      case when v_sort = 'nearest' then distance_miles end asc nulls last,
      created_at desc
    limit v_per_page offset (v_page - 1) * v_per_page
  )
  select jsonb_build_object(
    'total', (select count(*) from filtered),
    'page', v_page,
    'per_page', v_per_page,
    'results', coalesce((select jsonb_agg(jsonb_build_object(
      'id', pg.id,
      'title', pg.title,
      'manufacturer', pg.manufacturer,
      'model', pg.model,
      'category', pg.category,
      'condition_grade', pg.condition_grade,
      'listing_type', pg.listing_type,
      'asking_price', pg.asking_price,
      'current_bid', pg.current_bid,
      'bid_count', pg.bid_count,
      'auction_end', pg.auction_end,
      'zip_code', pg.zip_code,
      'quantity', pg.quantity,
      'effective_price', pg.effective_price,
      'distance_miles', case when pg.distance_miles is not null
                             then round(pg.distance_miles) end,
      -- Social-proof threshold: hidden entirely below the minimum
      'watcher_count', case when pg.watchers >= coalesce(v_min_watchers, 10)
                            then pg.watchers end,
      'photo_url', pg.photo_url
    )) from page pg), '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

-- Does a saved search's filter blob match a specific listing? Used when a
-- listing goes live to find buyers to alert. Supports the same filter
-- keys as search_listings (q, category, condition_grades, price_min/max,
-- listing_type).
create or replace function public.matches_saved_search(
  p_filters jsonb,
  p_listing_id uuid
) returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_tsq tsquery;
  v_grades text[];
  v_match boolean;
begin
  if nullif(trim(coalesce(p_filters ->> 'q', '')), '') is not null then
    v_tsq := build_search_query(p_filters ->> 'q');
  end if;
  if p_filters ? 'condition_grades' then
    select array_agg(upper(x)) into v_grades
    from jsonb_array_elements_text(p_filters -> 'condition_grades') x;
  end if;

  select true into v_match
  from listings l
  join master_equipment me on me.id = l.master_equipment_id
  where l.id = p_listing_id
    and l.status = 'active'
    and (v_tsq is null or to_tsvector('simple',
          coalesce(me.manufacturer, '') || ' ' || coalesce(me.model, '') || ' ' ||
          array_to_string(me.aliases, ' ') || ' ' || coalesce(l.title, '')) @@ v_tsq)
    and ((p_filters ->> 'category') is null or me.category = p_filters ->> 'category')
    and (v_grades is null or l.condition_grade = any(v_grades))
    and ((p_filters ->> 'listing_type') is null or l.listing_type = p_filters ->> 'listing_type')
    and ((p_filters ->> 'price_min') is null or
         coalesce(l.current_bid, l.asking_price) >= (p_filters ->> 'price_min')::numeric)
    and ((p_filters ->> 'price_max') is null or
         coalesce(l.current_bid, l.asking_price) <= (p_filters ->> 'price_max')::numeric);

  return coalesce(v_match, false);
end;
$$;

-- Saved searches to alert for a newly-live listing. One-hour re-alert
-- guard so a listing edit/re-approve doesn't double-send.
create or replace function public.saved_search_matches_for_listing(
  p_listing_id uuid
) returns table (
  search_id uuid,
  buyer_id uuid,
  email text,
  search_name text
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.buyer_id, u.email, s.name
  from saved_searches s
  join users u on u.id = s.buyer_id
  where s.email_alerts
    and (s.last_alerted_at is null or s.last_alerted_at < now() - interval '1 hour')
    and matches_saved_search(s.filters, p_listing_id);
$$;

revoke execute on function public.search_listings(jsonb) from public, anon, authenticated;
revoke execute on function public.matches_saved_search(jsonb, uuid) from public, anon, authenticated;
revoke execute on function public.saved_search_matches_for_listing(uuid) from public, anon, authenticated;
grant execute on function public.search_listings(jsonb) to service_role;
grant execute on function public.matches_saved_search(jsonb, uuid) to service_role;
grant execute on function public.saved_search_matches_for_listing(uuid) to service_role;
