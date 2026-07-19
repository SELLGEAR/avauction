-- Same bug 0003 already fixed once for av_iq_product_id, reintroduced here:
-- a partial unique index (WHERE product_key <> '') doesn't match plain
-- `ON CONFLICT (product_key)` target inference — Postgres requires the
-- conflict target to exactly match an index, partial predicate included.
-- Surfaced immediately by the gearsource dry run: "there is no unique or
-- exclusion constraint matching the ON CONFLICT specification."
--
-- A plain unique constraint already allows unlimited NULLs (not a concern
-- here — product_key is a generated NOT NULL-effectively column) and, per a
-- pre-migration check, there are zero existing rows with an empty
-- product_key, so dropping the partial predicate is safe.
drop index if exists master_equipment_product_key_key;

alter table master_equipment
  add constraint master_equipment_product_key_key unique (product_key);
