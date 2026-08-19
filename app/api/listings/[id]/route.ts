import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { bidIncrement, DEFAULT_INCREMENT_TIERS } from "@/lib/auction/increments";
import { AUCTION_AUTO_EXTEND_MINUTES } from "@/lib/time/auctionSchedule";
import type { BidIncrementTier, ListingDetail } from "@/lib/auction/types";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/listings/[id] — public listing detail, the read side of the
// status-driven listing page. Auth is optional: a valid Bearer token adds
// the viewer block (is_high_bidder / is_watched), its absence changes
// nothing else. Serves only 'active' and 'sold' listings, mirroring the
// public RLS select policy — everything else 404s, including 'expired'
// lots. reserve_price never leaves the server.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const supabase = createServiceRoleClient();
  const { data: l, error } = await supabase
    .from("listings")
    .select(
      `id, title, description, condition_grade, quantity, hours_of_use,
       year_of_manufacture, zip_code, flight_case_included, listing_type,
       status, auction_start, auction_end, current_bid, bid_count,
       asking_price, reserve_price,
       master_equipment:master_equipment_id (manufacturer, model, category),
       seller:seller_id (anonymous_username, verification_status, seller_tier,
         industry_verified, display_location)`
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("listing detail query error:", error.message);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
  if (!l || (l.status !== "active" && l.status !== "sold")) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Supabase types embedded relations as arrays; both are to-one here
  const equip = (Array.isArray(l.master_equipment) ? l.master_equipment[0] : l.master_equipment) as {
    manufacturer: string;
    model: string;
    category: string;
  } | null;
  const seller = (Array.isArray(l.seller) ? l.seller[0] : l.seller) as {
    anonymous_username: string | null;
    verification_status: string;
    seller_tier: string;
    industry_verified: boolean;
    display_location: string | null;
  } | null;
  if (!equip || !seller) {
    console.error("listing detail missing relation:", id);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }

  const user = await getUserFromRequest(req);

  const [photosRes, watchersRes, settingsRes, viewerBidRes, viewerWatchRes] = await Promise.all([
    supabase
      .from("listing_photos")
      .select("id, url, photo_type, position")
      .eq("listing_id", id)
      .eq("moderation_status", "approved")
      .order("position", { ascending: true }),
    supabase
      .from("watchlists")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", id),
    supabase
      .from("pricing_engine_settings")
      .select("key, value")
      .in("key", [
        "bid_increment_tiers",
        "auction_opening_bid_minimum",
        "auction_auto_extend_minutes",
        "min_watchers_to_display",
      ]),
    user
      ? supabase
          .from("bids")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", id)
          .eq("bidder_id", user.id)
          .eq("is_current_high", true)
      : Promise.resolve(null),
    user
      ? supabase
          .from("watchlists")
          .select("id", { count: "exact", head: true })
          .eq("listing_id", id)
          .eq("buyer_id", user.id)
      : Promise.resolve(null),
  ]);

  const settings = new Map<string, unknown>(
    (settingsRes.data ?? []).map((row) => [row.key, row.value])
  );
  const openingMinimum = Number(settings.get("auction_opening_bid_minimum") ?? 25);
  const autoExtendMinutes = Number(
    settings.get("auction_auto_extend_minutes") ?? AUCTION_AUTO_EXTEND_MINUTES
  );
  const minWatchers = Number(settings.get("min_watchers_to_display") ?? 10);
  const rawTiers = settings.get("bid_increment_tiers");
  const tiers: BidIncrementTier[] = Array.isArray(rawTiers)
    ? (rawTiers as BidIncrementTier[])
    : DEFAULT_INCREMENT_TIERS;

  // Same rule as place_bid(): first bid must clear the opening minimum;
  // after that, current_bid + bracket increment.
  const currentBid = l.current_bid == null ? null : Number(l.current_bid);
  const increment = currentBid == null ? null : bidIncrement(currentBid, tiers);
  const minimumNextBid = currentBid == null ? openingMinimum : currentBid + (increment ?? 0);

  const reservePrice = l.reserve_price == null ? null : Number(l.reserve_price);
  const hasReserve = reservePrice != null;
  const reserveMet = !hasReserve || (currentBid ?? 0) >= reservePrice;

  const watchers = watchersRes.count ?? 0;

  const detail: ListingDetail = {
    id: l.id,
    title: l.title,
    description: l.description,
    manufacturer: equip.manufacturer,
    model: equip.model,
    category: equip.category,
    condition_grade: l.condition_grade,
    quantity: l.quantity,
    hours_of_use: l.hours_of_use,
    year_of_manufacture: l.year_of_manufacture,
    zip_code: l.zip_code,
    flight_case_included: l.flight_case_included,
    listing_type: l.listing_type,
    status: l.status,
    auction_start: l.auction_start,
    auction_end: l.auction_end,
    current_bid: currentBid,
    bid_count: l.bid_count,
    asking_price: l.asking_price == null ? null : Number(l.asking_price),
    has_reserve: hasReserve,
    reserve_met: reserveMet,
    minimum_next_bid: minimumNextBid,
    bid_increment: increment,
    auto_extend_minutes: autoExtendMinutes,
    watcher_count: watchers >= minWatchers ? watchers : null,
    photos: photosRes.data ?? [],
    seller: {
      anonymous_username: seller.anonymous_username,
      verification_status: seller.verification_status,
      seller_tier: seller.seller_tier,
      industry_verified: seller.industry_verified,
      display_location: seller.display_location,
    },
    viewer: user
      ? {
          is_high_bidder: (viewerBidRes?.count ?? 0) > 0,
          is_watched: (viewerWatchRes?.count ?? 0) > 0,
        }
      : null,
  };

  return NextResponse.json(detail);
}
