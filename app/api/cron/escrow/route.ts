import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { releaseEscrow } from "@/lib/escrow/transitions";
import { sendEscrowReleased } from "@/lib/notifications/escrow";

export const dynamic = "force-dynamic";

// GET /api/cron/escrow — every-15-minutes sweep (see vercel.json).
// Releases escrow on transactions whose 72-hour inspection window expired
// without buyer action, and retries inspection_closed transactions whose
// earlier release was blocked (e.g. seller onboarding incomplete).
// Disputed transactions never match either query — the freeze is the
// state machine itself.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data: due, error } = await supabase
    .from("transactions")
    .select("id, seller_id, manufacturer, model, final_price, commission_amount, status")
    .or(
      `and(status.eq.inspection_open,inspection_deadline.lte.${new Date().toISOString()}),status.eq.inspection_closed`
    )
    .limit(50);

  if (error) {
    console.error("escrow sweep query failed:", error.message);
    return NextResponse.json({ error: "sweep_failed" }, { status: 500 });
  }

  const results: { id: string; released: boolean; reason?: string }[] = [];
  for (const tx of due ?? []) {
    const outcome = await releaseEscrow(tx.id);
    results.push(
      outcome.released
        ? { id: tx.id, released: true }
        : { id: tx.id, released: false, reason: outcome.reason }
    );
    if (outcome.released) {
      void sendEscrowReleased({
        sellerId: tx.seller_id,
        transactionId: tx.id,
        listingTitle: `${tx.manufacturer} ${tx.model}`,
        payoutAmount: Number(tx.final_price) - Number(tx.commission_amount),
      }).catch((e) => console.error("escrow-released email failed:", e));
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
