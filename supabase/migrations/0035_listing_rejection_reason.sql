-- 0035 — seller-visible rejection reason.
--
-- Rejection returns a listing to 'draft' (there is no 'rejected' status —
-- see lib/admin/listings.ts), but until now the reason lived only in the
-- rejection email and admin_audit_log, neither seller-readable. This column
-- is written by the service role in reviewListing() on reject, cleared on
-- approve, and reaches the seller through the existing
-- listings_seller_read_own RLS policy (0007) + table-level select grant
-- (0026) — no policy or grant changes needed.
--
-- A 'draft' listing with a rejection_reason is one returned from review;
-- edit/resubmit of returned drafts is out of scope (loose end, Sept 17 2026).

alter table listings add column rejection_reason text;

comment on column listings.rejection_reason is
  'Admin-entered reason the listing was returned from review (status draft). '
  'Written on reject, cleared on approve. Seller-visible via RLS read-own.';
