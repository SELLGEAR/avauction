// Verification harness for search and browse (migration 0024).
//
// Self-seeds NYC/LA/Chicago zip centroids so distance assertions are
// deterministic without the full Census load. Covers full-text (mfr,
// model, alias, prefix), every filter, every sort, pagination totals,
// watcher-count threshold hiding, watchlist rows, and saved-search
// matching + alert stamping + the one-hour re-alert guard.
// Self-cleaning. Run with: npx tsx scripts/simulate-search.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { alertsForListing } from '../lib/notifications/savedSearch';

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

async function search(p: Record<string, unknown>) {
  const { data, error } = await db.rpc('search_listings', { p });
  if (error) throw new Error(`search_listings failed: ${error.message}`);
  return data as { total: number; results: Record<string, any>[]; error?: string };
}

function ids(r: { results: Record<string, any>[] }) {
  return r.results.map((x) => x.id);
}

// Test zips (real centroids so distances are sane)
const ZIPS = [
  { zip: '10001', lat: 40.7506, lng: -73.9972, city: 'New York', state: 'NY' },
  { zip: '60601', lat: 41.8858, lng: -87.6229, city: 'Chicago', state: 'IL' },
  { zip: '90210', lat: 34.0901, lng: -118.4065, city: 'Beverly Hills', state: 'CA' },
];

async function main() {
  const created = {
    authUserIds: [] as string[],
    sellerId: '',
    equipIds: [] as string[],
    listingIds: [] as string[],
    savedSearchIds: [] as string[],
    seededZips: [] as string[],
  };

  try {
    // ---- Setup ----------------------------------------------------------
    console.log('Setting up test data (ZZTEST_)...');
    for (const z of ZIPS) {
      const { data: existing } = await db.from('zip_codes').select('zip').eq('zip', z.zip).maybeSingle();
      if (!existing) {
        const { error } = await db.from('zip_codes').insert(z);
        if (error) throw error;
        created.seededZips.push(z.zip);
      }
    }

    const emails = ['zztest_search_seller', 'zztest_search_buyer'].map(
      (n) => `${n}_${Date.now()}@example.com`
    );
    for (const email of emails) {
      const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      await db.from('users').insert({ id: data.user.id, email, role: 'buyer' });
    }
    const [sellerUser, buyer] = created.authUserIds;
    const { data: seller } = await db
      .from('sellers')
      .insert({ user_id: sellerUser, business_name: 'ZZTEST_SELLER', account_type: 'business' })
      .select('id')
      .single();
    created.sellerId = seller!.id;

    async function makeEquip(model: string, category: string, aliases: string[]) {
      const { data, error } = await db
        .from('master_equipment')
        .insert({ manufacturer: 'ZZTest SearchCo', model, aliases, category, status: 'approved', source: 'av_iq' })
        .select('id')
        .single();
      if (error) throw error;
      created.equipIds.push(data.id);
      return data.id as string;
    }
    const e1 = await makeEquip('AlphaDeck 500', 'audio', ['AD-500']);
    const e2 = await makeEquip('BetaPanel X2', 'led_video', []);

    async function makeListing(equip: string, opts: Record<string, unknown>) {
      const { data, error } = await db
        .from('listings')
        .insert({
          seller_id: created.sellerId,
          master_equipment_id: equip,
          zip_code: '10001',
          condition_grade: 'B',
          status: 'active',
          known_issues: 'test',
          ...opts,
        })
        .select('id')
        .single();
      if (error) throw error;
      created.listingIds.push(data.id);
      return data.id as string;
    }

    const l1 = await makeListing(e1, {
      title: 'ZZTEST AlphaDeck 500 pair', listing_type: 'buy_it_now',
      asking_price: 1000, condition_grade: 'A', zip_code: '10001',
    });
    const l2 = await makeListing(e1, {
      title: 'ZZTEST AlphaDeck 500 single', listing_type: 'auction',
      asking_price: 900, condition_grade: 'B', zip_code: '60601',
      auction_start: new Date(Date.now() - 3600_000).toISOString(),
      auction_end: new Date(Date.now() + 2 * 3600_000).toISOString(),
    });
    await db.from('listings').update({ current_bid: 500, bid_count: 3 }).eq('id', l2);
    const l3 = await makeListing(e2, {
      title: 'ZZTEST BetaPanel X2 wall', listing_type: 'buy_it_now',
      asking_price: 3000, condition_grade: 'C', zip_code: '90210',
    });
    await makeListing(e2, {
      title: 'ZZTEST BetaPanel draft', listing_type: 'buy_it_now',
      asking_price: 100, status: 'draft',
    });
    const l5 = await makeListing(e1, {
      title: 'ZZTEST AlphaDeck 500 spare', listing_type: 'auction',
      asking_price: 2000, condition_grade: 'A', zip_code: '10001',
      auction_start: new Date(Date.now() - 3600_000).toISOString(),
      auction_end: new Date(Date.now() + 3600_000).toISOString(),
    });

    // Restrict every query to our test gear to avoid real listings
    const Q = 'ZZTest SearchCo';

    // ---- Full-text ------------------------------------------------------
    console.log('\nFull-text search');
    const s1 = await search({ q: 'AlphaDeck' });
    check('model search hits all 3 active AlphaDecks', [l1, l2, l5].every((x) => ids(s1).includes(x)) && !ids(s1).includes(l3), { total: s1.total });
    const s2 = await search({ q: 'AD-500' });
    check('alias search resolves', [l1, l2, l5].every((x) => ids(s2).includes(x)), { total: s2.total });
    const s3 = await search({ q: 'ZZTest Alpha' });
    check('prefix match works', [l1, l2, l5].every((x) => ids(s3).includes(x)), { total: s3.total });
    const s4 = await search({ q: 'BetaPanel' });
    check('draft listing never appears', ids(s4).includes(l3) && s4.results.every((r) => r.title !== 'ZZTEST BetaPanel draft'), { ids: ids(s4) });

    // ---- Filters --------------------------------------------------------
    console.log('\nFilters');
    const f1 = await search({ q: Q, category: 'audio' });
    check('category filter', f1.total === 3 && [l1, l2, l5].every((x) => ids(f1).includes(x)), { total: f1.total });
    const f2 = await search({ q: Q, condition_grades: ['A'] });
    check('grade filter', f2.total === 2 && [l1, l5].every((x) => ids(f2).includes(x)), { total: f2.total });
    const f3 = await search({ q: Q, listing_type: 'auction' });
    check('listing type filter', f3.total === 2 && [l2, l5].every((x) => ids(f3).includes(x)), { total: f3.total });
    const f4 = await search({ q: Q, price_min: 400, price_max: 1500 });
    check('price range uses effective price (bid 500, ask 1000)', f4.total === 2 && [l1, l2].every((x) => ids(f4).includes(x)), { total: f4.total, ids: ids(f4) });
    const f5 = await search({ q: Q, buyer_zip: '10001', within_miles: 1000 });
    check('distance filter excludes LA', f5.total === 3 && !ids(f5).includes(l3), { total: f5.total });

    // ---- Sorts ----------------------------------------------------------
    console.log('\nSorts');
    const o1 = await search({ q: Q, sort: 'price_low' });
    check('price low->high', ids(o1).join(',') === [l2, l1, l5, l3].join(','), { ids: ids(o1) });
    const o2 = await search({ q: Q, sort: 'price_high' });
    check('price high->low', ids(o2).join(',') === [l3, l5, l1, l2].join(','), { ids: ids(o2) });
    const o3 = await search({ q: Q, sort: 'ending_soonest' });
    check('ending soonest: 1h lot, 2h lot, then buy-nows', ids(o3)[0] === l5 && ids(o3)[1] === l2, { ids: ids(o3) });
    const o4 = await search({ q: Q, sort: 'nearest', buyer_zip: '10001' });
    const d = Object.fromEntries(o4.results.map((r) => [r.id, r.distance_miles]));
    check('nearest: NYC lots first, Chicago mid, LA last', ids(o4).indexOf(l3) === o4.results.length - 1 && ids(o4).indexOf(l2) === o4.results.length - 2, { d });
    check('distances sane (Chicago ~710mi, LA ~2450mi)', d[l2] > 650 && d[l2] < 780 && d[l3] > 2300 && d[l3] < 2600, { d });
    const o5 = await search({ sort: 'nearest' });
    check('nearest without zip errors cleanly', (o5 as any).error === 'buyer_zip_required_for_nearest', o5);

    // ---- Pagination -----------------------------------------------------
    console.log('\nPagination');
    const p1 = await search({ q: Q, sort: 'price_low', per_page: 2, page: 1 });
    const p2 = await search({ q: Q, sort: 'price_low', per_page: 2, page: 2 });
    check('page sizes + stable total', p1.results.length === 2 && p2.results.length === 2 && p1.total === 4 && p2.total === 4, { p1: ids(p1), p2: ids(p2) });
    check('no overlap across pages', ids(p1).every((x) => !ids(p2).includes(x)), { p1: ids(p1), p2: ids(p2) });

    // ---- Watchlist integration -----------------------------------------
    console.log('\nWatchlist integration');
    await db.from('watchlists').insert({ buyer_id: buyer, listing_id: l1 });
    const w1 = await search({ q: Q });
    const l1row = w1.results.find((r) => r.id === l1);
    check('watcher count hidden below threshold (1 < 10)', l1row?.watcher_count == null, l1row);
    const { count: watchRows } = await db
      .from('watchlists')
      .select('*', { count: 'exact', head: true })
      .eq('buyer_id', buyer)
      .eq('listing_id', l1);
    check('watch row present for is_watched merge', watchRows === 1, { watchRows });

    // ---- Saved search matching + alerts --------------------------------
    console.log('\nSaved search alerts');
    const { data: ss1 } = await db
      .from('saved_searches')
      .insert({ buyer_id: buyer, name: 'ZZTEST led video', filters: { category: 'led_video', q: 'ZZTest SearchCo' } })
      .select('id')
      .single();
    created.savedSearchIds.push(ss1!.id);
    const { data: ss2 } = await db
      .from('saved_searches')
      .insert({ buyer_id: buyer, name: 'ZZTEST cheap audio', filters: { category: 'audio', price_max: 100 } })
      .select('id')
      .single();
    created.savedSearchIds.push(ss2!.id);

    const { data: m1 } = await db.rpc('matches_saved_search', { p_filters: { category: 'led_video', q: 'ZZTest SearchCo' }, p_listing_id: l3 });
    check('matcher true on matching listing', m1 === true, m1);
    const { data: m2 } = await db.rpc('matches_saved_search', { p_filters: { category: 'audio', price_max: 100 }, p_listing_id: l3 });
    check('matcher false on non-matching listing', m2 === false, m2);

    const alerted = await alertsForListing(l3);
    check('one saved search alerted for BetaPanel listing', alerted === 1, { alerted });
    const { data: stamped } = await db
      .from('saved_searches')
      .select('last_alerted_at')
      .eq('id', ss1!.id)
      .single();
    check('last_alerted_at stamped', !!stamped?.last_alerted_at, stamped);
    const again = await alertsForListing(l3);
    check('one-hour guard prevents re-alert', again === 0, { again });
  } finally {
    // ---- Cleanup --------------------------------------------------------
    console.log('\nCleaning up test data...');
    for (const id of created.savedSearchIds) await db.from('saved_searches').delete().eq('id', id);
    if (created.sellerId) {
      await db.from('watchlists').delete().in('listing_id', created.listingIds);
      await db.from('listings').delete().eq('seller_id', created.sellerId);
      await db.from('sellers').delete().eq('id', created.sellerId);
    }
    for (const id of created.equipIds) await db.from('master_equipment').delete().eq('id', id);
    for (const id of created.authUserIds) {
      await db.from('users').delete().eq('id', id);
      await db.auth.admin.deleteUser(id);
    }
    for (const zip of created.seededZips) await db.from('zip_codes').delete().eq('zip', zip);
  }

  console.log(failures === 0 ? '\nALL SCENARIOS PASSED' : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('simulation crashed:', e);
  process.exit(1);
});
