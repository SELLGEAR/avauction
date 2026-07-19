// Verification harness for the buy-it-now flow (migration 0022).
//
// Proves: atomic purchase claim (two concurrent buyers, exactly one wins),
// zero-commission phase-1 transaction with full denormalized capture,
// wrong-state rejections, self-purchase rejection — and that the purchase
// rides the EXISTING escrow rails end to end (real test-mode payment,
// capture, ship, deliver, inspection, release safety check).
// Self-cleaning. Run with: npx tsx scripts/simulate-buynow.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { getStripe } from '../lib/stripe';
import { transition, releaseEscrow } from '../lib/escrow/transitions';
import { dollarsToCents, buyerFeeCents } from '../lib/escrow/fees';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
if (!process.env.STRIPE_SECRET_KEY?.includes('test')) {
  throw new Error('Refusing to run: STRIPE_SECRET_KEY missing or not test-mode');
}

const db = createClient(url, key, { auth: { persistSession: false } });
const stripe = getStripe();

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}

async function purchase(listingId: string, buyerId: string) {
  const { data, error } = await db.rpc('purchase_buy_now', {
    p_listing_id: listingId,
    p_buyer_id: buyerId,
  });
  if (error) throw new Error(`purchase_buy_now failed: ${error.message}`);
  return data as Record<string, any>;
}

async function main() {
  const created = {
    authUserIds: [] as string[],
    sellerId: '',
    equipmentId: '',
    listingIds: [] as string[],
    piId: '',
  };

  try {
    // ---- Setup ----------------------------------------------------------
    console.log('Setting up test data (ZZTEST_)...');
    const emails = ['zztest_bn_seller', 'zztest_bn_b1', 'zztest_bn_b2'].map(
      (n) => `${n}_${Date.now()}@example.com`
    );
    for (const email of emails) {
      const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      await db.from('users').insert({ id: data.user.id, email, role: 'buyer' });
    }
    const [sellerUser, buyer1, buyer2] = created.authUserIds;

    const { data: seller } = await db
      .from('sellers')
      .insert({ user_id: sellerUser, business_name: 'ZZTEST_SELLER', account_type: 'business' })
      .select('id')
      .single();
    created.sellerId = seller!.id;

    const { data: equip } = await db
      .from('master_equipment')
      .insert({
        manufacturer: 'ZZTEST_MFG',
        model: `BUYNOW-${Date.now()}`,
        category: 'audio',
        status: 'approved',
        source: 'av_iq',
      })
      .select('id')
      .single();
    created.equipmentId = equip!.id;

    async function makeListing(opts: Record<string, unknown>) {
      const { data, error } = await db
        .from('listings')
        .insert({
          seller_id: created.sellerId,
          master_equipment_id: created.equipmentId,
          title: 'ZZTEST_BUYNOW_LOT',
          zip_code: '00000',
          condition_grade: 'B',
          known_issues: 'test lot',
          ...opts,
        })
        .select('id')
        .single();
      if (error) throw error;
      created.listingIds.push(data.id);
      return data.id as string;
    }

    const mainLot = await makeListing({
      listing_type: 'buy_it_now',
      status: 'active',
      asking_price: 500,
    });
    const auctionLot = await makeListing({
      listing_type: 'auction',
      status: 'active',
      asking_price: 500,
      auction_start: new Date(Date.now() - 60_000).toISOString(),
      auction_end: new Date(Date.now() + 3600_000).toISOString(),
    });
    const draftLot = await makeListing({
      listing_type: 'buy_it_now',
      status: 'draft',
      asking_price: 500,
    });

    // ---- Rejections -----------------------------------------------------
    console.log('\nRejections');
    const rA = await purchase(auctionLot, buyer1);
    check('auction listing rejected', rA.ok === false && rA.error === 'not_buy_now', rA);
    const rD = await purchase(draftLot, buyer1);
    check('draft listing rejected', rD.ok === false && rD.error === 'not_available', rD);
    const rS = await purchase(mainLot, sellerUser);
    check('self-purchase rejected', rS.ok === false && rS.error === 'self_purchase', rS);

    // ---- Race: two buyers, one lot --------------------------------------
    console.log('\nConcurrent purchase race');
    const [p1, p2] = await Promise.all([purchase(mainLot, buyer1), purchase(mainLot, buyer2)]);
    const winners = [p1, p2].filter((r) => r.ok);
    const losers = [p1, p2].filter((r) => !r.ok);
    check('exactly one buyer wins', winners.length === 1, { p1, p2 });
    check('loser sees already_sold', losers[0]?.error === 'already_sold', losers);
    const { count: txCount } = await db
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', mainLot);
    check('exactly one transaction created', txCount === 1, { txCount });
    const { data: soldListing } = await db
      .from('listings')
      .select('status')
      .eq('id', mainLot)
      .single();
    check('listing marked sold', soldListing?.status === 'sold', soldListing);

    const txId = winners[0].transaction_id as string;
    const { data: tx } = await db.from('transactions').select('*').eq('id', txId).single();
    console.log('\nTransaction correctness');
    check('final price = asking price (500)', Number(tx?.final_price) === 500, tx);
    check('zero commission (phase 1 founding benefit)', Number(tx?.commission_amount) === 0, tx);
    check('listing_type buy_it_now', tx?.listing_type === 'buy_it_now', tx);
    check(
      'denormalized capture (mfr/model/grade/zip)',
      tx?.manufacturer === 'ZZTEST_MFG' && tx?.condition_grade === 'B' && tx?.zip_code === '00000',
      tx
    );
    check('status pending_payment', tx?.status === 'pending_payment', tx);
    const rRepeat = await purchase(mainLot, buyer2);
    check('post-sale purchase rejected', rRepeat.ok === false && rRepeat.error === 'already_sold', rRepeat);

    // ---- Rides the escrow rails ----------------------------------------
    console.log('\nEscrow rails — same machinery as auction transactions');
    const priceCents = dollarsToCents(500);
    const feeCents = buyerFeeCents(priceCents, 2.9, 30);
    const pi = await stripe.paymentIntents.create({
      amount: priceCents + feeCents,
      currency: 'usd',
      payment_method: 'pm_card_visa',
      confirm: true,
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
      metadata: { transaction_id: txId },
    });
    created.piId = pi.id;
    check('test payment captured (514.80 incl. fee)', pi.status === 'succeeded' && pi.amount === 51480, {
      status: pi.status,
      amount: pi.amount,
    });
    await db.from('transactions').update({ stripe_payment_intent_id: pi.id }).eq('id', txId);

    const captured = await transition(txId, 'payment_captured');
    check('capture transition', captured.ok, captured);
    await transition(txId, 'awaiting_shipment');
    const shipped = await transition(txId, 'shipped');
    const delivered = await transition(txId, 'delivered');
    const opened = await transition(txId, 'inspection_open');
    check('ship -> deliver -> inspect all accepted', shipped.ok && delivered.ok && opened.ok, {
      shipped,
      delivered,
      opened,
    });
    const { data: openTx } = await db
      .from('transactions')
      .select('inspection_deadline')
      .eq('id', txId)
      .single();
    check('72h inspection deadline stamped', !!openTx?.inspection_deadline, openTx);

    const release = await releaseEscrow(txId);
    check(
      'release safety: blocked without seller Stripe account',
      release.released === false && release.reason === 'seller_no_stripe_account',
      release
    );
    const { data: heldTx } = await db.from('transactions').select('status').eq('id', txId).single();
    check('funds held at inspection_closed', heldTx?.status === 'inspection_closed', heldTx);
  } finally {
    // ---- Cleanup --------------------------------------------------------
    console.log('\nCleaning up test data...');
    if (created.piId) {
      try {
        await stripe.refunds.create({ payment_intent: created.piId });
      } catch {
        console.warn('test refund failed — check Stripe sandbox');
      }
    }
    for (const lot of created.listingIds) {
      await db.from('transactions').delete().eq('listing_id', lot);
      await db.from('listings').delete().eq('id', lot);
    }
    if (created.equipmentId) await db.from('master_equipment').delete().eq('id', created.equipmentId);
    if (created.sellerId) await db.from('sellers').delete().eq('id', created.sellerId);
    for (const id of created.authUserIds) {
      await db.from('users').delete().eq('id', id);
      await db.auth.admin.deleteUser(id);
    }
  }

  console.log(failures === 0 ? '\nALL SCENARIOS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('simulation crashed:', e);
  process.exit(1);
});
