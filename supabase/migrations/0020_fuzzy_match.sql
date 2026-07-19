-- Fuzzy match system: links scraped listing titles to master_equipment
-- records via pg_trgm, with confidence scoring and a review queue for
-- uncertain matches. Data quality rules enforced here: scraped data only
-- ever links to existing master records automatically — new master records
-- require admin review (the pending queue).

create extension if not exists pg_trgm with schema extensions;

-- Trigram index over the normalized product identity. match_equipment()
-- currently scores exhaustively (correctness first, table is small); this
-- index enables %-operator prefiltering later if scraping volume demands.
create index master_equipment_product_key_trgm_idx
  on master_equipment using gin (product_key extensions.gin_trgm_ops);

insert into pricing_engine_settings (key, value, description) values
  ('fuzzy_match_auto_threshold', '0.82',
   'Similarity score at or above which a scraped title auto-links to a master_equipment record.'),
  ('fuzzy_match_queue_threshold', '0.45',
   'Score at or above which an unmatched title goes to pending_master_equipment for admin review. Below: discarded.');

-- Review queue for scraped products that could not be confidently matched.
-- Rows are resolved (linked/approved/rejected), never deleted — audit trail.
create table pending_master_equipment (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  raw_title text not null,
  manufacturer_guess text,
  model_guess text,
  listing_url text,
  -- Dedup key: weekly re-scrapes of the same unmatched product hit the
  -- unique index below instead of piling up
  normalized_title text generated always as (normalize_product_key(raw_title, null)) stored,
  best_match_id uuid references master_equipment (id),
  best_match_score numeric,
  status text not null default 'pending'
    check (status in ('pending', 'linked', 'approved', 'rejected')),
  resolved_master_equipment_id uuid references master_equipment (id),
  resolved_by uuid references users (id),
  resolved_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create unique index pending_master_equipment_dedup_key
  on pending_master_equipment (source, normalized_title);
create index pending_master_equipment_status_idx
  on pending_master_equipment (status);

alter table pending_master_equipment enable row level security;

create policy pending_master_equipment_admin_read on pending_master_equipment
  for select using (is_admin());
-- Writes: service role only (scraper inserts, resolution function)

-- Scored candidates for a raw scraped title. word_similarity() is the
-- workhorse: it scores how well a product key appears WITHIN the dirty
-- title ("...lot of 172, excellent condition!") instead of punishing every
-- extra word. Aliases score via the same normalization; explicit
-- manufacturer/model hints (structured scrape fields) score against the
-- full key symmetrically.
create or replace function public.match_equipment(
  p_raw_title text,
  p_manufacturer_hint text default null,
  p_model_hint text default null,
  p_limit int default 5
) returns table (
  master_equipment_id uuid,
  manufacturer text,
  model text,
  score numeric
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_norm_title text := normalize_product_key(p_raw_title, null);
  v_hint_key text := case
    when p_manufacturer_hint is not null or p_model_hint is not null
    then normalize_product_key(p_manufacturer_hint, p_model_hint)
    else null
  end;
begin
  return query
  select me.id, me.manufacturer, me.model, s.score::numeric
  from master_equipment me
  cross join lateral (
    select greatest(
      word_similarity(me.product_key, v_norm_title),
      coalesce(
        (select max(word_similarity(normalize_product_key(me.manufacturer, a), v_norm_title))
         from unnest(me.aliases) a),
        0
      ),
      case when v_hint_key is not null then
        greatest(
          similarity(me.product_key, v_hint_key),
          word_similarity(me.product_key, v_hint_key)
        )
      else 0 end
    ) as score
  ) s
  where me.status <> 'rejected'
    and s.score >= 0.2
  order by s.score desc, me.created_at asc
  limit p_limit;
end;
$$;

-- The single entry point for the phase-B pricing scrapers:
--   matched          — confident link, use master_equipment_id
--   queued           — went to admin review queue
--   queued_duplicate — already in the queue from an earlier scrape
--   rejected         — too dissimilar to everything; discard (junk rule)
create or replace function public.match_or_queue(
  p_source text,
  p_raw_title text,
  p_manufacturer_hint text default null,
  p_model_hint text default null,
  p_listing_url text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_auto numeric;
  v_queue numeric;
  best record;
  v_pending_id uuid;
begin
  select value::text::numeric into v_auto
  from pricing_engine_settings where key = 'fuzzy_match_auto_threshold';
  select value::text::numeric into v_queue
  from pricing_engine_settings where key = 'fuzzy_match_queue_threshold';

  select * into best
  from match_equipment(p_raw_title, p_manufacturer_hint, p_model_hint, 1);

  if best.master_equipment_id is not null and best.score >= v_auto then
    return jsonb_build_object(
      'decision', 'matched',
      'master_equipment_id', best.master_equipment_id,
      'score', best.score
    );
  end if;

  if best.master_equipment_id is not null and best.score >= v_queue then
    insert into pending_master_equipment
      (source, raw_title, manufacturer_guess, model_guess, listing_url,
       best_match_id, best_match_score)
    values
      (p_source, p_raw_title, p_manufacturer_hint, p_model_hint, p_listing_url,
       best.master_equipment_id, best.score)
    on conflict (source, normalized_title) do nothing
    returning id into v_pending_id;

    if v_pending_id is null then
      return jsonb_build_object('decision', 'queued_duplicate', 'score', best.score);
    end if;
    return jsonb_build_object(
      'decision', 'queued',
      'pending_id', v_pending_id,
      'best_match_id', best.master_equipment_id,
      'score', best.score
    );
  end if;

  return jsonb_build_object('decision', 'rejected', 'score', coalesce(best.score, 0));
end;
$$;

-- Admin resolution of a queue row:
--   link_existing — it was a match after all; requires p_master_equipment_id
--   approve_new   — creates the master record (admin may correct
--                   manufacturer/model spelling); if the corrected identity
--                   already exists, links to it instead of duplicating
--   reject        — not a real product / out of scope
create or replace function public.resolve_pending_equipment(
  p_pending_id uuid,
  p_action text,
  p_master_equipment_id uuid default null,
  p_manufacturer text default null,
  p_model text default null,
  p_resolved_by uuid default null
) returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  p record;
  v_mfr text;
  v_model text;
  v_existing uuid;
  v_new_id uuid;
begin
  select * into p from pending_master_equipment where id = p_pending_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'pending_not_found');
  end if;
  if p.status <> 'pending' then
    return jsonb_build_object('ok', false, 'error', 'already_resolved', 'status', p.status);
  end if;

  if p_action = 'link_existing' then
    if p_master_equipment_id is null then
      return jsonb_build_object('ok', false, 'error', 'master_equipment_id_required');
    end if;
    update pending_master_equipment
    set status = 'linked',
        resolved_master_equipment_id = p_master_equipment_id,
        resolved_by = p_resolved_by,
        resolved_at = now()
    where id = p_pending_id;
    return jsonb_build_object('ok', true, 'status', 'linked',
                              'master_equipment_id', p_master_equipment_id);

  elsif p_action = 'approve_new' then
    v_mfr := coalesce(p_manufacturer, p.manufacturer_guess);
    v_model := coalesce(p_model, p.model_guess);
    if v_mfr is null or v_model is null then
      return jsonb_build_object('ok', false, 'error', 'manufacturer_and_model_required');
    end if;

    select id into v_existing
    from master_equipment
    where product_key = normalize_product_key(v_mfr, v_model);

    if v_existing is not null then
      update pending_master_equipment
      set status = 'linked',
          resolved_master_equipment_id = v_existing,
          resolved_by = p_resolved_by,
          resolved_at = now(),
          notes = coalesce(notes || ' | ', '') || 'approve_new resolved to existing record'
      where id = p_pending_id;
      return jsonb_build_object('ok', true, 'status', 'linked',
                                'master_equipment_id', v_existing,
                                'deduplicated', true);
    end if;

    insert into master_equipment (manufacturer, model, status, source, source_url)
    values (v_mfr, v_model, 'approved', p.source, p.listing_url)
    returning id into v_new_id;

    update pending_master_equipment
    set status = 'approved',
        resolved_master_equipment_id = v_new_id,
        resolved_by = p_resolved_by,
        resolved_at = now()
    where id = p_pending_id;
    return jsonb_build_object('ok', true, 'status', 'approved',
                              'master_equipment_id', v_new_id);

  elsif p_action = 'reject' then
    update pending_master_equipment
    set status = 'rejected',
        resolved_by = p_resolved_by,
        resolved_at = now()
    where id = p_pending_id;
    return jsonb_build_object('ok', true, 'status', 'rejected');

  else
    return jsonb_build_object('ok', false, 'error', 'unknown_action');
  end if;
end;
$$;

revoke execute on function public.match_equipment(text, text, text, int) from public, anon, authenticated;
revoke execute on function public.match_or_queue(text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.resolve_pending_equipment(uuid, text, uuid, text, text, uuid) from public, anon, authenticated;
grant execute on function public.match_equipment(text, text, text, int) to service_role;
grant execute on function public.match_or_queue(text, text, text, text, text) to service_role;
grant execute on function public.resolve_pending_equipment(uuid, text, uuid, text, text, uuid) to service_role;
