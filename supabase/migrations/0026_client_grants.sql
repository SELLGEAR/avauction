-- Base grants for anon/authenticated. Same project quirk 0016 fixed for
-- service_role: no automatic table grants, so every client-facing RLS
-- policy written since 0006 was inert — PostgREST returned permission
-- denied before policies were ever evaluated (0008's explicit bid_history
-- grant was the tell). Grants are the outer gate, policies filter rows
-- within them.
--
-- Deliberately NOT granted (API-only by design, absence of grant enforces):
--   bids insert (place_bid() only), users/sellers writes (0025 fix),
--   transactions/listings writes (state machines), market_prices anything
--   (the moat), all admin/ops tables.

grant usage on schema public to anon, authenticated;

-- Public browse surface (policies restrict to active/approved/public rows)
grant select on listings, listing_photos, qc_responses, reviews,
  qa_messages, stolen_gear_registry to anon, authenticated;

-- Own-row reads (policies restrict to auth.uid())
grant select on users, sellers, transactions, disputes, bids,
  subscriptions, concierge_requests to authenticated;

-- Client-managed rows (policies restrict to own rows)
grant select, insert, update, delete on watchlists, saved_searches to authenticated;
grant insert on disputes to authenticated;
grant insert on reviews to authenticated;

-- NOTE: future migrations creating client-facing tables must add grants
-- explicitly — this project has no default privileges for anon/authenticated
-- (by choice: new tables start locked).
