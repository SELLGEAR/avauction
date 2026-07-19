import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendOutbidNotification } from "@/lib/notifications/outbid";
import type { PlaceBidResult } from "@/lib/auction/types";

// POST /api/bids — { listingId: string, maxBid: number }
//
// The only path to the bids table. Authenticates the buyer, rate limits,
// then calls the atomic place_bid() function which handles proxy
// resolution and auto-extend inside one transaction.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // Friday close is bursty by design — allow rapid rebids but stop scripts
  if (!rateLimit(`bids:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { listingId?: unknown; maxBid?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { listingId, maxBid } = body;
  if (typeof listingId !== "string" || typeof maxBid !== "number" || !Number.isFinite(maxBid) || maxBid <= 0) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  // Whole dollars only — avoids float/numeric edge cases in the ladder
  if (!Number.isInteger(maxBid)) {
    return NextResponse.json({ error: "whole_dollars_only" }, { status: 400 });
  }

  const encryptionKey = process.env.BID_ENCRYPTION_KEY;
  if (!encryptionKey) {
    console.error("BID_ENCRYPTION_KEY is not set");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("place_bid", {
    p_listing_id: listingId,
    p_bidder_id: user.id,
    p_max_bid: maxBid,
    p_key: encryptionKey,
  });

  if (error) {
    console.error("place_bid rpc error:", error.message);
    return NextResponse.json({ error: "bid_failed" }, { status: 500 });
  }

  const result = data as PlaceBidResult;

  if (result.accepted && result.outbid_user_id && result.outbid_user_id !== user.id) {
    // Fire-and-forget: the bid response must not wait on email delivery
    const { data: listing } = await supabase
      .from("listings")
      .select("title")
      .eq("id", listingId)
      .single();
    void sendOutbidNotification({
      outbidUserId: result.outbid_user_id,
      listingId,
      listingTitle: listing?.title ?? "your watched lot",
      newBid: result.current_bid ?? maxBid,
    }).catch((e) => console.error("outbid notification failed:", e));
  }

  const status = result.accepted ? 200 : 422;
  // Never echo outbid_user_id to the client — bidder identities stay private
  const { outbid_user_id: _omit, ...publicResult } = result;
  return NextResponse.json(publicResult, { status });
}
