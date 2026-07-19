// Verification harness for the fuzzy match system (migration 0020).
//
// Uses FICTIONAL manufacturers/models (ZZTest Quantex, ZZTest Voltarray)
// so nothing can collide with real master_equipment records during
// scoring. Covers: auto-link on clean titles and aliases, hint-based
// matching, queue on partial matches, junk rejection, queue dedup, and
// all three admin resolutions. Self-cleaning.
//
// Run with: npx tsx scripts/simulate-fuzzy-match.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { getSupabaseClient } from './lib/supabaseClient.js';
import { matchOrQueue } from './lib/matchEquipment.js';

const db = getSupabaseClient();
const SOURCE = 'ZZTEST_SOURCE';

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}

async function resolvePending(
  pendingId: string,
  action: string,
  opts: { masterId?: string; manufacturer?: string; model?: string } = {}
) {
  const { data, error } = await db.rpc('resolve_pending_equipment', {
    p_pending_id: pendingId,
    p_action: action,
    p_master_equipment_id: opts.masterId ?? null,
    p_manufacturer: opts.manufacturer ?? null,
    p_model: opts.model ?? null,
    p_resolved_by: null,
  });
  if (error) throw new Error(`resolve failed: ${error.message}`);
  return data as Record<string, any>;
}

async function main() {
  const created = { masterIds: [] as string[] };

  try {
    // ---- Setup: two fictional master records with aliases ---------------
    console.log('Setting up fictional master records...');
    const { data: m1, error: e1 } = await db
      .from('master_equipment')
      .insert({
        manufacturer: 'ZZTest Quantex',
        model: 'Ultraline QX-4400',
        aliases: ['QX4400'],
        category: 'led_video',
        status: 'approved',
        source: 'av_iq',
      })
      .select('id')
      .single();
    if (e1) throw e1;
    created.masterIds.push(m1.id);

    const { data: m2, error: e2 } = await db
      .from('master_equipment')
      .insert({
        manufacturer: 'ZZTest Voltarray',
        model: 'BeamPro 900',
        aliases: ['BP-900 Beam Pro'],
        category: 'lighting',
        status: 'approved',
        source: 'av_iq',
      })
      .select('id')
      .single();
    if (e2) throw e2;
    created.masterIds.push(m2.id);

    // ---- Auto-link ------------------------------------------------------
    console.log('\nAuto-link — clean dirty-title matches');
    const r1 = await matchOrQueue({
      source: SOURCE,
      rawTitle: 'ZZTest Quantex Ultraline QX-4400 LED processor — mint, lot of 3!',
    });
    check('clean title auto-matches', r1.decision === 'matched', r1);
    check('matches the right record', r1.master_equipment_id === m1.id, r1);
    check('score at/above auto threshold', r1.score >= 0.82, r1);

    const r2 = await matchOrQueue({
      source: SOURCE,
      rawTitle: 'ZZTest Voltarray BP-900 Beam Pro moving head PAIR w/ cases',
    });
    check('alias-only title auto-matches', r2.decision === 'matched', r2);
    check('alias resolves to right record', r2.master_equipment_id === m2.id, r2);

    console.log('\nHint-based matching — structured scrape fields');
    const r3 = await matchOrQueue({
      source: SOURCE,
      rawTitle: 'warehouse clearance misc video lot 44-B',
      manufacturerHint: 'ZZTest Quantex',
      modelHint: 'Ultraline QX-4400',
    });
    check('exact hints match despite junk title', r3.decision === 'matched', r3);
    check('hint match is the right record', r3.master_equipment_id === m1.id, r3);

    // ---- Queue band -----------------------------------------------------
    console.log('\nQueue — partial match goes to admin review');
    const r4 = await matchOrQueue({
      source: SOURCE,
      rawTitle: 'ZZTest Quantex Ultraline processor',
      listingUrl: 'https://example.com/zztest-listing',
    });
    check('partial title queued', r4.decision === 'queued', r4);
    check('score in queue band', r4.score >= 0.45 && r4.score < 0.82, r4);
    check('best candidate recorded', r4.best_match_id === m1.id, r4);
    const queuedId = r4.pending_id!;

    const { data: pRow } = await db
      .from('pending_master_equipment')
      .select('*')
      .eq('id', queuedId)
      .single();
    check('pending row stored with source + url', pRow?.source === SOURCE && !!pRow?.listing_url, pRow);

    console.log('\nDedup — re-scrape of the same unmatched product');
    const r5 = await matchOrQueue({
      source: SOURCE,
      rawTitle: 'ZZTest Quantex Ultraline processor',
    });
    check('duplicate returns queued_duplicate', r5.decision === 'queued_duplicate', r5);
    const { count: pendCount } = await db
      .from('pending_master_equipment')
      .select('*', { count: 'exact', head: true })
      .eq('source', SOURCE);
    check('queue row count unchanged (1)', pendCount === 1, { pendCount });

    // ---- Rejection ------------------------------------------------------
    console.log('\nRejection — junk discarded');
    const r6 = await matchOrQueue({
      source: SOURCE,
      rawTitle: 'Antique oak dining table and six chairs',
    });
    check('junk rejected', r6.decision === 'rejected', r6);

    // ---- Admin resolutions ---------------------------------------------
    console.log('\nResolution — link_existing');
    const res1 = await resolvePending(queuedId, 'link_existing', { masterId: m1.id });
    check('linked ok', res1.ok === true && res1.status === 'linked', res1);
    const { data: linked } = await db
      .from('pending_master_equipment')
      .select('status, resolved_master_equipment_id')
      .eq('id', queuedId)
      .single();
    check('row marked linked to M1', linked?.status === 'linked' && linked?.resolved_master_equipment_id === m1.id, linked);
    const res1b = await resolvePending(queuedId, 'reject');
    check('double-resolution rejected', res1b.ok === false && res1b.error === 'already_resolved', res1b);

    console.log('\nResolution — approve_new creates the master record');
    const { data: pNew, error: pErr } = await db
      .from('pending_master_equipment')
      .insert({
        source: SOURCE,
        raw_title: 'ZZTest Novabrand Fresnel 2K tungsten',
        manufacturer_guess: 'zztest novabrand',
        model_guess: 'fresnel 2k',
      })
      .select('id')
      .single();
    if (pErr) throw pErr;
    const res2 = await resolvePending(pNew.id, 'approve_new', {
      manufacturer: 'ZZTest Novabrand',
      model: 'Fresnel 2K',
    });
    check('approve_new ok', res2.ok === true && res2.status === 'approved', res2);
    const { data: newMaster } = await db
      .from('master_equipment')
      .select('id, manufacturer, model, status')
      .eq('id', res2.master_equipment_id)
      .single();
    check(
      'master record created approved with corrected names',
      newMaster?.manufacturer === 'ZZTest Novabrand' && newMaster?.status === 'approved',
      newMaster
    );
    if (newMaster) created.masterIds.push(newMaster.id);

    console.log('\nResolution — approve_new dedupes against existing identity');
    const { data: pDup, error: pdErr } = await db
      .from('pending_master_equipment')
      .insert({
        source: SOURCE,
        raw_title: 'ZZTest Quantex QX-4400 Ultraline duplicate submission',
        manufacturer_guess: 'ZZTest Quantex',
        model_guess: 'Ultraline QX-4400',
      })
      .select('id')
      .single();
    if (pdErr) throw pdErr;
    const res3 = await resolvePending(pDup.id, 'approve_new');
    check(
      'duplicate identity linked, not duplicated',
      res3.ok === true && res3.status === 'linked' && res3.deduplicated === true &&
        res3.master_equipment_id === m1.id,
      res3
    );
    const { count: m1Count } = await db
      .from('master_equipment')
      .select('*', { count: 'exact', head: true })
      .eq('manufacturer', 'ZZTest Quantex');
    check('no duplicate master record', m1Count === 1, { m1Count });

    console.log('\nResolution — reject');
    const { data: pRej, error: prErr } = await db
      .from('pending_master_equipment')
      .insert({
        source: SOURCE,
        raw_title: 'ZZTest mystery box of cables',
      })
      .select('id')
      .single();
    if (prErr) throw prErr;
    const res4 = await resolvePending(pRej.id, 'reject');
    check('reject ok', res4.ok === true && res4.status === 'rejected', res4);
  } finally {
    // ---- Cleanup --------------------------------------------------------
    console.log('\nCleaning up test data...');
    await db.from('pending_master_equipment').delete().eq('source', SOURCE);
    for (const id of created.masterIds) {
      await db.from('master_equipment').delete().eq('id', id);
    }
    await db.from('master_equipment').delete().like('manufacturer', 'ZZTest%');
  }

  console.log(failures === 0 ? '\nALL SCENARIOS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('simulation crashed:', e);
  process.exit(1);
});
