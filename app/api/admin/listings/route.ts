import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminAuth";
import { getListingQueue } from "@/lib/admin/listings";

export const dynamic = "force-dynamic";

// GET /api/admin/listings?status=pending_review&page=1&per_page=25
export async function GET(req: Request) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const url = new URL(req.url);
  try {
    const queue = await getListingQueue({
      status: url.searchParams.get("status") ?? undefined,
      page: url.searchParams.get("page") ? Number(url.searchParams.get("page")) : undefined,
      perPage: url.searchParams.get("per_page") ? Number(url.searchParams.get("per_page")) : undefined,
    });
    return NextResponse.json(queue);
  } catch (e) {
    console.error("admin listing queue failed:", e);
    return NextResponse.json({ error: "queue_failed" }, { status: 500 });
  }
}
