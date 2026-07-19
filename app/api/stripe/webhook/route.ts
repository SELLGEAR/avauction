import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { transition } from "@/lib/escrow/transitions";
import { sendPaymentReceived } from "@/lib/notifications/escrow";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

// POST /api/stripe/webhook — signature-verified event handler. Webhooks are
// the source of truth for payment status; the checkout success redirect is
// cosmetic only.
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (e) {
    console.error("webhook signature verification failed:", e);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== "paid") break;
      const txId = session.metadata?.transaction_id;
      if (!txId) break;

      const supabase = createServiceRoleClient();

      // Idempotent: a replayed event finds the transaction already past
      // pending_payment and the transition is rejected harmlessly
      const captured = await transition(txId, "payment_captured");
      if (!captured.ok) {
        console.log(`webhook: capture transition skipped for ${txId}: ${captured.error}`);
        break;
      }

      await supabase
        .from("transactions")
        .update({
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        })
        .eq("id", txId);

      // Escrow is funded — move straight to awaiting shipment and tell the
      // seller to ship within 48 hours
      await transition(txId, "awaiting_shipment");

      const { data: tx } = await supabase
        .from("transactions")
        .select("seller_id, manufacturer, model, final_price")
        .eq("id", txId)
        .single();
      if (tx) {
        void sendPaymentReceived({
          sellerId: tx.seller_id,
          transactionId: txId,
          listingTitle: `${tx.manufacturer} ${tx.model}`,
          finalPrice: Number(tx.final_price),
        }).catch((e) => console.error("payment-received email failed:", e));
      }
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      // Transaction stays at pending_payment — buyer can retry checkout
      console.warn(
        `async payment failed for tx ${session.metadata?.transaction_id ?? "unknown"}`
      );
      break;
    }

    case "charge.refunded":
      // Refunds are initiated by our own dispute-resolution code, which
      // already records state — this event is reconciliation logging only
      console.log(`charge.refunded received: ${(event.data.object as Stripe.Charge).id}`);
      break;

    default:
      break;
  }

  return NextResponse.json({ received: true });
}
