-- The partial unique index from 0001 (WHERE av_iq_product_id IS NOT NULL) doesn't
-- match plain `ON CONFLICT (av_iq_product_id)` target inference — Postgres requires
-- the conflict target to exactly match an index, partial predicate included. A plain
-- unique constraint already allows unlimited NULLs on its own, so the partial
-- predicate was unnecessary in the first place.
drop index if exists master_equipment_av_iq_product_id_key;

alter table master_equipment
  add constraint master_equipment_av_iq_product_id_key unique (av_iq_product_id);
