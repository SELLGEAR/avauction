-- Same issue migration 0002 fixed for master_equipment, now hitting every
-- table from 0006-0015: service_role bypasses RLS but still needs standard
-- table grants, and this project doesn't apply them automatically on
-- create. Grant across the schema and set default privileges so tables
-- created by future migrations inherit the grants instead of needing
-- another one of these.

grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
