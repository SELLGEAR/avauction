-- match_equipment() rewrite: index-assisted candidate prefilter.
--
-- The 0020 version scored ALL of master_equipment exhaustively per call
-- ("correctness first, table is small" — no longer true at 268,048 rows):
-- it now exceeds the statement timeout, which broke the seller
-- "can't find it?" path (match_or_queue -> 500) and would break every
-- Phase B scraper on first contact. Found Aug 23, 2026 by the gear entry
-- form's end-to-end tests.
--
-- Fix: prefilter candidates through master_equipment_product_key_trgm_idx
-- (the same gin index the typeahead rides), then run the ORIGINAL scoring
-- (word-similarity vs dirty title, aliases, hints) over candidates only.
-- Same signature, same return shape, same thresholds. match_or_queue and
-- resolve_pending_equipment are unchanged and keep calling this.
--
-- Threshold note: the <% prefilter consults pg_trgm.word_similarity_threshold,
-- default 0.60 — ABOVE the 0.45 queue band, which would silently turn
-- queue-band items into rejections. It must run at 0.40 (below the band,
-- with margin); similarity_threshold drops to 0.20 to mirror the 0.2
-- scoring floor. Supabase's managed Postgres refuses the
-- CREATE FUNCTION ... SET form for extension GUCs (42501: permission
-- denied to set parameter — placeholder-GUC restriction), so both are set
-- INSIDE the body via set_config(..., is_local => true): transaction-
-- scoped, reverts at commit, safe under PostgREST connection pooling.
-- show_limit() is called first to force pg_trgm's library to load so its
-- GUCs are registered as real (settable) parameters before set_config
-- touches them. The function is VOLATILE because of set_config; it's
-- called once per submission/scrape, so plan-time volatility is moot.
--
-- Known limitations (accepted): (1) an alias-only match whose product_key
-- shares almost nothing with the raw title can miss the prefilter and
-- fall to queue/reject instead of auto-linking — aliases still score for
-- every candidate the prefilter finds; (2) an extremely long dirty title
-- (beyond ~4-5x the key's length) can dilute the similarity arm below
-- 0.20 and miss. Seller submissions are unaffected (their titles are just
-- "manufacturer model"); both only matter for Phase B scrapers. Proper
-- fix if ever needed: a side table of normalized alias keys with its own
-- trigram index.

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
volatile
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
  -- Load pg_trgm (registers its GUCs), then set thresholds for this
  -- transaction only — see header comment for why not CREATE ... SET
  perform show_limit();
  perform set_config('pg_trgm.word_similarity_threshold', '0.4', true);
  perform set_config('pg_trgm.similarity_threshold', '0.2', true);

  return query
  with candidates as (
    -- Every arm is in pg_trgm's index-supported orientation for the gin
    -- index on product_key: `column % constant` (similarity) and
    -- `constant <% column` (word-similarity extent search). The naive
    -- "key <% title" form is NOT indexable and would seq-scan — the very
    -- bug this migration fixes.
    --   % arm  — symmetric similarity at 0.20: catches the key inside a
    --            dirty title up to roughly 4-5x the key's length
    --   <% arm — the (short) title/hint appearing within a longer key,
    --            at 0.40 (below the 0.45 queue band)
    select me.id, me.manufacturer, me.model, me.product_key, me.aliases, me.created_at
    from master_equipment me
    where me.status <> 'rejected'
      and (
        me.product_key % v_norm_title
        or v_norm_title <% me.product_key
        or (v_hint_key is not null
            and (me.product_key % v_hint_key or v_hint_key <% me.product_key))
      )
  )
  select c.id, c.manufacturer, c.model, s.score::numeric
  from candidates c
  cross join lateral (
    select greatest(
      word_similarity(c.product_key, v_norm_title),
      coalesce(
        (select max(word_similarity(normalize_product_key(c.manufacturer, a), v_norm_title))
         from unnest(c.aliases) a),
        0
      ),
      case when v_hint_key is not null then
        greatest(
          similarity(c.product_key, v_hint_key),
          word_similarity(c.product_key, v_hint_key)
        )
      else 0 end
    ) as score
  ) s
  where s.score >= 0.2
  order by s.score desc, c.created_at asc
  limit p_limit;
end;
$$;

-- Grants identical to 0020 (create or replace preserves them, but restate
-- for self-containment if this file ever runs on a fresh database)
revoke execute on function public.match_equipment(text, text, text, int) from public, anon, authenticated;
grant execute on function public.match_equipment(text, text, text, int) to service_role;

-- Smoke test: proves the function applies AND completes inside the
-- statement timeout against the live catalog, right in the SQL editor.
do $$
declare
  n int;
begin
  select count(*) into n
  from match_equipment('DiGiCo SD12 96 digital mixing console — mint, w/ case', null, null, 5);
  if n = 0 then
    raise exception 'match_equipment smoke test returned no candidates';
  end if;
  raise notice 'match_equipment smoke test OK: % candidates', n;
end;
$$;
