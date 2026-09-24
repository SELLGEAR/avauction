import { NextResponse } from "next/server";
import { requireSeller, sellerErrorStatus } from "@/lib/sellerAuth";
import { rateLimit } from "@/lib/rateLimit";
import { withdrawListing } from "@/lib/seller/listings";

// POST /api/seller/listings/[id]/withdraw — { delist_reason } from the
// delist prompt ("Was this sold through AVauction.com?"). Allowed for
// in-review, returned, live buy-it-now and live auctions with no bids;
// refused with 422 not_withdrawable + block otherwise.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const who = await requireSeller(req);
  if ("error" in who) return NextResponse.json({ error: who.error }, { status: sellerErrorStatus(who.error) });
  if (!rateLimit(`withdraw:${who.user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const { id } = await params;
  let body: { delist_reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const result = await withdrawListing(who.sellerId, id, body.delist_reason);
    if (result.ok) return NextResponse.json(result);
    const status = result.error === "listing_not_found" ? 404 : result.error === "invalid_reason" ? 400 : 422;
    return NextResponse.json(result, { status });
  } catch (e) {
    console.error("withdraw failed:", e);
    return NextResponse.json({ error: "withdraw_failed" }, { status: 500 });
  }
}
