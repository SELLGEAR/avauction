import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { dollarsToCents, buyerFeeCents } from "@/lib/escrow/fees";

// POST /api/checkout — { transactionId }. Buyer pays for a pending_payment
// transaction via a hosted Checkout Session on the platform account
// (separate charges and transfers: capture now = escrow; the seller
// transfer happens at release, not here — so no transfer_data and no
// application_fee_amount).
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { transactionId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body.transactionId !== "string") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data: tx } = await supabase
    .from("transactions")
    .select("id, buyer_id, status, final_price, manufacturer, model")
    .eq("id", body.transactionId)
    .single();

  if (!tx || tx.buyer_id !== user.id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (tx.status !== "pending_payment") {
    return NextResponse.json({ error: `not_payable_from_${tx.status}` }, { status: 422 });
  }

  const { data: settings } = await supabase
    .from("pricing_engine_settings")
    .select("key, value")
    .in("key", ["buyer_processing_fee_pct", "buyer_processing_fee_fixed_cents"]);
  const feePct = Number(settings?.find((s) => s.key === "buyer_processing_fee_pct")?.value ?? 2.9);
  const feeFixed = Number(
    settings?.find((s) => s.key === "buyer_processing_fee_fixed_cents")?.value ?? 30
  );

  const priceCents = dollarsToCents(Number(tx.final_price));
  const feeCents = buyerFeeCents(priceCents, feePct, feeFixed);

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: priceCents,
          product_data: { name: `${tx.manufacturer} ${tx.model}` },
        },
      },
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: feeCents,
          product_data: { name: "Payment processing" },
        },
      },
    ],
    metadata: { transaction_id: tx.id },
    payment_intent_data: { metadata: { transaction_id: tx.id } },
    success_url: `${site}/purchases/${tx.id}?paid=1`,
    cancel_url: `${site}/purchases/${tx.id}`,
    integration_identifier: "avauction_escrow_qkzmwrtb",
  });

  await supabase
    .from("transactions")
    .update({
      stripe_checkout_session_id: session.id,
      buyer_fee_amount: feeCents / 100,
    })
    .eq("id", tx.id);

  return NextResponse.json({ url: session.url });
}
