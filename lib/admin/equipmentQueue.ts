// Fuzzy match review screen backend: list the pending_master_equipment
// queue with best-match context, and resolve rows via the existing
// resolve_pending_equipment() function.

import { createServiceRoleClient } from "../supabase/server";
import { logAdminAction } from "../adminAudit";

export async function getEquipmentQueue(opts: {
  status?: string;
  page?: number;
  perPage?: number;
} = {}) {
  const status = opts.status ?? "pending";
  const page = Math.max(opts.page ?? 1, 1);
  const perPage = Math.min(Math.max(opts.perPage ?? 25, 1), 100);
  const supabase = createServiceRoleClient();

  const { data, count, error } = await supabase
    .from("pending_master_equipment")
    .select(
      `id, source, raw_title, manufacturer_guess, model_guess, listing_url,
       best_match_score, status, created_at,
       best_match:master_equipment!pending_master_equipment_best_match_id_fkey
         (id, manufacturer, model, category)`,
      { count: "exact" }
    )
    .eq("status", status)
    .order("created_at", { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) throw new Error(`equipment queue query failed: ${error.message}`);
  return { total: count ?? 0, page, per_page: perPage, results: data ?? [] };
}

export interface ResolveResult {
  ok: boolean;
  error?: string;
  status?: string;
  master_equipment_id?: string;
  deduplicated?: boolean;
}

export async function resolveEquipment(
  adminId: string,
  pendingId: string,
  action: "link_existing" | "approve_new" | "reject",
  opts: { masterEquipmentId?: string; manufacturer?: string; model?: string } = {}
): Promise<ResolveResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("resolve_pending_equipment", {
    p_pending_id: pendingId,
    p_action: action,
    p_master_equipment_id: opts.masterEquipmentId ?? null,
    p_manufacturer: opts.manufacturer ?? null,
    p_model: opts.model ?? null,
    p_resolved_by: adminId,
  });
  if (error) throw new Error(`resolve_pending_equipment failed: ${error.message}`);

  const result = data as ResolveResult;
  if (result.ok) {
    await logAdminAction({
      adminId,
      action: `equipment_${result.status}`,
      targetTable: "pending_master_equipment",
      targetId: pendingId,
      detail: {
        resolution: action,
        master_equipment_id: result.master_equipment_id ?? null,
        deduplicated: result.deduplicated ?? false,
      },
    });
  }
  return result;
}
