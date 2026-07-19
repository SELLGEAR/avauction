import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  sendAuctionWon,
  sendReserveNotMet,
  sendAuctionExpired,
} from "@/lib/notifications/auctionClose";

export const dynamic = "force-dynamic";

interface CloseResult {
  listing_id: string;
  outcome: string;
  title?: string;
  transaction_id?: string;
  winner_id?: string;
  seller_id?: string;
  final_price?: number;
  asking_price?: number;
}

// GET /api/cron/close-auctions — Vercel cron sweep (see vercel.json).
// Closes every due auction lot atomically, then fires the outcome email
// for each. Auto-extend safety: the DB function re-checks auction_end
// under the same row lock place_bid() uses, so a lot extended by a
// last-second bid is skipped and picked up by a later tick.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("close_due_auction_lots", {
    p_limit: 50,
  });

  if (error) {
    console.error("close_due_auction_lots failed:", error.message);
    return NextResponse.json({ error: "sweep_failed" }, { status: 500 });
  }

  const sweep = data as { processed: number; results: CloseResult[] };

  // Notifications are fire-and-forget per lot: one failed email must not
  // block the others or fail the sweep (the close itself already committed)
  for (const r of sweep.results ?? []) {
    const title = r.title ?? "your lot";
    if (r.outcome === "sold" && r.winner_id && r.final_price != null) {
      void sendAuctionWon({
        winnerUserId: r.winner_id,
        listingId: r.listing_id,
        listingTitle: title,
        finalPrice: r.final_price,
      }).catch((e) => console.error("auction-won email failed:", e));
    } else if (r.outcome === "reserve_not_met" && r.seller_id && r.asking_price != null) {
      void sendReserveNotMet({
        sellerId: r.seller_id,
        listingId: r.listing_id,
        listingTitle: title,
        askingPrice: r.asking_price,
      }).catch((e) => console.error("reserve-not-met email failed:", e));
    } else if (r.outcome === "expired" && r.seller_id) {
      void sendAuctionExpired({
        sellerId: r.seller_id,
        listingId: r.listing_id,
        listingTitle: title,
      }).catch((e) => console.error("auction-expired email failed:", e));
    }
  }

  return NextResponse.json({
    processed: sweep.processed,
    outcomes: (sweep.results ?? []).map((r) => ({ listing_id: r.listing_id, outcome: r.outcome })),
  });
}
