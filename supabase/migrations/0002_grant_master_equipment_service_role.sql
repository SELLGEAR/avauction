-- service_role bypasses RLS but still needs standard table grants for
-- PostgREST to allow access — apparently not inherited automatically
-- for this table, so granting explicitly.
grant select, insert, update, delete on public.master_equipment to service_role;
