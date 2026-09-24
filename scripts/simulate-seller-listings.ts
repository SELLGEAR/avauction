// Verification harness for the seller's own listing views: list, detail,
// withdraw, and the identity walls in both directions.
//
// Pure-TS checks: the status -> group mapping and the withdraw rule table
// (state machine: in-review / returned / live buy-it-now / live auction
// with no bids are withdrawable; live auction with bids, sold, ended and
// withdrawn are not).
// DB checks: getSellerListings/getSellerListingDetail/withdrawListing
// (the real code behind /api/seller/listings*) against live rows —
// cover photo is the signed buyer URL, watcher count respects
// min_watchers_to_display, rejection reason reaches the seller, withdraw
// flips to delisted with the delist prompt recorded and a private-sale
// flag logged for sold_privately / no_answer, a withdrawn listing leaves
// public search and the public detail route.
// Identity walls: the seller never sees bidder identities (no bids rows
// via RLS, no bidder fields in the seller payloads, bid_history carries no
// bidder id); buyers and anon never see seller identity (sellers table
// unreadable, embeds denied, the public detail route exposes only the
// anonymous block).
// Self-cleaning. Run with: npx tsx scripts/simulate-seller-listings.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import {
  DELIST_REASONS,
  FLAGGING_REASONS,
  GROUP_FOR_STATUS,
  getSellerListingDetail,
  getSellerListings,
  withdrawBlock,
  withdrawListing,
} from '../lib/seller/listings';
import { reviewListing } from '../lib/admin/listings';
import { publicIdPrefix, verifyUploadedPhotos } from '../lib/photos/cloudinary';
import { GET as publicListingGet } from '../app/api/listings/[id]/route';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const bidKey = process.env.BID_ENCRYPTION_KEY;
if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY required for the RLS checks');
if (!bidKey) throw new Error('BID_ENCRYPTION_KEY required to place a test bid');
const db = createClient(url, key, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}

const FAKE = { cloudName: 'zztest-cloud', apiSecret: 'zztest-secret' };
const SHOT_TYPES = ['front', 'back', 'left_side', 'right_side', 'powered_on', 'serial_label', 'flight_case', 'damage_closeup'] as const;
function fakePhotos(sellerId: string, seed: number) {
  const raw = Array.from({ length: 8 }, (_, i) => {
    const public_id = `${publicIdPrefix(sellerId)}0000000${seed}-0000-4000-8000-${String(i).padStart(12, '0')}`;
    const version = 1700000000 + seed * 100 + i;
    const signature = createHash('sha1').update(`public_id=${public_id}&version=${version}${FAKE.apiSecret}`).digest('hex');
    return { public_id, version, signature, format: 'jpg', width: 1600, height: 1200, bytes: 250_000 + i, photo_type: SHOT_TYPES[i], position: i,
      blur_regions: i === 0 ? [{ x: 0.1, y: 0.1, w: 0.2, h: 0.1 }] : [] };
  });
  const v = verifyUploadedPhotos(raw, sellerId, FAKE);
  if (!v.ok) throw new Error('fixture photos failed verification');
  return v.photos;
}

async function main() {
  const created = { authUserIds: [] as string[], sellerIds: [] as string[], equipmentId: '', adminId: '' };
  const PASSWORD = 'zztest-SellerList-123!';

  try {
    // ---- Pure TS: state machine -----------------------------------------
    console.log('State -> group mapping (CLAUDE.md: no rejected status; draft = returned)');
    check('pending_review -> in_review', GROUP_FOR_STATUS.pending_review === 'in_review');
    check('active -> live', GROUP_FOR_STATUS.active === 'live');
    check('draft -> returned (rejection returns to draft with rejection_reason)', GROUP_FOR_STATUS.draft === 'returned');
    check('sold -> sold', GROUP_FOR_STATUS.sold === 'sold');
    check('expired -> ended', GROUP_FOR_STATUS.expired === 'ended');
    check('delisted -> withdrawn', GROUP_FOR_STATUS.delisted === 'withdrawn');

    console.log('\nWithdraw rule table');
    check('in review: withdrawable', withdrawBlock({ status: 'pending_review', listing_type: 'auction', bid_count: 0 }) === null);
    check('returned draft: withdrawable', withdrawBlock({ status: 'draft', listing_type: 'buy_it_now', bid_count: 0 }) === null);
    check('live buy-it-now: withdrawable', withdrawBlock({ status: 'active', listing_type: 'buy_it_now', bid_count: 0 }) === null);
    check('live auction, no bids: withdrawable', withdrawBlock({ status: 'active', listing_type: 'auction', bid_count: 0 }) === null);
    check('live auction with bids: blocked (auction_has_bids)', withdrawBlock({ status: 'active', listing_type: 'auction', bid_count: 1 }) === 'auction_has_bids');
    check('sold: blocked', withdrawBlock({ status: 'sold', listing_type: 'auction', bid_count: 3 }) === 'already_sold');
    check('expired: blocked', withdrawBlock({ status: 'expired', listing_type: 'auction', bid_count: 0 }) === 'already_ended');
    check('delisted: blocked', withdrawBlock({ status: 'delisted', listing_type: 'buy_it_now', bid_count: 0 }) === 'already_withdrawn');
    check('delist prompt answers match the 0007 check constraint',
      JSON.stringify([...DELIST_REASONS]) === JSON.stringify(['sold_on_platform', 'sold_privately', 'no_longer_selling', 'no_answer']));
    check('sold_privately + no_answer log a private-sale flag; the other two do not',
      FLAGGING_REASONS.includes('sold_privately') && FLAGGING_REASONS.includes('no_answer') && !FLAGGING_REASONS.includes('sold_on_platform') && !FLAGGING_REASONS.includes('no_longer_selling'));

    // ---- DB setup -------------------------------------------------------
    console.log('\nSetting up test data (ZZTEST_)...');
    const mkUser = async (tag: string) => {
      const email = `zztest_sl_${tag}_${Date.now()}@example.com`;
      const { data, error } = await db.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      await db.from('users').upsert({ id: data.user.id, email, role: 'buyer' });
      return { id: data.user.id, email };
    };
    const signIn = async (email: string) => {
      const c = createClient(url, anonKey!, { auth: { persistSession: false } });
      const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
      if (error || !data.session) throw new Error(`sign-in failed: ${error?.message}`);
      return {
        token: data.session.access_token,
        client: createClient(url, anonKey!, { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${data.session.access_token}` } } }),
      };
    };
    const mkSeller = async (tag: string) => {
      const u = await mkUser(tag);
      const { data: s, error } = await db.from('sellers')
        .insert({ user_id: u.id, business_name: `ZZTEST_SL_${tag} Rentals LLC`, account_type: 'business', contact_email: `zztest_sl_${tag}_contact@example.com` })
        .select('id').single();
      if (error) throw error;
      created.sellerIds.push(s!.id);
      await db.from('users').update({ role: 'seller' }).eq('id', u.id);
      return { ...u, sellerId: s!.id as string };
    };
    const sellerA = await mkSeller('a');
    const sellerB = await mkSeller('b');
    const buyer = await mkUser('buyer');
    const adminUser = await mkUser('admin');
    await db.from('users').update({ role: 'admin' }).eq('id', adminUser.id);
    created.adminId = adminUser.id;
    const { data: equip } = await db.from('master_equipment')
      .insert({ manufacturer: 'ZZTest SellerCo', model: `View ${Date.now()}`, aliases: [], category: 'lighting', status: 'approved', source: 'av_iq' })
      .select('id').single();
    created.equipmentId = equip!.id;

    async function submit(sellerId: string, seed: number, overrides: Record<string, unknown>) {
      const { data, error } = await db.rpc('submit_listing', { p: {
        seller_id: sellerId, master_equipment_id: created.equipmentId, title: `ZZTEST_SL_${seed}`,
        description: 'Seller view test lot', condition_grade: 'B', quantity: 1, serial_numbers: ['SN-1'], zip_code: '00000',
        known_issues: 'None disclosed', entry_method: 'form', photos: fakePhotos(sellerId, seed),
        qc: { powers_on: true, all_components: true, flight_case: false, cosmetic_damage: 'minor', known_issues: false, serviced: false,
              serial_confirmed: true, suggested_grade: 'B', seller_accepted_grade: true },
        admin_meta: { quality_score: 77, score_breakdown: {}, suggested_grade: 'B', price_suggestion: null },
        ...overrides,
      } });
      if (error) throw new Error(`submit_listing failed: ${error.message}`);
      if (!data?.ok) throw new Error(`submit rejected: ${JSON.stringify(data)}`);
      return data.listing_id as string;
    }
    const auctionId = await submit(sellerA.sellerId, 1, { listing_type: 'auction', asking_price: 2000, reserve_price: 1500 });
    const binId = await submit(sellerA.sellerId, 2, { listing_type: 'buy_it_now', asking_price: 900 });
    const bin2Id = await submit(sellerA.sellerId, 3, { listing_type: 'buy_it_now', asking_price: 450 });
    const bOwnId = await submit(sellerB.sellerId, 4, { listing_type: 'buy_it_now', asking_price: 300 });

    // ---- List --------------------------------------------------------------
    console.log('\nSeller list — GET /api/seller/listings');
    const listA = await getSellerListings(sellerA.sellerId);
    check('seller A sees exactly their 3 listings', listA.length === 3 && listA.every((l) => l.title.startsWith('ZZTEST_SL_')), listA.map((l) => l.title));
    check("seller B's listing is not in A's list", !listA.some((l) => l.id === bOwnId));
    check('all three in review', listA.every((l) => l.status === 'pending_review' && l.group === 'in_review'));
    const rowA = listA.find((l) => l.id === auctionId)!;
    check('cover photo is the signed buyer URL of position 0 (blur + watermark)',
      !!rowA.cover_url && rowA.cover_url.includes('/image/authenticated/s--') && rowA.cover_url.includes('e_blur_region:') && rowA.cover_url.includes('avauction.com'), rowA.cover_url);
    check('photo count 8', rowA.photo_count === 8);
    check('listing type carried', rowA.listing_type === 'auction' && listA.find((l) => l.id === binId)?.listing_type === 'buy_it_now');
    check('in-review rows are withdrawable', rowA.can_withdraw && rowA.withdraw_block === null);
    check('no bidder fields anywhere in the list payload', !JSON.stringify(listA).match(/bidder_id|max_bid|business_name|contact_email/));
    const listEmpty = await getSellerListings('00000000-0000-4000-8000-000000000000');
    check('unknown seller -> empty list (empty-state path)', listEmpty.length === 0);

    // ---- Detail -------------------------------------------------------------
    console.log('\nSeller detail — GET /api/seller/listings/[id]');
    const det = await getSellerListingDetail(sellerA.sellerId, auctionId);
    check('detail returns everything submitted', !!det && det.title === 'ZZTEST_SL_1' && det.zip_code === '00000' && det.serial_numbers[0] === 'SN-1' && det.known_issues === 'None disclosed', det?.title);
    check('detail carries the QC checklist', det?.qc?.powers_on === true && det?.qc?.cosmetic_damage === 'minor' && det?.qc?.suggested_grade === 'B');
    check('detail carries the equipment', det?.equipment?.manufacturer === 'ZZTest SellerCo' && det?.equipment?.category === 'lighting');
    check('detail photos are the stored buyer URLs with blur counts', det?.photos.length === 8 && det.photos[0].blur_region_count === 1 && det.photos[1].blur_region_count === 0 && det.photos[0].url.includes('/image/authenticated/s--'));
    check("seller sees their own reserve", det?.reserve_price === 1500);
    check('admin-only data absent (quality score / price suggestion)', !JSON.stringify(det).match(/quality_score|price_suggestion|score_breakdown/));
    const detB = await getSellerListingDetail(sellerB.sellerId, auctionId);
    check("another seller gets null for A's listing (indistinguishable from missing)", detB === null);
    const detMissing = await getSellerListingDetail(sellerA.sellerId, '00000000-0000-4000-8000-000000000000');
    check('unknown listing -> null', detMissing === null);

    // ---- Live auction: bids, watchers, threshold ---------------------------
    console.log('\nLive auction — bids, watchers, threshold');
    const start = new Date(Date.now() - 3600_000).toISOString();
    const end = new Date(Date.now() + 4 * 3600_000).toISOString();
    const a1 = await reviewListing(created.adminId, auctionId, 'approve', { auctionStart: start, auctionEnd: end });
    check('auction approved and live', a1.ok === true, a1);
    const { data: bid, error: bidErr } = await db.rpc('place_bid', { p_listing_id: auctionId, p_bidder_id: buyer.id, p_max_bid: 500, p_key: bidKey });
    check('buyer places a bid', !bidErr && (bid as any)?.ok !== false, bidErr?.message ?? bid);
    await db.from('watchlists').insert({ buyer_id: buyer.id, listing_id: auctionId });
    const { data: thr } = await db.from('pricing_engine_settings').select('value').eq('key', 'min_watchers_to_display').maybeSingle();
    const threshold = Number(thr?.value ?? 10);
    const live = (await getSellerListings(sellerA.sellerId)).find((l) => l.id === auctionId)!;
    check('live auction shows current high bid + bid count', live.status === 'active' && live.current_bid != null && live.bid_count >= 1, live);
    check('time remaining available (auction_end)', live.auction_end === end || !!live.auction_end);
    check(`watcher count hidden below the threshold (${threshold})`, threshold > 1 ? live.watcher_count === null : live.watcher_count === 1, live.watcher_count);
    check('live auction with bids is NOT withdrawable', !live.can_withdraw && live.withdraw_block === 'auction_has_bids');
    const w1 = await withdrawListing(sellerA.sellerId, auctionId, 'no_longer_selling');
    check('withdraw refused: not_withdrawable / auction_has_bids', !w1.ok && w1.error === 'not_withdrawable' && w1.block === 'auction_has_bids', w1);
    // Threshold met -> count shown
    const extraWatchers: string[] = [];
    for (let i = 0; i < Math.max(threshold - 1, 0); i++) {
      const u = await mkUser(`w${i}`);
      extraWatchers.push(u.id);
      await db.from('watchlists').insert({ buyer_id: u.id, listing_id: auctionId });
    }
    const liveShown = (await getSellerListings(sellerA.sellerId)).find((l) => l.id === auctionId)!;
    check('watcher count shown once the threshold is met', liveShown.watcher_count === threshold, liveShown.watcher_count);
    const detLive = await getSellerListingDetail(sellerA.sellerId, auctionId);
    check('detail: bid amount/count but no bidder identity', detLive?.current_bid != null && !JSON.stringify(detLive).match(/bidder_id|bidder|max_bid/), Object.keys(detLive ?? {}));

    // ---- Seller can never see bidder identities (RLS) ---------------------
    console.log('\nIdentity wall: seller -> bidders');
    const sA = await signIn(sellerA.email);
    const { data: bidsRows, error: bidsErr } = await sA.client.from('bids').select('*').eq('listing_id', auctionId);
    check("seller cannot read bids on their own listing (bids_bidder_read_own)", !bidsErr && (bidsRows ?? []).length === 0, bidsErr?.message ?? bidsRows);
    const { data: bh } = await sA.client.from('bid_history').select('*').eq('listing_id', auctionId);
    check('bid_history readable but carries no bidder id', (bh ?? []).length >= 1 && !Object.keys(bh![0]).includes('bidder_id') && !Object.keys(bh![0]).includes('max_bid_encrypted'), bh?.[0] && Object.keys(bh[0]));
    const { data: sellerSeesUsers } = await sA.client.from('users').select('id').eq('id', buyer.id);
    check("seller cannot read the bidder's users row", (sellerSeesUsers ?? []).length === 0);

    // ---- Buyers and anon can never see seller identity ---------------------
    console.log('\nIdentity wall: buyers/anon -> seller');
    const sBuyer = await signIn(buyer.email);
    const { data: sellersViaBuyer } = await sBuyer.client.from('sellers').select('*');
    check('buyer cannot read the sellers table', (sellersViaBuyer ?? []).length === 0);
    const { error: embedErr, data: embedData } = await anon.from('listings').select('id, sellers(business_name, contact_email)').eq('id', auctionId);
    check('anon cannot embed seller identity through listings', !!embedErr || (embedData ?? []).every((r: any) => r.sellers == null), embedErr?.message ?? embedData);
    const { error: embedErrB, data: embedDataB } = await sBuyer.client.from('listings').select('id, sellers(business_name)').eq('id', auctionId);
    check('buyer cannot embed seller identity through listings', !!embedErrB || (embedDataB ?? []).every((r: any) => r.sellers == null), embedErrB?.message ?? embedDataB);
    const pubRes = await publicListingGet(new Request(`https://avauction.com/api/listings/${auctionId}`), { params: Promise.resolve({ id: auctionId }) });
    const pub = (await pubRes.json()) as Record<string, any>;
    check('public detail route serves the live auction', pubRes.status === 200 && pub.id === auctionId, pubRes.status);
    check('public detail exposes only the anonymous seller block',
      pub.seller && JSON.stringify(Object.keys(pub.seller).sort()) === JSON.stringify(['anonymous_username', 'display_location', 'industry_verified', 'seller_tier', 'verification_status']), pub.seller);
    check('public detail carries no seller identity or reserve', !JSON.stringify(pub).match(/business_name|contact_email|Rentals LLC|seller_id|reserve_price/));
    const { data: anonListing } = await anon.from('listings').select('*').eq('id', auctionId).maybeSingle();
    check('anon listing row has no name/contact columns', !!anonListing && !Object.keys(anonListing).some((k) => /business|contact|email|phone/.test(k)), anonListing && Object.keys(anonListing));

    // ---- Rejection -> returned -> withdraw with flag ----------------------
    console.log('\nReturned from review -> withdraw');
    const rj = await reviewListing(created.adminId, binId, 'reject', { reason: 'Serial label photo unreadable' });
    check('listing rejected (returns to draft)', rj.ok === true && rj.status === 'draft', rj);
    const returned = (await getSellerListings(sellerA.sellerId)).find((l) => l.id === binId)!;
    check('seller sees the rejection reason in the returned group', returned.group === 'returned' && returned.rejection_reason === 'Serial label photo unreadable', returned);
    check('returned draft is withdrawable', returned.can_withdraw);
    const wBad = await withdrawListing(sellerA.sellerId, binId, 'because');
    check('invalid delist reason rejected', !wBad.ok && wBad.error === 'invalid_reason');
    const wOther = await withdrawListing(sellerB.sellerId, binId, 'no_longer_selling');
    check("another seller cannot withdraw A's listing", !wOther.ok && wOther.error === 'listing_not_found', wOther);
    const w2 = await withdrawListing(sellerA.sellerId, binId, 'sold_privately');
    check('withdraw with sold_privately succeeds and flags', w2.ok && w2.status === 'delisted' && w2.flagged === true, w2);
    const { data: flags } = await db.from('seller_strikes').select('violation_type, is_strike, listing_id').eq('seller_id', sellerA.sellerId);
    check('private_sale_flag logged, not a strike', (flags ?? []).length === 1 && flags![0].violation_type === 'private_sale_flag' && flags![0].is_strike === false && flags![0].listing_id === binId, flags);
    const afterW2 = (await getSellerListings(sellerA.sellerId)).find((l) => l.id === binId)!;
    check('listing now withdrawn with the delist answer recorded', afterW2.status === 'delisted' && afterW2.group === 'withdrawn' && afterW2.delist_reason === 'sold_privately');
    const w2again = await withdrawListing(sellerA.sellerId, binId, 'no_longer_selling');
    check('withdrawing again is refused (already_withdrawn)', !w2again.ok && w2again.error === 'not_withdrawable' && w2again.block === 'already_withdrawn');

    // ---- Live buy-it-now -> withdraw (no flag) -> gone from public ---------
    console.log('\nLive buy-it-now -> withdraw');
    const a2 = await reviewListing(created.adminId, bin2Id, 'approve');
    check('buy-it-now approved', a2.ok === true, a2);
    const { data: s1 } = await db.rpc('search_listings', { p: { q: 'ZZTest SellerCo' } });
    check('live buy-it-now visible in public search', (s1 as any).results.some((r: any) => r.id === bin2Id));
    const w3 = await withdrawListing(sellerA.sellerId, bin2Id, 'no_longer_selling');
    check('withdraw succeeds without a flag', w3.ok && w3.flagged === false, w3);
    const { data: flags2 } = await db.from('seller_strikes').select('id').eq('seller_id', sellerA.sellerId);
    check('no additional flag logged', (flags2 ?? []).length === 1);
    const { data: s2 } = await db.rpc('search_listings', { p: { q: 'ZZTest SellerCo' } });
    check('withdrawn listing gone from public search', !(s2 as any).results.some((r: any) => r.id === bin2Id));
    const pubGone = await publicListingGet(new Request(`https://avauction.com/api/listings/${bin2Id}`), { params: Promise.resolve({ id: bin2Id }) });
    check('withdrawn listing 404s on the public detail route', pubGone.status === 404);
    const { data: anonGone } = await anon.from('listings').select('id').eq('id', bin2Id);
    check('withdrawn listing invisible to anon via RLS', (anonGone ?? []).length === 0);
    const stillMine = (await getSellerListings(sellerA.sellerId)).find((l) => l.id === bin2Id);
    check('...but still in the seller\'s own list as withdrawn', stillMine?.group === 'withdrawn');

    // ---- no_answer path -----------------------------------------------------
    console.log('\nSkipping the delist prompt');
    const skipId = await submit(sellerA.sellerId, 5, { listing_type: 'buy_it_now', asking_price: 100 });
    const w4 = await withdrawListing(sellerA.sellerId, skipId, 'no_answer');
    check('no_answer withdraws and flags', w4.ok && w4.flagged === true, w4);
    const { data: flags3 } = await db.from('seller_strikes').select('id').eq('seller_id', sellerA.sellerId);
    check('second private-sale flag logged', (flags3 ?? []).length === 2);

    // ---- Route-level auth on the seller endpoints ---------------------------
    console.log('\nSeller endpoint gating');
    const { GET: listGet } = await import('../app/api/seller/listings/route');
    const { GET: detailGet } = await import('../app/api/seller/listings/[id]/route');
    const { POST: withdrawPost } = await import('../app/api/seller/listings/[id]/withdraw/route');
    const r401 = await listGet(new Request('https://avauction.com/api/seller/listings'));
    check('list: no token -> 401', r401.status === 401);
    const r403 = await listGet(new Request('https://avauction.com/api/seller/listings', { headers: { Authorization: `Bearer ${sBuyer.token}` } }));
    check('list: buyer (not a seller) -> 403', r403.status === 403);
    const rOk = await listGet(new Request('https://avauction.com/api/seller/listings', { headers: { Authorization: `Bearer ${sA.token}` } }));
    const rOkBody = (await rOk.json()) as { listings: any[] };
    check('list: seller -> 200 with their rows', rOk.status === 200 && rOkBody.listings.length === 4, rOk.status);
    const rDetB = await detailGet(new Request(`https://avauction.com/api/seller/listings/${auctionId}`, { headers: { Authorization: `Bearer ${(await signIn(sellerB.email)).token}` } }), { params: Promise.resolve({ id: auctionId }) });
    check("detail: other seller -> 404", rDetB.status === 404);
    const rW = await withdrawPost(new Request(`https://avauction.com/api/seller/listings/${auctionId}/withdraw`, { method: 'POST', headers: { Authorization: `Bearer ${sA.token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ delist_reason: 'no_longer_selling' }) }), { params: Promise.resolve({ id: auctionId }) });
    check('withdraw route: live auction with bids -> 422 not_withdrawable', rW.status === 422 && ((await rW.json()) as any).block === 'auction_has_bids', rW.status);

    // Cleanup of the extra watchers happens in finally via authUserIds
    void extraWatchers;
  } finally {
    console.log('\nCleaning up test data...');
    for (const sid of created.sellerIds) {
      const { data: ls } = await db.from('listings').select('id').eq('seller_id', sid);
      const ids = (ls ?? []).map((l) => l.id);
      if (ids.length) {
        await db.from('watchlists').delete().in('listing_id', ids);
        await db.from('bids').delete().in('listing_id', ids);
        await db.from('transactions').delete().in('listing_id', ids);
      }
      await db.from('seller_strikes').delete().eq('seller_id', sid);
      await db.from('listings').delete().eq('seller_id', sid);
      await db.from('sellers').delete().eq('id', sid);
    }
    if (created.equipmentId) await db.from('master_equipment').delete().eq('id', created.equipmentId);
    if (created.adminId) await db.from('admin_audit_log').delete().eq('admin_id', created.adminId);
    for (const id of created.authUserIds) {
      await db.from('watchlists').delete().eq('buyer_id', id);
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
