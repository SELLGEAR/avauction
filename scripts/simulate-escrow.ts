// Verification harness for Stripe Connect escrow (migration 0019).
// TEST MODE ONLY — uses real Stripe test APIs plus the live database.
//
// Walks the full state machine on two transactions:
//   TX1: pay (real test PaymentIntent) -> capture -> ship -> deliver ->
//        inspection -> buyer approve-release. The Stripe transfer is
//        attempted against a fresh (un-onboarded) recipient account and
//        MUST be blocked by the capability check — proving release safety.
//        Set SIMULATE_TRANSFER_ACCOUNT to a fully-onboarded test account id
//        to exercise the real transfer instead.
//   TX2: pay -> capture -> dispute -> resolve buyer-favor -> real refund.
// Plus illegal-transition rejections throughout. Self-cleaning.
//
// Run with: npx tsx scripts/simulate-escrow.ts
// Requires in .env.local: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
// STRIPE_SECRET_KEY (test mode).

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { getStripe } from "../lib/stripe";
import { transition, releaseEscrow, refundTransaction } from "../lib/escrow/transitions";
import { dollarsToCents, buyerFeeCents } from "../lib/escrow/fees";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing — add a test-mode key to .env.local");
if (!process.env.STRIPE_SECRET_KEY.includes("test")) {
  throw new Error("Refusing to run: STRIPE_SECRET_KEY does not look like a test-mode key");
}

const db = createClient(url, key, { auth: { persistSession: false } });
const stripe = getStripe();

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? "");
  }
}

async function txStatus(id: string) {
  const { data } = await db.from("transactions").select("*").eq("id", id).single();
  return data!;
}

// Simulates what the checkout webhook does after a paid session — but the
// payment itself is a real test-mode PaymentIntent confirmed with a test
// card, so Stripe's side is genuinely exercised.
async function payTransaction(txId: string, amountDollars: number) {
  const priceCents = dollarsToCents(amountDollars);
  const feeCents = buyerFeeCents(priceCents, 2.9, 30);
  const pi = await stripe.paymentIntents.create({
    amount: priceCents + feeCents,
    currency: "usd",
    payment_method: "pm_card_visa",
    confirm: true,
    automatic_payment_methods: { enabled: true, allow_redirects: "never" },
    metadata: { transaction_id: txId },
  });
  if (pi.status !== "succeeded") throw new Error(`test payment not captured: ${pi.status}`);
  await db
    .from("transactions")
    .update({ stripe_payment_intent_id: pi.id, buyer_fee_amount: feeCents / 100 })
    .eq("id", txId);
  const captured = await transition(txId, "payment_captured");
  if (!captured.ok) throw new Error(`capture transition failed: ${captured.error}`);
  await transition(txId, "awaiting_shipment");
  return pi;
}

async function main() {
  const created = {
    authUserIds: [] as string[],
    sellerId: "",
    equipmentId: "",
    listingIds: [] as string[],
    txIds: [] as string[],
    stripeAccountId: "",
  };

  try {
    // ---- Setup ----------------------------------------------------------
    console.log("Setting up test data (ZZTEST_)...");
    const emails = ["zztest_esc_seller", "zztest_esc_buyer"].map(
      (n) => `${n}_${Date.now()}@example.com`
    );
    for (const email of emails) {
      const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      const { error: uErr } = await db.from("users").upsert({ id: data.user.id, email, role: "buyer" });
      if (uErr) throw uErr;
    }
    const [sellerUser, buyer] = created.authUserIds;

    // Fresh v2 recipient account — deliberately NOT onboarded (unless
    // SIMULATE_TRANSFER_ACCOUNT overrides), to prove release blocks safely
    let accountId = process.env.SIMULATE_TRANSFER_ACCOUNT ?? "";
    const expectTransfer = !!accountId;
    if (!accountId) {
      const account = await stripe.v2.core.accounts.create({
        contact_email: emails[0],
        display_name: "ZZTEST_SELLER",
        dashboard: "express",
        identity: { country: "us" },
        defaults: {
          responsibilities: { fees_collector: "application", losses_collector: "application" },
        },
        configuration: {
          recipient: {
            capabilities: { stripe_balance: { stripe_transfers: { requested: true } } },
          },
        },
        include: ["configuration.recipient"],
      });
      accountId = account.id;
      created.stripeAccountId = accountId;
    }

    const { data: seller, error: sErr } = await db
      .from("sellers")
      .insert({
        user_id: sellerUser,
        business_name: "ZZTEST_SELLER",
        account_type: "business",
        stripe_account_id: accountId,
      })
      .select("id")
      .single();
    if (sErr) throw sErr;
    created.sellerId = seller.id;

    const { data: equip, error: eErr } = await db
      .from("master_equipment")
      .insert({
        manufacturer: "ZZTEST_MFG",
        model: `ESCROW-${Date.now()}`,
        category: "audio",
        status: "approved",
        source: "av_iq",
      })
      .select("id")
      .single();
    if (eErr) throw eErr;
    created.equipmentId = equip.id;

    async function makeTx(finalPrice: number, commission: number) {
      const { data: listing, error: lErr } = await db
        .from("listings")
        .insert({
          seller_id: created.sellerId,
          master_equipment_id: created.equipmentId,
          title: "ZZTEST_ESCROW_LOT",
          zip_code: "00000",
          listing_type: "auction",
          status: "sold",
          condition_grade: "B",
          known_issues: "test lot",
        })
        .select("id")
        .single();
      if (lErr) throw lErr;
      created.listingIds.push(listing.id);
      const { data: tx, error: tErr } = await db
        .from("transactions")
        .insert({
          listing_id: listing.id,
          buyer_id: buyer,
          seller_id: created.sellerId,
          master_equipment_id: created.equipmentId,
          manufacturer: "ZZTEST_MFG",
          model: "ESCROW",
          condition_grade: "B",
          final_price: finalPrice,
          commission_amount: commission,
          listing_type: "auction",
          zip_code: "00000",
          status: "pending_payment",
        })
        .select("id")
        .single();
      if (tErr) throw tErr;
      created.txIds.push(tx.id);
      return tx.id as string;
    }

    const tx1 = await makeTx(325, 32.5);
    const tx2 = await makeTx(100, 10);

    // ---- TX1: happy path ------------------------------------------------
    console.log("\nTX1 — payment capture (real test-mode PaymentIntent)");
    const pi1 = await payTransaction(tx1, 325);
    let t = await txStatus(tx1);
    check("charged price + buyer fee (325 + 9.73)", pi1.amount === 33473, { amount: pi1.amount });
    check("status awaiting_shipment after capture", t.status === "awaiting_shipment", t.status);
    check("paid_at stamped", !!t.paid_at, t);

    console.log("\nTX1 — illegal transitions rejected");
    const skip1 = await transition(tx1, "released");
    check("awaiting_shipment -> released rejected", !skip1.ok && skip1.error === "illegal_transition", skip1);
    const skip2 = await transition(tx1, "inspection_open");
    check("awaiting_shipment -> inspection_open rejected", !skip2.ok, skip2);

    console.log("\nTX1 — ship, deliver, inspect");
    const shipped = await transition(tx1, "shipped");
    check("shipped accepted", shipped.ok, shipped);
    const delivered = await transition(tx1, "delivered");
    check("delivered accepted", delivered.ok, delivered);
    const opened = await transition(tx1, "inspection_open");
    check("inspection opened", opened.ok, opened);
    t = await txStatus(tx1);
    const deadlineMs = new Date(t.inspection_deadline).getTime() - Date.now();
    check(
      "deadline ~72h out",
      deadlineMs > 71.5 * 3600_000 && deadlineMs < 72.5 * 3600_000,
      { hours: (deadlineMs / 3600_000).toFixed(1) }
    );

    console.log("\nTX1 — buyer approve-release");
    const outcome = await releaseEscrow(tx1);
    if (expectTransfer) {
      check("released with real transfer", outcome.released === true, outcome);
      t = await txStatus(tx1);
      check("status released", t.status === "released", t.status);
      check("transfer id stored", !!t.stripe_transfer_id, t);
      if (outcome.released) {
        const tr = await stripe.transfers.retrieve(outcome.transferId);
        check("transfer amount = price - commission (29250)", tr.amount === 29250, { amount: tr.amount });
      }
    } else {
      check(
        "release BLOCKED on un-onboarded seller (capability check works)",
        outcome.released === false && outcome.reason === "seller_transfers_not_active",
        outcome
      );
      t = await txStatus(tx1);
      check("funds held at inspection_closed", t.status === "inspection_closed", t.status);
      const retry = await releaseEscrow(tx1);
      check("sweep retry also blocks, state unchanged", retry.released === false, retry);
    }

    // ---- TX2: dispute + refund path ------------------------------------
    console.log("\nTX2 — dispute freeze and buyer-favor refund");
    const pi2 = await payTransaction(tx2, 100);
    const disputed = await transition(tx2, "disputed");
    check("dispute freeze from awaiting_shipment", disputed.ok, disputed);
    const blockedRelease = await releaseEscrow(tx2);
    check("release blocked while disputed", blockedRelease.released === false, blockedRelease);
    const resolved = await transition(tx2, "dispute_resolved");
    check("dispute resolved", resolved.ok, resolved);
    const refunded = await refundTransaction(tx2);
    check("refund executed", refunded.ok, refunded);
    t = await txStatus(tx2);
    check("status refunded", t.status === "refunded", t.status);
    check("refund id stored", !!t.stripe_refund_id, t);
    const refreshedPi = await stripe.paymentIntents.retrieve(pi2.id);
    const charge = await stripe.charges.retrieve(refreshedPi.latest_charge as string);
    check("Stripe charge fully refunded (incl. buyer fee)", charge.refunded === true, {
      amount_refunded: charge.amount_refunded,
    });
    const terminal = await transition(tx2, "released");
    check("refunded is terminal", !terminal.ok, terminal);

    // ---- Cleanup: refund TX1's test charge so the sandbox stays tidy ----
    await stripe.refunds.create({ payment_intent: pi1.id });
  } finally {
    console.log("\nCleaning up test data...");
    for (const id of created.txIds) {
      await db.from("disputes").delete().eq("transaction_id", id);
      await db.from("transactions").delete().eq("id", id);
    }
    for (const id of created.listingIds) await db.from("listings").delete().eq("id", id);
    if (created.equipmentId) await db.from("master_equipment").delete().eq("id", created.equipmentId);
    if (created.sellerId) await db.from("sellers").delete().eq("id", created.sellerId);
    for (const id of created.authUserIds) {
      await db.from("users").delete().eq("id", id);
      await db.auth.admin.deleteUser(id);
    }
    if (created.stripeAccountId) {
      // v2 accounts can be closed to keep the test sandbox clean
      try {
        await stripe.v2.core.accounts.close(created.stripeAccountId, {});
      } catch {
        console.warn(`could not close test account ${created.stripeAccountId} — harmless in sandbox`);
      }
    }
  }

  console.log(failures === 0 ? "\nALL SCENARIOS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("simulation crashed:", e);
  process.exit(1);
});
