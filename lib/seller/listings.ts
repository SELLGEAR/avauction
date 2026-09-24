// The seller's own view of their listings: list, detail, withdraw.
// Route handlers are thin wrappers so the harness exercises the real
// paths. Everything runs as the service role but is SCOPED BY seller_id on
// every query — a seller never sees another seller's row through here.
//
// What the seller can and cannot see:
//   - their own reserve_price (it's theirs), current_bid, bid_count,
//     watcher_count (threshold-gated like the public page)
//   - NEVER bidder identities: no bids rows, no bidder ids, no usernames
//   - NEVER admin-only data: listing_admin_meta (quality score, price
//     suggestion) is not selected here
//
// Listing states (listings.status, 0007) as the seller sees them:
//   pending_review  In review
//   active          Live (auction, or buy-it-now — including an auction
//                   auto-bumped to buy-it-now after a reserve-not-met close)
//   draft           Returned from review — there is NO 'rejected' status;
//                   rejection sets rejection_reason and returns to draft
//   sold            Sold
//   expired         Ended unsold (an auction with nothing to bump to)
//   delisted        Withdrawn (delist_reason records the exit prompt)

import { createServiceRoleClient } from "../supabase/server";

export type ListingStatus = "draft" | "pending_review" | "active" | "sold" | "expired" | "delisted";
export type SellerGroup = "in_review" | "live" | "returned" | "sold" | "ended" | "withdrawn";

export const GROUP_FOR_STATUS: Record<ListingStatus, SellerGroup> = {
  pending_review: "in_review",
  active: "live",
  draft: "returned",
  sold: "sold",
  expired: "ended",
  delisted: "withdrawn",
};

export const GROUP_LABELS: Record<SellerGroup, string> = {
  in_review: "In review",
  live: "Live",
  returned: "Returned from review",
  sold: "Sold",
  ended: "Ended unsold",
  withdrawn: "Withdrawn",
};

export const GROUP_ORDER: SellerGroup[] = ["in_review", "live", "returned", "sold", "ended", "withdrawn"];

// The delist prompt (CLAUDE.md, Non-circumvention): "Was this sold through
// AVauction.com?" Skipping the question is recorded as no_answer.
export const DELIST_REASONS = ["sold_on_platform", "sold_privately", "no_longer_selling", "no_answer"] as const;
export type DelistReason = (typeof DELIST_REASONS)[number];

// Reasons that log a private-sale flag (seller_strikes, is_strike=false):
// an admitted private sale, or refusing to answer. Flags accumulate toward
// non-circumvention review; they are not strikes.
export const FLAGGING_REASONS: readonly DelistReason[] = ["sold_privately", "no_answer"];

export type WithdrawBlock =
  | "auction_has_bids" // bidders hold commitments — admin pulls lots (loose end #9)
  | "already_sold"
  | "already_ended"
  | "already_withdrawn";

// The state-machine rule for seller-initiated withdrawal. Pure, so the
// harness can table-test it and the UI can mirror it.
export function withdrawBlock(l: {
  status: string;
  listing_type: string;
  bid_count: number | null;
}): WithdrawBlock | null {
  switch (l.status) {
    case "draft":
    case "pending_review":
      return null;
    case "active":
      return l.listing_type === "auction" && (l.bid_count ?? 0) > 0 ? "auction_has_bids" : null;
    case "sold":
      return "already_sold";
    case "expired":
      return "already_ended";
    case "delisted":
      return "already_withdrawn";
    default:
      return "already_ended";
  }
}

const LIST_COLUMNS =
  "id, title, status, listing_type, condition_grade, quantity, asking_price, current_bid, bid_count, auction_start, auction_end, rejection_reason, delist_reason, created_at, updated_at";

export interface SellerListingRow {
  id: string;
  title: string;
  status: ListingStatus;
  group: SellerGroup;
  listing_type: string;
  condition_grade: string | null;
  quantity: number;
  asking_price: number | null;
  current_bid: number | null;
  bid_count: number;
  auction_start: string | null;
  auction_end: string | null;
  rejection_reason: string | null;
  delist_reason: string | null;
  created_at: string;
  updated_at: string;
  cover_url: string | null; // signed buyer URL (blur + watermark), position 0
  photo_count: number;
  watcher_count: number | null; // null below min_watchers_to_display
  can_withdraw: boolean;
  withdraw_block: WithdrawBlock | null;
}

async function minWatchersToDisplay(supabase: ReturnType<typeof createServiceRoleClient>): Promise<number> {
  const { data } = await supabase
    .from("pricing_engine_settings")
    .select("value")
    .eq("key", "min_watchers_to_display")
    .maybeSingle();
  const n = Number(data?.value ?? 10);
  return Number.isFinite(n) ? n : 10;
}

// Watcher counts for a set of listings, threshold applied. Only live
// listings get counted — nobody watches a draft.
async function watcherCounts(
  supabase: ReturnType<typeof createServiceRoleClient>,
  listingIds: string[],
  threshold: number
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  if (listingIds.length === 0) return out;
  const { data } = await supabase.from("watchlists").select("listing_id").in("listing_id", listingIds);
  const counts = new Map<string, number>();
  for (const w of data ?? []) counts.set(w.listing_id, (counts.get(w.listing_id) ?? 0) + 1);
  for (const id of listingIds) {
    const c = counts.get(id) ?? 0;
    out.set(id, c >= threshold ? c : null);
  }
  return out;
}

export async function getSellerListings(sellerId: string): Promise<SellerListingRow[]> {
  const supabase = createServiceRoleClient();
  const { data: rows, error } = await supabase
    .from("listings")
    .select(`${LIST_COLUMNS}, listing_photos (url, position)`)
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`seller listings query failed: ${error.message}`);

  const live = (rows ?? []).filter((r) => r.status === "active").map((r) => r.id);
  const threshold = await minWatchersToDisplay(supabase);
  const watchers = await watcherCounts(supabase, live, threshold);

  return (rows ?? []).map((r) => {
    const photos = ((r.listing_photos ?? []) as { url: string; position: number }[])
      .slice()
      .sort((a, b) => a.position - b.position);
    const block = withdrawBlock(r);
    return {
      id: r.id,
      title: r.title,
      status: r.status as ListingStatus,
      group: GROUP_FOR_STATUS[r.status as ListingStatus] ?? "ended",
      listing_type: r.listing_type,
      condition_grade: r.condition_grade,
      quantity: r.quantity,
      asking_price: r.asking_price == null ? null : Number(r.asking_price),
      current_bid: r.current_bid == null ? null : Number(r.current_bid),
      bid_count: r.bid_count ?? 0,
      auction_start: r.auction_start,
      auction_end: r.auction_end,
      rejection_reason: r.rejection_reason,
      delist_reason: r.delist_reason,
      created_at: r.created_at,
      updated_at: r.updated_at,
      cover_url: photos[0]?.url ?? null,
      photo_count: photos.length,
      watcher_count: r.status === "active" ? (watchers.get(r.id) ?? null) : null,
      can_withdraw: block === null,
      withdraw_block: block,
    };
  });
}

export interface SellerListingDetail extends SellerListingRow {
  description: string | null;
  grade_override: boolean;
  hours_of_use: number | null;
  serial_numbers: string[];
  year_of_manufacture: number | null;
  purchase_year: number | null;
  zip_code: string;
  reserve_price: number | null; // the seller's own — never public
  known_issues: string;
  flight_case_included: boolean | null;
  entry_method: string | null;
  equipment: { manufacturer: string; model: string; category: string } | null;
  qc: {
    powers_on: boolean;
    all_components: boolean;
    flight_case: boolean;
    cosmetic_damage: string;
    known_issues: boolean;
    known_issues_description: string | null;
    serviced: boolean;
    service_description: string | null;
    serial_confirmed: boolean;
    suggested_grade: string | null;
    seller_accepted_grade: boolean;
  } | null;
  photos: {
    id: string;
    url: string; // signed buyer URL — blur regions + watermark already applied
    photo_type: string;
    position: number;
    moderation_status: string;
    blur_region_count: number;
    width: number | null;
    height: number | null;
  }[];
}

// Everything the seller submitted, exactly as buyers will see the photos.
// Returns null when the listing doesn't exist OR belongs to someone else —
// the two are deliberately indistinguishable.
export async function getSellerListingDetail(sellerId: string, listingId: string): Promise<SellerListingDetail | null> {
  const supabase = createServiceRoleClient();
  const { data: l, error } = await supabase
    .from("listings")
    .select(
      `${LIST_COLUMNS}, description, grade_override, hours_of_use, serial_numbers, year_of_manufacture,
       purchase_year, zip_code, reserve_price, known_issues, flight_case_included, entry_method,
       master_equipment:master_equipment_id (manufacturer, model, category),
       qc_responses (powers_on, all_components, flight_case, cosmetic_damage, known_issues,
         known_issues_description, serviced, service_description, serial_confirmed,
         suggested_grade, seller_accepted_grade),
       listing_photos (id, url, photo_type, position, moderation_status, blur_regions, width, height)`
    )
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (error) throw new Error(`seller listing detail query failed: ${error.message}`);
  if (!l) return null;

  const threshold = await minWatchersToDisplay(supabase);
  const watchers = l.status === "active" ? await watcherCounts(supabase, [l.id], threshold) : new Map();

  const equip = (Array.isArray(l.master_equipment) ? l.master_equipment[0] : l.master_equipment) as
    | { manufacturer: string; model: string; category: string }
    | null;
  const qc = (Array.isArray(l.qc_responses) ? l.qc_responses[0] : l.qc_responses) as SellerListingDetail["qc"];
  const photos = ((l.listing_photos ?? []) as Record<string, unknown>[])
    .slice()
    .sort((a, b) => Number(a.position) - Number(b.position))
    .map((p) => ({
      id: String(p.id),
      url: String(p.url),
      photo_type: String(p.photo_type),
      position: Number(p.position),
      moderation_status: String(p.moderation_status),
      blur_region_count: Array.isArray(p.blur_regions) ? p.blur_regions.length : 0,
      width: p.width == null ? null : Number(p.width),
      height: p.height == null ? null : Number(p.height),
    }));
  const block = withdrawBlock(l);

  return {
    id: l.id,
    title: l.title,
    status: l.status as ListingStatus,
    group: GROUP_FOR_STATUS[l.status as ListingStatus] ?? "ended",
    listing_type: l.listing_type,
    condition_grade: l.condition_grade,
    quantity: l.quantity,
    asking_price: l.asking_price == null ? null : Number(l.asking_price),
    current_bid: l.current_bid == null ? null : Number(l.current_bid),
    bid_count: l.bid_count ?? 0,
    auction_start: l.auction_start,
    auction_end: l.auction_end,
    rejection_reason: l.rejection_reason,
    delist_reason: l.delist_reason,
    created_at: l.created_at,
    updated_at: l.updated_at,
    cover_url: photos[0]?.url ?? null,
    photo_count: photos.length,
    watcher_count: l.status === "active" ? (watchers.get(l.id) ?? null) : null,
    can_withdraw: block === null,
    withdraw_block: block,
    description: l.description,
    grade_override: !!l.grade_override,
    hours_of_use: l.hours_of_use,
    serial_numbers: (l.serial_numbers ?? []) as string[],
    year_of_manufacture: l.year_of_manufacture,
    purchase_year: l.purchase_year,
    zip_code: l.zip_code,
    reserve_price: l.reserve_price == null ? null : Number(l.reserve_price),
    known_issues: l.known_issues,
    flight_case_included: l.flight_case_included,
    entry_method: l.entry_method,
    equipment: equip ?? null,
    qc: qc ?? null,
    photos,
  };
}

export type WithdrawResult =
  | { ok: true; status: "delisted"; delist_reason: DelistReason; flagged: boolean }
  | { ok: false; error: "listing_not_found" | "invalid_reason" | "not_withdrawable"; block?: WithdrawBlock };

// Seller-initiated withdrawal -> 'delisted'. The status guard in the WHERE
// clause (plus bid_count = 0 for auctions) makes a race with a closing
// auction or an incoming bid resolve safely: zero rows updated = refused.
export async function withdrawListing(sellerId: string, listingId: string, reason: unknown): Promise<WithdrawResult> {
  if (typeof reason !== "string" || !(DELIST_REASONS as readonly string[]).includes(reason)) {
    return { ok: false, error: "invalid_reason" };
  }
  const delistReason = reason as DelistReason;
  const supabase = createServiceRoleClient();
  const { data: l } = await supabase
    .from("listings")
    .select("id, status, listing_type, bid_count")
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .maybeSingle();
  if (!l) return { ok: false, error: "listing_not_found" };
  const block = withdrawBlock(l);
  if (block) return { ok: false, error: "not_withdrawable", block };

  let q = supabase
    .from("listings")
    .update({ status: "delisted", delist_reason: delistReason })
    .eq("id", listingId)
    .eq("seller_id", sellerId)
    .eq("status", l.status);
  if (l.status === "active" && l.listing_type === "auction") q = q.eq("bid_count", 0);
  const { data: updated, error } = await q.select("id");
  if (error) throw new Error(`withdraw update failed: ${error.message}`);
  if (!updated || updated.length === 0) {
    // State moved under us (bid landed, auction closed, admin acted)
    const { data: now } = await supabase.from("listings").select("status, listing_type, bid_count").eq("id", listingId).single();
    return { ok: false, error: "not_withdrawable", block: now ? (withdrawBlock(now) ?? "already_ended") : "already_ended" };
  }

  const flagged = FLAGGING_REASONS.includes(delistReason);
  if (flagged) {
    const { error: flagErr } = await supabase.from("seller_strikes").insert({
      seller_id: sellerId,
      violation_type: "private_sale_flag",
      is_strike: false,
      listing_id: listingId,
      notes: `Delist prompt answer: ${delistReason}`,
    });
    if (flagErr) console.error("private_sale_flag insert failed:", flagErr.message);
  }
  return { ok: true, status: "delisted", delist_reason: delistReason, flagged };
}
