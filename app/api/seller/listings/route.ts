import { NextResponse } from "next/server";
import { requireSeller, sellerErrorStatus } from "@/lib/sellerAuth";
import { getSellerListings } from "@/lib/seller/listings";

export const dynamic = "force-dynamic";

// GET /api/seller/listings — the signed-in seller's own listings with
// cover photo (signed buyer URL), photo count, threshold-gated watcher
// count and the withdraw rule pre-computed. Never another seller's rows,
// never bidder identities.
export async function GET(req: Request) {
  const who = await requireSeller(req);
  if ("error" in who) return NextResponse.json({ error: who.error }, { status: sellerErrorStatus(who.error) });
  try {
    return NextResponse.json({ listings: await getSellerListings(who.sellerId) });
  } catch (e) {
    console.error("seller listings failed:", e);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
}
