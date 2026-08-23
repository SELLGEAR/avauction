-- Equipment typeahead search for the seller gear entry form.
--
-- match_equipment() (0020) scores every row via word_similarity — fine for
-- one call at submit time, wrong per keystroke over a 268k-row catalog.
-- search_equipment() is index-assisted instead: both of its predicates
-- (LIKE substring, <% word-similarity) are gin_trgm_ops-indexable against
-- master_equipment_product_key_trgm_idx (0020), so the scan is bounded by
-- matches, not table size.
--
-- Scope: identity fields only (id, manufacturer, model, category) — the
-- typeahead needs nothing else, and the API route above this is
-- signed-in-only + rate limited (it's our clean catalog).
--
-- Not searched: aliases. They'd need an unnest per row (no index help).
-- The "can't find it?" manual path covers alias-only hits — match_or_queue
-- at submit time DOES score aliases and will still auto-link them.

create or replace function public.search_equipment(
  p_q text,
  p_limit int default 10
) returns table (
  id uuid,
  manufacturer text,
  model text,
  category text,
  score real
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_q text := normalize_product_key(p_q, null);
  v_limit int := least(greatest(coalesce(p_limit, 10), 1), 25);
begin
  if v_q is null or length(v_q) < 2 then
    return;
  end if;

  return query
  select t.id, t.manufacturer, t.model, t.category, t.score
  from (
    select me.id, me.manufacturer, me.model, me.category,
      greatest(
        -- Substring hit: floored at 0.5 so it outranks most fuzzy-only
        -- matches; similarity breaks ties (shorter keys rank higher)
        case when me.product_key like '%' || v_q || '%'
             then 0.5 + 0.5 * similarity(me.product_key, v_q)
             else 0 end,
        -- Typo tolerance: how well the query appears WITHIN the key
        word_similarity(v_q, me.product_key)
      )::real as score
    from master_equipment me
    where me.status <> 'rejected'  -- same visibility rule as submit_listing()
      and (me.product_key like '%' || v_q || '%' or v_q <% me.product_key)
  ) t
  -- Tie-break at equal score: shortest name first. word_similarity gives
  -- 1.00 to every key containing the query words, and alphabetical order
  -- surfaced junk scraped titles ("...Lot of 5") above canonical products
  -- in live testing — canonical entries are almost always the shortest.
  order by t.score desc,
           char_length(t.manufacturer || ' ' || t.model) asc,
           t.manufacturer asc, t.model asc
  limit v_limit;
end;
$$;

revoke execute on function public.search_equipment(text, int) from public, anon, authenticated;
grant execute on function public.search_equipment(text, int) to service_role;
