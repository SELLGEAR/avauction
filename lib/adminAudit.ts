import { createServiceRoleClient } from "./supabase/server";

// Every admin mutation records who changed what and when. Failures log
// loudly but never block the action itself — the action already happened.
export async function logAdminAction(entry: {
  adminId: string;
  action: string;
  targetTable: string;
  targetId?: string | null;
  detail?: Record<string, unknown>;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("admin_audit_log").insert({
    admin_id: entry.adminId,
    action: entry.action,
    target_table: entry.targetTable,
    target_id: entry.targetId ?? null,
    detail: entry.detail ?? {},
  });
  if (error) console.error(`AUDIT LOG WRITE FAILED (${entry.action}):`, error.message);
}
