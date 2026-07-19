// Verification harness for the admin panel APIs (migration 0028).
//
// Tests requireAdmin with real JWTs (admin accepted, buyer rejected, no
// header rejected), the listing queue's review context, approve/reject
// with the saved-search alert wiring, the auction scheduling gate, the
// equipment queue + resolution, and audit rows for every admin action.
// Self-cleaning. Run with: npx tsx scripts/simulate-admin.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { requireAdmin } from '../lib/adminAuth';
import { getListingQueue, reviewListing } from '../lib/admin/listings';
import { getEquipmentQueue, resolveEquipment } from '../lib/admin/equipmentQueue';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY required (JWT auth checks)');

const svc = createClient(url, serviceKey, { auth: { persistSession: false } });

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}

const PASSWORD = 'zztest-Admin-123!';

async function tokenFor(email: string): Promise<string> {
  const c = createClient(url, anonKey!, { auth: { persistSession: false } });
  const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
  if (error || !data.session) throw new Error(`sign-in failed: ${error?.message}`);
  return data.session.access_token;
}

function reqWith(token?: string): Request {
  return new Request('https://avauction.com/api/admin/test', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

const FULL_PHOTOS = [
  'front', 'back', 'left_side', 'right_side',
  'powered_on', 'serial_label', 'flight_case', 'damage_closeup',
].map((t, i) => ({ url: `https://res.cloudinary.com/demo/zztest-adm-${i}.jpg`, photo_type: t, position: i }));

async function main() {
  const created = {
    authUserIds: [] as string[],
    adminId: '',
    sellerId: '',
    equipId: '',
    listingIds: [] as string[],
    savedSearchId: '',
    pendingId: '',
  };

  try {
    // ---- Setup ----------------------------------------------------------
    console.log('Setting up test data (ZZTEST_)...');
    const mkUser = async (tag: string) => {
      const email = `zztest_adm_${tag}_${Date.now()}@example.com`;
      const { data, error } = await svc.auth.admin.createUser({
        email, password: PASSWORD, email_confirm: true,
      });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      return { id: data.user.id, email };
    };
    const admin = await mkUser('admin');
    await svc.from('users').update({ role: 'admin' }).eq('id', admin.id);
    created.adminId = admin.id;
    const buyer = await mkUser('buyer');
    const sellerUser = await mkUser('seller');
    const { data: seller } = await svc
      .from('sellers')
      .insert({ user_id: sellerUser.id, business_name: 'ZZTEST_ADMIN_SELLER', account_type: 'business' })
      .select('id')
      .single();
    created.sellerId = seller!.id;
    const { data: equip } = await svc
      .from('master_equipment')
      .insert({
        manufacturer: 'ZZTest AdminCo', model: `Reviewer ${Date.now()}`,
        category: 'audio', status: 'approved', source: 'av_iq',
      })
      .select('id')
      .single();
    created.equipId = equip!.id;

    async function submitListing(title: string, listingType: string) {
      const { data, error } = await svc.rpc('submit_listing', {
        p: {
          seller_id: created.sellerId,
          master_equipment_id: created.equipId,
          title,
          description: 'x'.repeat(100),
          condition_grade: 'B',
          quantity: 1,
          serial_numbers: ['SN-1'],
          zip_code: '00000',
          asking_price: 800,
          listing_type: listingType,
          known_issues: 'None known for this admin test lot',
          entry_method: 'form',
          photos: FULL_PHOTOS,
          qc: {
            powers_on: true, all_components: true, flight_case: false,
            cosmetic_damage: 'minor', known_issues: false, serviced: false,
            serial_confirmed: true, suggested_grade: 'B', seller_accepted_grade: true,
          },
          admin_meta: {
            quality_score: 72,
            score_breakdown: { photos: 30 },
            suggested_grade: 'B',
            price_suggestion: { has_data: false },
          },
        },
      });
      if (error) throw new Error(`submit_listing failed: ${error.message}`);
      const r = data as { ok: boolean; listing_id?: string; error?: string };
      if (!r.ok) throw new Error(`submit rejected: ${r.error}`);
      created.listingIds.push(r.listing_id!);
      return r.listing_id!;
    }

    const buyNowLot = await submitListing('ZZTEST_ADM buy now lot', 'buy_it_now');
    const auctionLot = await submitListing('ZZTEST_ADM auction lot', 'auction');
    const rejectLot = await submitListing('ZZTEST_ADM reject lot', 'buy_it_now');

    const { data: ss } = await svc
      .from('saved_searches')
      .insert({ buyer_id: buyer.id, name: 'ZZTEST_ADM search', filters: { q: 'ZZTest AdminCo' } })
      .select('id')
      .single();
    created.savedSearchId = ss!.id;

    const { data: pend } = await svc
      .from('pending_master_equipment')
      .insert({
        source: 'ZZTEST_ADM',
        raw_title: 'ZZTest AdminCo Reviewer variant listing',
        manufacturer_guess: 'ZZTest AdminCo',
        model_guess: 'Reviewer variant',
        best_match_id: created.equipId,
        best_match_score: 0.61,
      })
      .select('id')
      .single();
    created.pendingId = pend!.id;

    // ---- requireAdmin ---------------------------------------------------
    console.log('\nrequireAdmin — real JWTs');
    const adminToken = await tokenFor(admin.email);
    const buyerToken = await tokenFor(buyer.email);
    check('admin JWT accepted', (await requireAdmin(reqWith(adminToken)))?.id === admin.id);
    check('buyer JWT rejected', (await requireAdmin(reqWith(buyerToken))) === null);
    check('missing auth rejected', (await requireAdmin(reqWith())) === null);

    // ---- Listing queue --------------------------------------------------
    console.log('\nListing queue');
    const queue = await getListingQueue({ perPage: 100 });
    const ours = queue.results.filter((r: any) => r.title?.startsWith('ZZTEST_ADM'));
    check('all 3 pending listings in queue', ours.length === 3, { total: queue.total, ours: ours.length });
    const row: any = ours.find((r: any) => r.id === buyNowLot);
    check('queue row carries quality score', row?.listing_admin_meta?.quality_score === 72, row?.listing_admin_meta);
    check('queue row carries QC answers', row?.qc_responses?.powers_on === true, row?.qc_responses);
    check('queue row carries real seller identity', row?.sellers?.business_name === 'ZZTEST_ADMIN_SELLER', row?.sellers);
    check('queue row carries photo count 8', row?.listing_photos?.[0]?.count === 8, row?.listing_photos);

    // ---- Approve: buy-it-now + alert wiring -----------------------------
    console.log('\nApprove — buy-it-now, saved-search alerts fire');
    const a1 = await reviewListing(created.adminId, buyNowLot, 'approve');
    check('approve ok', a1.ok === true && a1.status === 'active', a1);
    check('saved-search alert fired on approval', a1.ok && a1.alerted === 1, a1);
    const { data: liveRow } = await svc.from('listings').select('status').eq('id', buyNowLot).single();
    check('listing active', liveRow?.status === 'active', liveRow);
    const { data: pub } = await svc.rpc('search_listings', { p: { q: 'ZZTest AdminCo' } });
    check('approved listing in public search', (pub as any).results.some((r: any) => r.id === buyNowLot), (pub as any).total);
    const a1again = await reviewListing(created.adminId, buyNowLot, 'approve');
    check('re-review rejected', a1again.ok === false && a1again.error === 'not_pending_review', a1again);

    // ---- Approve: auction scheduling gate -------------------------------
    console.log('\nApprove — auction scheduling gate');
    const a2bad = await reviewListing(created.adminId, auctionLot, 'approve');
    check('auction approve without schedule rejected', a2bad.ok === false && a2bad.error === 'auction_schedule_required', a2bad);
    const start = new Date(Date.now() + 3600_000).toISOString();
    const end = new Date(Date.now() + 5 * 3600_000).toISOString();
    const a2badOrder = await reviewListing(created.adminId, auctionLot, 'approve', { auctionStart: end, auctionEnd: start });
    check('end-before-start rejected', a2badOrder.ok === false && a2badOrder.error === 'invalid_auction_schedule', a2badOrder);
    const a2 = await reviewListing(created.adminId, auctionLot, 'approve', { auctionStart: start, auctionEnd: end });
    check('auction approved with schedule', a2.ok === true, a2);
    const { data: auctionRow } = await svc
      .from('listings').select('status, auction_start, auction_end').eq('id', auctionLot).single();
    check('auction times stamped', auctionRow?.status === 'active' && !!auctionRow?.auction_start && !!auctionRow?.auction_end, auctionRow);

    // ---- Reject ---------------------------------------------------------
    console.log('\nReject');
    const r1 = await reviewListing(created.adminId, rejectLot, 'reject');
    check('reject without reason rejected', r1.ok === false && r1.error === 'reason_required', r1);
    const r2 = await reviewListing(created.adminId, rejectLot, 'reject', { reason: 'Photos too dark to verify condition' });
    check('reject with reason ok', r2.ok === true && r2.status === 'draft', r2);
    const { data: draftRow } = await svc.from('listings').select('status').eq('id', rejectLot).single();
    check('listing back to draft', draftRow?.status === 'draft', draftRow);

    // ---- Equipment queue + resolution -----------------------------------
    console.log('\nEquipment queue');
    const eq = await getEquipmentQueue({ perPage: 100 });
    const pendRow: any = eq.results.find((r: any) => r.id === created.pendingId);
    check('pending row in queue', !!pendRow, { total: eq.total });
    check('best-match candidate joined', pendRow?.best_match?.manufacturer === 'ZZTest AdminCo', pendRow?.best_match);
    check('score visible for review', Number(pendRow?.best_match_score) === 0.61, pendRow?.best_match_score);

    const res = await resolveEquipment(created.adminId, created.pendingId, 'link_existing', {
      masterEquipmentId: created.equipId,
    });
    check('link_existing resolves', res.ok === true && res.status === 'linked', res);
    const resAgain = await resolveEquipment(created.adminId, created.pendingId, 'reject');
    check('double resolution rejected', resAgain.ok === false && resAgain.error === 'already_resolved', resAgain);

    // ---- Audit trail ----------------------------------------------------
    console.log('\nAudit trail');
    const { data: audit } = await svc
      .from('admin_audit_log')
      .select('action, target_table, target_id, detail')
      .eq('admin_id', created.adminId)
      .order('created_at', { ascending: true });
    const actions = (audit ?? []).map((a) => a.action);
    check(
      'every admin action logged (2 approvals, 1 rejection, 1 resolution)',
      actions.filter((a) => a === 'listing_approved').length === 2 &&
        actions.includes('listing_rejected') &&
        actions.includes('equipment_linked'),
      actions
    );
    const approveEntry = (audit ?? []).find(
      (a) => a.action === 'listing_approved' && a.target_id === buyNowLot
    );
    check('audit detail records alert count', (approveEntry?.detail as any)?.saved_search_alerts_sent === 1, approveEntry);
  } finally {
    // ---- Cleanup --------------------------------------------------------
    console.log('\nCleaning up test data...');
    if (created.adminId) await svc.from('admin_audit_log').delete().eq('admin_id', created.adminId);
    if (created.pendingId) await svc.from('pending_master_equipment').delete().eq('id', created.pendingId);
    if (created.savedSearchId) await svc.from('saved_searches').delete().eq('id', created.savedSearchId);
    for (const id of created.listingIds) await svc.from('listings').delete().eq('id', id);
    if (created.sellerId) await svc.from('sellers').delete().eq('id', created.sellerId);
    if (created.equipId) await svc.from('master_equipment').delete().eq('id', created.equipId);
    for (const id of created.authUserIds) {
      await svc.from('users').delete().eq('id', id);
      await svc.auth.admin.deleteUser(id);
    }
  }

  console.log(failures === 0 ? '\nALL SCENARIOS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('simulation crashed:', e);
  process.exit(1);
});
