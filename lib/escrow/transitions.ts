// Escrow orchestration: requests state transitions from the database (which
// enforces the state machine) and performs the money side effects. The
// order is always transition-first — an illegal transition can never move
// money because the Stripe call only happens after the DB accepts the edge.
//
// Relative imports (not "@/") so the simulation scripts can import this
// outside the Next.js build.

import { createServiceRoleClient } from "../supabase/server";
import { getStripe } from "../stripe";
import { sellerPayoutCents } from "./fees";

export interface TransitionResult {
  ok: boolean;
  error?: string;
  from?: string;
  to?: string;
}

export async function transition(
  transactionId: string,
  to: string
): Promise<TransitionResult> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("transition_transaction", {
    p_transaction_id: transactionId,
    p_to: to,
  });
  if (error) return { ok: false, error: error.message };
  return data as TransitionResult;
}

// Go-live readiness per Connect v2 guidance: check the recipient
// capability status path, never the deprecated payouts_enabled field.
export async function sellerTransfersActive(stripeAccountId: string): Promise<boolean> {
  const stripe = getStripe();
  const account = (await stripe.v2.core.accounts.retrieve(stripeAccountId, {
    include: ["configuration.recipient"],
  })) as unknown as {
    configuration?: {
      recipient?: {
        capabilities?: {
          stripe_balance?: { stripe_transfers?: { status?: string } };
        };
      };
    };
  };
  return (
    account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers
      ?.status === "active"
  );
}

export type ReleaseOutcome =
  | { released: true; transferId: string }
  | { released: false; reason: string };

// Close inspection (if still open) and release escrow: transfer
// final_price - commission to the seller's connected account. Called from
// the buyer's early-approve action and from the 72-hour expiry sweep.
export async function releaseEscrow(transactionId: string): Promise<ReleaseOutcome> {
  const supabase = createServiceRoleClient();

  const { data: tx, error } = await supabase
    .from("transactions")
    .select("id, status, final_price, commission_amount, seller_id, stripe_payment_intent_id")
    .eq("id", transactionId)
    .single();
  if (error || !tx) return { released: false, reason: "transaction_not_found" };

  // inspection_open -> inspection_closed (no-op if a sweep already closed it)
  if (tx.status === "inspection_open") {
    const closed = await transition(transactionId, "inspection_closed");
    if (!closed.ok) return { released: false, reason: closed.error ?? "close_failed" };
  } else if (tx.status !== "inspection_closed" && tx.status !== "dispute_resolved") {
    return { released: false, reason: `not_releasable_from_${tx.status}` };
  }

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, stripe_account_id")
    .eq("id", tx.seller_id)
    .single();
  if (!seller?.stripe_account_id) {
    return { released: false, reason: "seller_no_stripe_account" };
  }

  // Re-check capability at release time — the cached flag is advisory only.
  // If the seller isn't transfer-ready, funds stay held at
  // inspection_closed and the sweep retries next tick.
  const active = await sellerTransfersActive(seller.stripe_account_id);
  if (!active) {
    return { released: false, reason: "seller_transfers_not_active" };
  }

  const payoutCents = sellerPayoutCents(
    Number(tx.final_price),
    Number(tx.commission_amount)
  );
  if (payoutCents <= 0) return { released: false, reason: "non_positive_payout" };

  const stripe = getStripe();
  const transfer = await stripe.transfers.create({
    amount: payoutCents,
    currency: "usd",
    destination: seller.stripe_account_id,
    transfer_group: transactionId,
    metadata: { transaction_id: transactionId },
  });

  const released = await transition(transactionId, "released");
  if (!released.ok) {
    // Transfer succeeded but the DB transition failed — surface loudly for
    // admin reconciliation rather than retrying (a retry would double-pay)
    console.error(
      `ESCROW RECONCILIATION NEEDED: transfer ${transfer.id} created for tx ${transactionId} but transition failed: ${released.error}`
    );
    return { released: false, reason: "released_transition_failed_after_transfer" };
  }

  await supabase
    .from("transactions")
    .update({ stripe_transfer_id: transfer.id })
    .eq("id", transactionId);
  await supabase
    .from("sellers")
    .update({ stripe_transfers_active: true })
    .eq("id", seller.id);

  return { released: true, transferId: transfer.id };
}

// Buyer-favor dispute resolution: full refund including the processing fee
// (default policy — flagged for attorney review).
export async function refundTransaction(transactionId: string): Promise<TransitionResult> {
  const supabase = createServiceRoleClient();
  const { data: tx } = await supabase
    .from("transactions")
    .select("id, status, stripe_payment_intent_id")
    .eq("id", transactionId)
    .single();
  if (!tx) return { ok: false, error: "transaction_not_found" };
  if (tx.status !== "dispute_resolved" && tx.status !== "payment_captured") {
    return { ok: false, error: `not_refundable_from_${tx.status}` };
  }
  if (!tx.stripe_payment_intent_id) return { ok: false, error: "no_payment_intent" };

  const result = await transition(transactionId, "refunded");
  if (!result.ok) return result;

  const stripe = getStripe();
  const refund = await stripe.refunds.create({
    payment_intent: tx.stripe_payment_intent_id,
  });
  await supabase
    .from("transactions")
    .update({ stripe_refund_id: refund.id })
    .eq("id", transactionId);
  return { ok: true, from: tx.status, to: "refunded" };
}
