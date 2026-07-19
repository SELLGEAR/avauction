// Verification harness for the pricing engine (migration 0021).
//
// Seeds fictional models with hand-computed distributions so every
// assertion is deterministic:
//   M1: weighted median + IQR range + outlier exclusion + medium confidence
//   M2: time decay — stale prices lose influence to fresh ones
//   M3: grade normalization (request A and C against grade-B data)
//   M6: high confidence at 30 fresh records
//   M7/M8: bootstrap from same-manufacturer/category, capped at low
//   M5: thin model, no siblings — confidence none, no bootstrap flag
//   M9: own-transaction union path (transactions + market_prices together)
// Self-cleaning. Run with: npx tsx scripts/simulate-pricing.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getSupabaseClient } from './lib/supabaseClient.js';

const db = getSupabaseClient();
const MFR = 'ZZTest PriceCo';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}

function approx(a: number | undefined, b: number, tol = 0.01) {
  return a !== undefined && Math.abs(Number(a) - b) <= tol;
}

async function suggest(id: string, grade = 'B') {
  const { data, error } = await db.rpc('suggest_price', {
    p_master_equipment_id: id,
    p_condition_grade: grade,
  });
  if (error) throw new Error(`suggest_price failed: ${error.message}`);
  return data as Record<string, any>;
}

async function main() {
  const created = {
    masterIds: [] as string[],
    authUserIds: [] as string[],
    sellerId: '',
    listingId: '',
    txId: '',
  };

  // Each scenario gets its OWN manufacturer unless it deliberately shares
  // one (the bootstrap pair) — otherwise bootstrap's same-manufacturer
  // sibling search would leak one scenario's data into another's estimate.
  async function makeModel(model: string, category = 'audio', mfr = `${MFR} ${model}`) {
    const { data, error } = await db
      .from('master_equipment')
      .insert({ manufacturer: mfr, model, category, status: 'approved', source: 'av_iq' })
      .select('id')
      .single();
    if (error) throw error;
    created.masterIds.push(data.id);
    return data.id as string;
  }

  // Insert market_prices rows: [price, weight, daysAgo, grade]
  async function seedPrices(
    masterId: string,
    model: string,
    rows: [number, number, number, string][]
  ) {
    const { error } = await db.from('market_prices').insert(
      rows.map(([price, weight, daysAgo, grade], i) => ({
        source: 'ZZTEST',
        source_category: 'sold_verified',
        manufacturer: MFR,
        model,
        master_equipment_id: masterId,
        sold_price: price,
        inferred_grade: grade,
        grade_confidence: 'high',
        grade_source: 'description_parse',
        listing_url: `https://example.com/${model}/${i}`,
        weight,
        scraped_at: new Date(Date.now() - daysAgo * 86400_000).toISOString(),
      }))
    );
    if (error) throw error;
  }

  try {
    console.log('Seeding fictional pricing data...');

    // ---- M1: median / IQR / outlier / medium confidence -----------------
    // 11 records with the median crossing strictly INSIDE the 1000 block —
    // seconds of time decay make "exactly at the boundary" seeds flip
    // nondeterministically, so every expected value needs margin
    const m1 = await makeModel('MedianBox 100');
    await seedPrices(
      m1,
      'MedianBox 100',
      ([900, 950, 1000, 1000, 1000, 1000, 1000, 1050, 1100, 1150, 5000] as number[]).map(
        (p) => [p, 1.0, 0, 'B'] as [number, number, number, string]
      )
    );
    console.log('\nM1 — weighted median, IQR range, outlier');
    const r1 = await suggest(m1);
    check('median = 1000', approx(r1.median, 1000), r1);
    check('range low = 1000 (median - (median-Q1))', approx(r1.suggested_low, 1000), r1);
    check('range high = 1100 (median + (Q3-median))', approx(r1.suggested_high, 1100), r1);
    check('$5000 outlier outside suggested range', r1.suggested_high < 5000, r1);
    check('confidence medium at 11 fresh records', r1.confidence === 'medium', r1);
    check('no bootstrap on model with own data', r1.bootstrap_used === false, r1);

    // ---- M2: time decay -------------------------------------------------
    const m2 = await makeModel('DecayBox 200');
    await seedPrices(m2, 'DecayBox 200', [
      [1000, 1.0, 0, 'B'],
      [1000, 1.0, 0, 'B'],
      [2000, 1.0, 360, 'B'], // two half-lives old -> eff 0.25 each
      [2000, 1.0, 360, 'B'],
      [2000, 1.0, 360, 'B'],
      [2000, 1.0, 360, 'B'],
    ]);
    console.log('\nM2 — time decay');
    const r2 = await suggest(m2);
    check(
      'fresh 1000s outweigh 2x as many stale 2000s (median 1000)',
      approx(r2.median, 1000),
      r2
    );

    // ---- M3: grade normalization ---------------------------------------
    const m3 = await makeModel('GradeBox 300');
    await seedPrices(
      m3,
      'GradeBox 300',
      Array.from({ length: 6 }, () => [1000, 1.0, 0, 'B'] as [number, number, number, string])
    );
    console.log('\nM3 — grade normalization of grade-B data');
    const r3a = await suggest(m3, 'A');
    check('grade A request scales up (1150)', approx(r3a.median, 1150), r3a);
    const r3c = await suggest(m3, 'C');
    check('grade C request scales down (800)', approx(r3c.median, 800), r3c);

    // ---- M6: high confidence -------------------------------------------
    const m6 = await makeModel('DenseBox 600');
    await seedPrices(
      m6,
      'DenseBox 600',
      Array.from({ length: 31 }, () => [1000, 1.0, 0, 'B'] as [number, number, number, string])
    );
    console.log('\nM6 — confidence high at 31 records');
    const r6 = await suggest(m6);
    check('confidence high', r6.confidence === 'high', r6);
    check('no bootstrap at/above the record threshold', r6.bootstrap_used === false, r6);

    // ---- M7/M8: bootstrap ----------------------------------------------
    // Deliberately SHARED manufacturer — this pair tests bootstrap
    const m7 = await makeModel('ThinBox 700', 'lighting', `${MFR} BootstrapFamily`);
    const m8 = await makeModel('SiblingBox 800', 'lighting', `${MFR} BootstrapFamily`);
    await seedPrices(m7, 'ThinBox 700', [
      [1000, 1.0, 0, 'B'],
      [1000, 1.0, 0, 'B'],
    ]);
    await seedPrices(
      m8,
      'SiblingBox 800',
      Array.from({ length: 20 }, () => [1200, 1.0, 0, 'B'] as [number, number, number, string])
    );
    console.log('\nM7 — bootstrap from same-manufacturer/category siblings');
    const r7 = await suggest(m7);
    check('bootstrap engaged', r7.bootstrap_used === true, r7);
    check('sibling data pulls median to 1200', approx(r7.median, 1200), r7);
    check('confidence capped at low', r7.confidence === 'low', r7);
    // Q1=1000, Q3=1200 -> with 1.5x bootstrap widening: low = 1200-200*1.5
    check('range widened by bootstrap multiplier (low 900)', approx(r7.suggested_low, 900), r7);
    check('effective weight = 2 + 20*0.25 = 7', approx(r7.effective_weight, 7, 0.05), r7);

    // ---- M5: thin, no siblings -----------------------------------------
    const m5 = await makeModel('LonelyBox 500', 'staging');
    await seedPrices(m5, 'LonelyBox 500', [
      [800, 1.0, 0, 'B'],
      [800, 1.0, 0, 'B'],
    ]);
    console.log('\nM5 — thin model with no bootstrap data');
    const r5 = await suggest(m5);
    check('has_data true with 2 records', r5.has_data === true, r5);
    check('no bootstrap flag without siblings', r5.bootstrap_used === false, r5);
    check('confidence none below low threshold', r5.confidence === 'none', r5);

    // ---- M9: own-transaction union path --------------------------------
    console.log('\nM9 — own transactions union with market_prices');
    const m9 = await makeModel('UnionBox 900');
    await seedPrices(m9, 'UnionBox 900', [[1000, 1.0, 0, 'B']]);

    const { data: au, error: auErr } = await db.auth.admin.createUser({
      email: `zztest_pricing_${Date.now()}@example.com`,
      email_confirm: true,
    });
    if (auErr) throw auErr;
    created.authUserIds.push(au.user.id);
    await db.from('users').insert({ id: au.user.id, email: au.user.email, role: 'buyer' });
    const { data: seller } = await db
      .from('sellers')
      .insert({ user_id: au.user.id, business_name: 'ZZTEST_SELLER', account_type: 'business' })
      .select('id')
      .single();
    created.sellerId = seller!.id;
    const { data: listing } = await db
      .from('listings')
      .insert({
        seller_id: created.sellerId,
        master_equipment_id: m9,
        title: 'ZZTEST_PRICING_LOT',
        zip_code: '00000',
        listing_type: 'auction',
        status: 'sold',
        known_issues: 'test',
      })
      .select('id')
      .single();
    created.listingId = listing!.id;
    const { data: tx } = await db
      .from('transactions')
      .insert({
        listing_id: created.listingId,
        buyer_id: au.user.id,
        seller_id: created.sellerId,
        master_equipment_id: m9,
        manufacturer: MFR,
        model: 'UnionBox 900',
        condition_grade: 'B',
        final_price: 2000,
        commission_amount: 200,
        listing_type: 'auction',
        zip_code: '00000',
        status: 'released',
      })
      .select('id')
      .single();
    created.txId = tx!.id;

    const r9 = await suggest(m9);
    check('own transaction counted (model_records 2)', r9.model_records === 2, r9);
    check(
      'both observations in range span (low 1000, high 2000)',
      approx(r9.suggested_low, 1000) && approx(r9.suggested_high, 2000),
      r9
    );
  } finally {
    console.log('\nCleaning up test data...');
    if (created.txId) await db.from('transactions').delete().eq('id', created.txId);
    if (created.listingId) await db.from('listings').delete().eq('id', created.listingId);
    if (created.sellerId) await db.from('sellers').delete().eq('id', created.sellerId);
    for (const id of created.authUserIds) {
      await db.from('users').delete().eq('id', id);
      await db.auth.admin.deleteUser(id);
    }
    await db.from('market_prices').delete().eq('source', 'ZZTEST');
    for (const id of created.masterIds) await db.from('master_equipment').delete().eq('id', id);
  }

  console.log(failures === 0 ? '\nALL SCENARIOS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('simulation crashed:', e);
  process.exit(1);
});
