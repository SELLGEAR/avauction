-- Admin action audit log (Security spec: "Audit log on every admin action
-- — who changed what and when"). Written by the admin API routes via the
-- service role; readable by admins only.

create table admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references users (id),
  -- e.g. listing_approved, listing_rejected, equipment_linked,
  -- equipment_approved_new, equipment_rejected
  action text not null,
  target_table text not null,
  target_id uuid,
  detail jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_log_admin_idx on admin_audit_log (admin_id, created_at desc);
create index admin_audit_log_target_idx on admin_audit_log (target_table, target_id);

alter table admin_audit_log enable row level security;

create policy admin_audit_log_admin_read on admin_audit_log
  for select using (is_admin());

-- Explicit grant per the 0026 rule (no automatic grants in this project);
-- the is_admin() policy filters rows. No client write grants — the log is
-- written exclusively by service-role routes.
grant select on admin_audit_log to authenticated;
