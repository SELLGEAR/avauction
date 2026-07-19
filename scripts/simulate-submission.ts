// Verification harness for the seller listing submission flow (0023).
//
// Pure-TS checks: the QC->grade rule table and hand-computed quality
// scores (100 for a complete submission, 26 for a sparse one).
// DB checks: atomic four-table insert at pending_review, hard-rule
// rejections, grade override flagging, and the fuzzy-match resolution
// paths (auto-link / queue-no-listing / junk rejection).
// Self-cleaning. Run with: npx tsx scripts/simulate-submission.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { gradeFromQc, type QcAnswers } from '../lib/listings/gradeFromQc';
import { qualityScore } from '../lib/listings/qualityScore';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
const db = createClient(url, key, { auth: { persistSession: false } });

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}

const cleanQc: QcAnswers = {
  powers_on: true,
  all_components: true,
  flight_case: true,
  cosmetic_damage: 'none',
  known_issues: false,
  serviced: false,
  serial_confirmed: true,
};

const FULL_PHOTOS = [
  'front', 'back', 'left_side', 'right_side',
  'powered_on', 'serial_label', 'flight_case', 'damage_closeup',
].map((t, i) => ({ url: `https://res.cloudinary.com/demo/zztest-${i}.jpg`, photo_type: t, position: i }));

async function main() {
  const created = {
    authUserIds: [] as string[],
    sellerId: '',
    equipmentId: '',
  };

  try {
    // ---- Pure TS: grade rules ------------------------------------------
    console.log('Grade rules (QC -> suggested grade)');
    check('powers_on=false -> D', gradeFromQc({ ...cleanQc, powers_on: false }) === 'D');
    check('known_issues -> C', gradeFromQc({ ...cleanQc, known_issues: true }) === 'C');
    check('significant cosmetic -> C', gradeFromQc({ ...cleanQc, cosmetic_damage: 'significant' }) === 'C');
    check('minor cosmetic -> B', gradeFromQc({ ...cleanQc, cosmetic_damage: 'minor' }) === 'B');
    check('missing components -> B', gradeFromQc({ ...cleanQc, all_components: false }) === 'B');
    check('no flight case -> B', gradeFromQc({ ...cleanQc, flight_case: false }) === 'B');
    check('clean sweep -> A', gradeFromQc(cleanQc) === 'A');

    // ---- Pure TS: quality score ----------------------------------------
    console.log('\nQuality score determinism');
    const full = qualityScore({
      photos: FULL_PHOTOS,
      qc: cleanQc,
      description: 'x'.repeat(250),
      knownIssues: 'None known — fully tested before listing',
      serialNumbers: ['SN-1', 'SN-2'],
      quantity: 2,
      hoursOfUse: 500,
      gradeOverride: false,
    });
    check('complete submission scores 100', full.score === 100, full);
    const sparse = qualityScore({
      photos: FULL_PHOTOS.map((p) => ({ ...p, photo_type: 'other' })),
      qc: { ...cleanQc, serial_confirmed: false, known_issues: true, known_issues_description: '' },
      description: '',
      knownIssues: 'bad',
      serialNumbers: [],
      quantity: 1,
      hoursOfUse: null,
      gradeOverride: true,
    });
    check('sparse submission scores 26', sparse.score === 26, sparse);

    // ---- DB setup -------------------------------------------------------
    console.log('\nSetting up test data (ZZTEST_)...');
    const email = `zztest_sub_${Date.now()}@example.com`;
    const { data: au, error: auErr } = await db.auth.admin.createUser({ email, email_confirm: true });
    if (auErr) throw auErr;
    created.authUserIds.push(au.user.id);
    await db.from('users').insert({ id: au.user.id, email, role: 'seller' });
    const { data: seller } = await db
      .from('sellers')
      .insert({ user_id: au.user.id, business_name: 'ZZTEST_SELLER', account_type: 'business' })
      .select('id')
      .single();
    created.sellerId = seller!.id;
    const { data: equip } = await db
      .from('master_equipment')
      .insert({
        manufacturer: 'ZZTest SubmitCo',
        model: 'UnitBox 900',
        aliases: [],
        category: 'audio',
        status: 'approved',
        source: 'av_iq',
      })
      .select('id')
      .single();
    created.equipmentId = equip!.id;

    function payload(overrides: Record<string, unknown> = {}) {
      const suggested = gradeFromQc(cleanQc);
      return {
        seller_id: created.sellerId,
        master_equipment_id: created.equipmentId,
        title: 'ZZTEST_SUBMIT_LOT',
        description: 'x'.repeat(250),
        condition_grade: suggested,
        grade_override: false,
        quantity: 2,
        hours_of_use: 500,
        serial_numbers: ['SN-1', 'SN-2'],
        zip_code: '00000',
        asking_price: 1500,
        listing_type: 'buy_it_now',
        known_issues: 'None known — fully tested before listing',
        flight_case_included: true,
        entry_method: 'form',
        photos: FULL_PHOTOS,
        qc: { ...cleanQc, suggested_grade: suggested, seller_accepted_grade: true },
        admin_meta: {
          quality_score: 100,
          score_breakdown: full.breakdown,
          suggested_grade: suggested,
          price_suggestion: { has_data: false, confidence: 'none' },
        },
        ...overrides,
      };
    }

    async function submit(p: Record<string, unknown>) {
      const { data, error } = await db.rpc('submit_listing', { p });
      if (error) throw new Error(`submit_listing failed: ${error.message}`);
      return data as Record<string, any>;
    }

    // ---- Successful submission -----------------------------------------
    console.log('\nAtomic submission');
    const r1 = await submit(payload());
    check('submission accepted', r1.ok === true, r1);
    const listingId = r1.listing_id as string;
    const { data: listing } = await db.from('listings').select('*').eq('id', listingId).single();
    check('status pending_review', listing?.status === 'pending_review', listing);
    check('grade A, no override', listing?.condition_grade === 'A' && listing?.grade_override === false, listing);
    check('serials stored', listing?.serial_numbers?.length === 2, listing);
    const { count: photoCount } = await db
      .from('listing_photos')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId);
    check('8 photos inserted', photoCount === 8, { photoCount });
    const { data: qcRow } = await db
      .from('qc_responses')
      .select('suggested_grade, seller_accepted_grade')
      .eq('listing_id', listingId)
      .single();
    check('qc row with suggested grade', qcRow?.suggested_grade === 'A' && qcRow?.seller_accepted_grade === true, qcRow);
    const { data: meta } = await db
      .from('listing_admin_meta')
      .select('*')
      .eq('listing_id', listingId)
      .single();
    check('admin meta: score 100 + breakdown + price stored',
      meta?.quality_score === 100 && !!meta?.score_breakdown && meta?.price_suggestion?.has_data === false,
      meta);

    // ---- Hard-rule rejections ------------------------------------------
    console.log('\nHard-rule rejections');
    const r2 = await submit(payload({ photos: FULL_PHOTOS.slice(0, 7) }));
    check('7 photos rejected', r2.ok === false && r2.error === 'min_8_photos_required', r2);
    const r3 = await submit(payload({ known_issues: '   ' }));
    check('blank known_issues rejected', r3.ok === false && r3.error === 'known_issues_required', r3);
    const r4 = await submit(payload({ listing_type: 'flash_listing' }));
    check('seller cannot submit flash_listing', r4.ok === false && r4.error === 'invalid_listing_type', r4);
    const r5 = await submit(payload({ asking_price: null }));
    check('buy-it-now without asking price rejected', r5.ok === false && r5.error === 'asking_price_required', r5);
    const r6 = await submit(payload({ master_equipment_id: '00000000-0000-0000-0000-000000000000' }));
    check('unknown master equipment rejected', r6.ok === false && r6.error === 'invalid_master_equipment', r6);

    // ---- Grade override flagging ---------------------------------------
    console.log('\nGrade override');
    // Seller claims A but QC says B (no flight case)
    const qcB: QcAnswers = { ...cleanQc, flight_case: false };
    const r7 = await submit(payload({
      condition_grade: 'A',
      grade_override: true,
      qc: { ...qcB, suggested_grade: gradeFromQc(qcB), seller_accepted_grade: false },
      admin_meta: {
        quality_score: 90,
        score_breakdown: {},
        suggested_grade: gradeFromQc(qcB),
        price_suggestion: null,
      },
    }));
    check('override submission accepted', r7.ok === true, r7);
    const { data: overrideListing } = await db
      .from('listings')
      .select('grade_override, condition_grade')
      .eq('id', r7.listing_id)
      .single();
    check('grade_override flagged for admin', overrideListing?.grade_override === true, overrideListing);

    // ---- Fuzzy-match resolution paths ----------------------------------
    console.log('\nFuzzy-match resolution ("can\'t find it" path)');
    async function matchRpc(rawTitle: string, mfr: string | null, model: string | null) {
      const { data, error } = await db.rpc('match_or_queue', {
        p_source: 'seller_submission',
        p_raw_title: rawTitle,
        p_manufacturer_hint: mfr,
        p_model_hint: model,
        p_listing_url: null,
      });
      if (error) throw new Error(`match_or_queue failed: ${error.message}`);
      return data as Record<string, any>;
    }

    const mExact = await matchRpc('ZZTest SubmitCo UnitBox 900', 'ZZTest SubmitCo', 'UnitBox 900');
    check('typed manufacturer/model auto-links', (mExact as any).decision === 'matched' &&
      (mExact as any).master_equipment_id === created.equipmentId, mExact);

    const { count: preListings } = await db
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', created.sellerId);
    // Manufacturer recognizable, model genuinely ambiguous — a title with
    // just the model number missing scores ~0.86 and (correctly) auto-links
    const mPartial = await matchRpc('ZZTest SubmitCo equipment lot untested', null, null);
    check('uncertain product queued for review', (mPartial as any).decision === 'queued', mPartial);
    const { count: postListings } = await db
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', created.sellerId);
    check('no listing created while product pending', postListings === preListings, { preListings, postListings });

    const mJunk = await matchRpc('Random Unknown Widget 9000', null, null);
    check('junk product rejected', (mJunk as any).decision === 'rejected', mJunk);
  } finally {
    // ---- Cleanup (admin meta / photos / qc cascade with listings) -------
    console.log('\nCleaning up test data...');
    if (created.sellerId) {
      await db.from('listings').delete().eq('seller_id', created.sellerId);
      await db.from('sellers').delete().eq('id', created.sellerId);
    }
    await db
      .from('pending_master_equipment')
      .delete()
      .eq('source', 'seller_submission')
      .like('raw_title', 'ZZTest%');
    if (created.equipmentId) await db.from('master_equipment').delete().eq('id', created.equipmentId);
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
