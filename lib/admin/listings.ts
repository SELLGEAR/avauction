// Admin listing review: the queue view and the approve/reject action.
// Route handlers are thin wrappers around these so the harness can
// exercise the real paths.

import { createServiceRoleClient } from "../supabase/server";
import { logAdminAction } from "../adminAudit";
import { alertsForListing } from "../notifications/savedSearch";
import { sendListingApproved, sendListingRejected } from "../notifications/listingReview";

export async function getListingQueue(opts: {
  status?: string;
  page?: number;
  perPage?: number;
} = {}) {
  const status = opts.status ?? "pending_review";
  const page = Math.max(opts.page ?? 1, 1);
  const perPage = Math.min(Math.max(opts.perPage ?? 25, 1), 100);
  const supabase = createServiceRoleClient();

  const { data, count, error } = await supabase
    .from("listings")
    .select(
      `id, title, listing_type, status, condition_grade, grade_override,
       asking_price, reserve_price, quantity, zip_code, created_at,
       master_equipment (manufacturer, model, category),
       listing_admin_meta (quality_score, score_breakdown, suggested_grade, price_suggestion),
       qc_responses (*),
       sellers (business_name, account_type, verification_status, seller_tier, industry_verified),
       listing_photos (count)`,
      { count: "exact" }
    )
    .eq("status", status)
    .order("created_at", { ascending: true })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) throw new Error(`listing queue query failed: ${error.message}`);
  return { total: count ?? 0, page, per_page: perPage, results: data ?? [] };
}

export type ReviewResult =
  | { ok: true; status: string; alerted?: number }
  | { ok: false; error: string };

export async function reviewListing(
  adminId: string,
  listingId: string,
  action: "approve" | "reject",
  opts: { reason?: string; auctionStart?: string; auctionEnd?: string } = {}
): Promise<ReviewResult> {
  const supabase = createServiceRoleClient();
  const { data: listing } = await supabase
    .from("listings")
    .select("id, status, listing_type, seller_id, title")
    .eq("id", listingId)
    .single();

  if (!listing) return { ok: false, error: "listing_not_found" };
  if (listing.status !== "pending_review") {
    return { ok: false, error: "not_pending_review" };
  }

  if (action === "approve") {
    const update: Record<string, unknown> = { status: "active" };
    if (listing.listing_type === "auction") {
      // Approval is where an auction lot gets its Friday slot — an active
      // auction with null times is unbiddable by design
      if (!opts.auctionStart || !opts.auctionEnd) {
        return { ok: false, error: "auction_schedule_required" };
      }
      const start = new Date(opts.auctionStart);
      const end = new Date(opts.auctionEnd);
      if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
        return { ok: false, error: "invalid_auction_schedule" };
      }
      update.auction_start = start.toISOString();
      update.auction_end = end.toISOString();
    }

    // Status guard in the WHERE clause: two admins reviewing at once
    // serialize here — the second sees zero rows updated
    const { data: updated } = await supabase
      .from("listings")
      .update(update)
      .eq("id", listingId)
      .eq("status", "pending_review")
      .select("id");
    if (!updated || updated.length === 0) {
      return { ok: false, error: "not_pending_review" };
    }

    // The moment a listing goes live: saved-search alerts fire
    let alerted = 0;
    try {
      alerted = await alertsForListing(listingId);
    } catch (e) {
      console.error("saved-search alerts failed:", e);
    }
    void sendListingApproved({
      sellerId: listing.seller_id,
      listingId,
      listingTitle: listing.title,
    }).catch((e) => console.error("listing-approved email failed:", e));

    await logAdminAction({
      adminId,
      action: "listing_approved",
      targetTable: "listings",
      targetId: listingId,
      detail: {
        listing_type: listing.listing_type,
        auction_start: update.auction_start ?? null,
        auction_end: update.auction_end ?? null,
        saved_search_alerts_sent: alerted,
      },
    });
    return { ok: true, status: "active", alerted };
  }

  // reject
  const reason = (opts.reason ?? "").trim();
  if (!reason) return { ok: false, error: "reason_required" };

  const { data: updated } = await supabase
    .from("listings")
    .update({ status: "draft" })
    .eq("id", listingId)
    .eq("status", "pending_review")
    .select("id");
  if (!updated || updated.length === 0) {
    return { ok: false, error: "not_pending_review" };
  }

  void sendListingRejected({
    sellerId: listing.seller_id,
    listingId,
    listingTitle: listing.title,
    reason,
  }).catch((e) => console.error("listing-rejected email failed:", e));

  await logAdminAction({
    adminId,
    action: "listing_rejected",
    targetTable: "listings",
    targetId: listingId,
    detail: { reason },
  });
  return { ok: true, status: "draft" };
}
