import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

// POST /api/listings/[id]/purchase — buy-it-now instant purchase.
// Atomically claims the listing and returns the transaction id; the client
// then calls POST /api/checkout with it to pay into escrow. Everything
// after payment rides the existing escrow machinery unchanged.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`purchase:${user.id}`, 10, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { id: listingId } = await params;
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("purchase_buy_now", {
    p_listing_id: listingId,
    p_buyer_id: user.id,
  });

  if (error) {
    console.error("purchase_buy_now rpc error:", error.message);
    return NextResponse.json({ error: "purchase_failed" }, { status: 500 });
  }

  const result = data as { ok: boolean; error?: string; transaction_id?: string };
  if (!result.ok) {
    const status = result.error === "already_sold" ? 409 : 422;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
