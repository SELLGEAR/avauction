import { NextResponse } from "next/server";
import { requireSeller, sellerErrorStatus } from "@/lib/sellerAuth";
import { getSellerListingDetail } from "@/lib/seller/listings";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/seller/listings/[id] — everything the seller submitted, with
// photos exactly as buyers see them (blur + watermark, signed). 404 for a
// listing that isn't theirs, indistinguishable from one that doesn't exist.
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const who = await requireSeller(req);
  if ("error" in who) return NextResponse.json({ error: who.error }, { status: sellerErrorStatus(who.error) });
  const { id } = await params;
  if (!UUID_RE.test(id)) return NextResponse.json({ error: "not_found" }, { status: 404 });
  try {
    const detail = await getSellerListingDetail(who.sellerId, id);
    if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(detail);
  } catch (e) {
    console.error("seller listing detail failed:", e);
    return NextResponse.json({ error: "query_failed" }, { status: 500 });
  }
}
