import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { reviewListing } from "@/lib/admin/listings";

// POST /api/admin/listings/[id] — { action: 'approve'|'reject', reason?,
// auction_start?, auction_end? }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  }

  const result = await reviewListing(admin.id, id, body.action, {
    reason: typeof body.reason === "string" ? body.reason : undefined,
    auctionStart: typeof body.auction_start === "string" ? body.auction_start : undefined,
    auctionEnd: typeof body.auction_end === "string" ? body.auction_end : undefined,
  });
  return NextResponse.json(result, { status: result.ok ? 200 : 422 });
}
