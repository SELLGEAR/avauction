import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { transition, releaseEscrow } from "@/lib/escrow/transitions";
import { sendEscrowReleased } from "@/lib/notifications/escrow";

// POST /api/transactions/[id] — { action, tracking_number?, reason? }
//
// Role-checked manual transitions:
//   mark_shipped     seller  — requires tracking number (pre-ship photos
//                              enforced at the app layer when photos exist)
//   mark_delivered   admin   — manual until carrier webhooks are built;
//                              immediately opens the 72h inspection window
//   approve_release  buyer   — "everything checks out": closes inspection
//                              immediately and releases funds to the seller
//   open_dispute     buyer   — freezes the payout, logs a disputes row
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: txId } = await params;
  let body: { action?: unknown; tracking_number?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: tx } = await supabase
    .from("transactions")
    .select("id, status, buyer_id, seller_id, manufacturer, model, final_price, commission_amount, sellers!inner(user_id)")
    .eq("id", txId)
    .single();
  if (!tx) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const { data: me } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const isAdmin = me?.role === "admin";
  const isBuyer = tx.buyer_id === user.id;
  const isSeller = (tx.sellers as unknown as { user_id: string }).user_id === user.id;

  switch (body.action) {
    case "mark_shipped": {
      if (!isSeller && !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      if (typeof body.tracking_number !== "string" || body.tracking_number.trim() === "") {
        return NextResponse.json({ error: "tracking_number_required" }, { status: 400 });
      }
      const r = await transition(txId, "shipped");
      if (!r.ok) return NextResponse.json(r, { status: 422 });
      await supabase
        .from("transactions")
        .update({ tracking_number: body.tracking_number.trim() })
        .eq("id", txId);
      return NextResponse.json(r);
    }

    case "mark_delivered": {
      if (!isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const delivered = await transition(txId, "delivered");
      if (!delivered.ok) return NextResponse.json(delivered, { status: 422 });
      // Inspection opens the moment delivery is confirmed; the DB stamps
      // the deadline from inspection_window_hours
      const opened = await transition(txId, "inspection_open");
      return NextResponse.json(opened.ok ? opened : delivered);
    }

    case "approve_release": {
      if (!isBuyer) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const outcome = await releaseEscrow(txId);
      if (!outcome.released) {
        return NextResponse.json({ error: outcome.reason }, { status: 422 });
      }
      void sendEscrowReleased({
        sellerId: tx.seller_id,
        transactionId: txId,
        listingTitle: `${tx.manufacturer} ${tx.model}`,
        payoutAmount: Number(tx.final_price) - Number(tx.commission_amount),
      }).catch((e) => console.error("escrow-released email failed:", e));
      return NextResponse.json({ ok: true, transfer_id: outcome.transferId });
    }

    case "open_dispute": {
      if (!isBuyer && !isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });
      const reason = typeof body.reason === "string" ? body.reason.trim() : "";
      if (!reason) return NextResponse.json({ error: "reason_required" }, { status: 400 });
      const r = await transition(txId, "disputed");
      if (!r.ok) return NextResponse.json(r, { status: 422 });
      await supabase.from("disputes").insert({
        transaction_id: txId,
        filed_by: user.id,
        reason,
      });
      return NextResponse.json(r);
    }

    default:
      return NextResponse.json({ error: "unknown_action" }, { status: 400 });
  }
}
