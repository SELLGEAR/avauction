import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getListingPhotosForReview } from "@/lib/admin/listings";

export const dynamic = "force-dynamic";

// GET /api/admin/listings/[id]/photos — the review view of a listing's
// photos: for each, the CLEAN original (signed URL, admin only) beside the
// buyer version (blurred + watermarked), plus the blur regions, what
// detection suggested, and moderation status. This is the only place a
// clean original URL is ever produced for a human.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const { id } = await params;
  try {
    const result = await getListingPhotosForReview(id);
    if (!result) return NextResponse.json({ error: "listing_not_found" }, { status: 404 });
    return NextResponse.json(result);
  } catch (e) {
    console.error("admin listing photos failed:", e);
    return NextResponse.json({ error: "photos_failed" }, { status: 500 });
  }
}
