// Empirical security audit: probes every table as (1) anonymous client,
// (2) signed-in authenticated client, (3) cross-user, and asserts the
// outcome matches the intended access matrix. Run before launch and after
// any migration touching grants or policies.
//
// Distinguishes the two denial modes: "permission denied" (no base grant —
// the outer gate) vs RLS zero-rows/violation (grant present, policy
// filters). Both are denials; the matrix says which one is expected.
// Self-cleaning. Run with: npx tsx scripts/audit-security.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !serviceKey) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY required for the audit');

const svc = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

let issues = 0;
let passes = 0;
function report(ok: boolean, name: string, detail?: unknown) {
  if (ok) {
    passes++;
    console.log(`  PASS   ${name}`);
  } else {
    issues++;
    console.error(`  ISSUE  ${name}`, detail ?? '');
  }
}

type Outcome = 'rows' | 'zero_rows' | 'permission_denied' | 'rls_or_error';

async function probeSelect(client: SupabaseClient, table: string): Promise<Outcome> {
  const { data, error } = await client.from(table).select('*').limit(1);
  if (error) {
    return /permission denied/i.test(error.message) ? 'permission_denied' : 'rls_or_error';
  }
  return (data ?? []).length > 0 ? 'rows' : 'zero_rows';
}

async function probeInsert(
  client: SupabaseClient,
  table: string,
  row: Record<string, unknown>
): Promise<Outcome> {
  const { error } = await client.from(table).insert(row);
  if (!error) return 'rows';
  return /permission denied/i.test(error.message) ? 'permission_denied' : 'rls_or_error';
}

async function main() {
  const created = {
    authUserIds: [] as string[], sellerId: '', equipId: '',
    pendingEquipId: '', listingIds: [] as string[],
  };
  const PASSWORD = 'zztest-Audit-123!';

  try {
    // ---- Fixtures -------------------------------------------------------
    console.log('Setting up audit fixtures (ZZTEST_)...');
    const mkUser = async (tag: string) => {
      const email = `zztest_audit_${tag}_${Date.now()}@example.com`;
      const { data, error } = await svc.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      return { id: data.user.id, email };
    };
    const userA = await mkUser('a');
    const userB = await mkUser('b');

    const signIn = async (email: string) => {
      const c = createClient(url, anonKey!, { auth: { persistSession: false } });
      const { data, error } = await c.auth.signInWithPassword({ email, password: PASSWORD });
      if (error || !data.session) throw new Error(`sign-in failed: ${error?.message}`);
      return createClient(url, anonKey!, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      });
    };
    const authedA = await signIn(userA.email);

    const { data: seller } = await svc
      .from('sellers')
      .insert({ user_id: userB.id, business_name: 'ZZTEST_AUDIT_SELLER', account_type: 'business' })
      .select('id')
      .single();
    created.sellerId = seller!.id;
    const { data: equip } = await svc
      .from('master_equipment')
      .insert({ manufacturer: 'ZZTEST_AUDIT', model: `AUD-${Date.now()}`, category: 'audio', status: 'approved', source: 'av_iq' })
      .select('id')
      .single();
    created.equipId = equip!.id;
    const mkListing = async (status: string) => {
      const { data } = await svc
        .from('listings')
        .insert({
          seller_id: created.sellerId, master_equipment_id: created.equipId,
          title: `ZZTEST_AUDIT_${status}`, zip_code: '00000', listing_type: 'buy_it_now',
          asking_price: 100, status, known_issues: 'audit',
        })
        .select('id')
        .single();
      created.listingIds.push(data!.id);
      return data!.id as string;
    };
    const activeListing = await mkListing('active');
    const draftListing = await mkListing('draft');

    // ---- 1. The moat: zero client access -------------------------------
    console.log('\n1. Moat tables — zero client grants required');
    // Probe rows must use REAL columns: PostgREST rejects unknown columns
    // before grants are checked, which false-positives the probe
    const moatProbes: Record<string, Record<string, unknown>> = {
      market_prices: {
        source: 'ZZTEST', source_category: 'sold_verified', manufacturer: 'x',
        model: 'x', sold_price: 1, listing_url: 'https://example.com/x',
      },
      listing_admin_meta: { listing_id: activeListing, quality_score: 1 },
    };
    for (const table of ['market_prices', 'listing_admin_meta']) {
      report((await probeSelect(anon, table)) === 'permission_denied', `${table}: anon select denied at grant level`);
      report((await probeSelect(authedA, table)) === 'permission_denied', `${table}: authed select denied at grant level`);
      report(
        (await probeInsert(authedA, table, moatProbes[table])) === 'permission_denied',
        `${table}: authed insert denied at grant level`
      );
    }

    // ---- 2. bids: no direct client insert path --------------------------
    console.log('\n2. bids — place_bid() must be the only write path');
    report(
      (await probeInsert(authedA, 'bids', {
        listing_id: activeListing, bidder_id: userA.id, bid_amount: 50,
      })) === 'permission_denied',
      'bids: direct authed insert denied at grant level'
    );
    report((await probeSelect(anon, 'bids')) === 'permission_denied', 'bids: anon select denied (ceilings protected)');
    const { data: bh, error: bhErr } = await anon.from('bid_history').select('*').limit(1);
    report(!bhErr, 'bid_history view: anon readable', bhErr?.message);
    if (!bhErr && bh) {
      const cols = bh[0] ? Object.keys(bh[0]) : [];
      report(!cols.includes('max_bid_encrypted') && !cols.includes('bidder_id'),
        'bid_history: no ceiling or bidder identity columns', cols);
    }

    // ---- 3. Internal/ops tables: no client access -----------------------
    console.log('\n3. Internal tables — no client access expected');
    for (const table of [
      'pricing_engine_settings', 'scraper_logs', 'weekly_metrics', 'cliff_events',
      'zip_codes', 'pending_master_equipment', 'master_equipment_scrape_log',
    ]) {
      const a = await probeSelect(anon, table);
      const b = await probeSelect(authedA, table);
      report(a === 'permission_denied' && b === 'permission_denied',
        `${table}: anon+authed select denied`, { anon: a, authed: b });
    }

    // ---- 4. Public browse surface ---------------------------------------
    console.log('\n4. Public browse — anon readable, row-filtered');
    const { data: pubListings, error: plErr } = await anon
      .from('listings').select('id, status').in('id', [activeListing, draftListing]);
    report(!plErr && pubListings?.length === 1 && pubListings[0].id === activeListing,
      'listings: anon sees active but NOT draft', { err: plErr?.message, rows: pubListings });
    for (const table of ['listing_photos', 'qc_responses', 'reviews', 'qa_messages', 'stolen_gear_registry']) {
      const o = await probeSelect(anon, table);
      report(o === 'rows' || o === 'zero_rows', `${table}: anon select permitted (policy-filtered)`, o);
    }
    report((await probeInsert(anon, 'stolen_gear_registry', { serial_number: 'HACK' })) === 'permission_denied',
      'stolen_gear_registry: anon write denied');

    // ---- 5. Own-row isolation -------------------------------------------
    console.log('\n5. Own-row isolation');
    const { data: otherUser } = await authedA.from('users').select('*').eq('id', userB.id);
    report((otherUser ?? []).length === 0, "users: A cannot read B's row");
    const { data: ownUser } = await authedA.from('users').select('*').eq('id', userA.id);
    report((ownUser ?? []).length === 1, 'users: A reads own row');
    const { data: otherSeller } = await authedA.from('sellers').select('*');
    report((otherSeller ?? []).length === 0, "sellers: A cannot read B's seller row (no public read)");

    // ---- 6. Frozen identity tables --------------------------------------
    console.log('\n6. users/sellers — client writes must be dead');
    report((await probeInsert(authedA, 'users', { id: userA.id, email: 'x@x.com', role: 'admin' })) === 'permission_denied',
      'users: client insert denied at grant level');
    const { error: updErr } = await authedA.from('users').update({ role: 'admin' }).eq('id', userA.id);
    const { data: roleCheck } = await svc.from('users').select('role').eq('id', userA.id).single();
    report(roleCheck?.role === 'buyer', 'users: client role update has no effect', { updErr: updErr?.message, role: roleCheck?.role });
    report((await probeInsert(authedA, 'sellers', { user_id: userA.id, industry_verified: true })) === 'permission_denied',
      'sellers: client insert denied at grant level');

    // ---- 7. Client-managed tables work (the grants aren't over-locked) --
    console.log('\n7. Client-managed rows — intended paths still function');
    const w = await probeInsert(authedA, 'watchlists', { buyer_id: userA.id, listing_id: activeListing });
    report(w === 'rows', 'watchlists: authed user can watch a listing', w);
    const wForged = await probeInsert(authedA, 'watchlists', { buyer_id: userB.id, listing_id: activeListing });
    report(wForged === 'rls_or_error', 'watchlists: cannot forge rows for another buyer', wForged);
    const s = await probeInsert(authedA, 'saved_searches', { buyer_id: userA.id, filters: { category: 'audio' } });
    report(s === 'rows', 'saved_searches: authed user can save a search', s);
    const dForged = await probeInsert(authedA, 'disputes', {
      transaction_id: '00000000-0000-0000-0000-000000000000', filed_by: userA.id, reason: 'x',
    });
    report(dForged === 'rls_or_error', 'disputes: insert grant present but policy blocks non-parties', dForged);

    // ---- 8. Policy/grant alignment (fixed in 0027) ----------------------
    console.log('\n8. Policy/grant alignment');
    const strikes = await probeSelect(authedA, 'seller_strikes');
    report(strikes === 'zero_rows', 'seller_strikes: sellers can read own strikes (grant + policy aligned)', strikes);
    const { data: mePub, error: meErr } = await anon
      .from('master_equipment').select('id, status').eq('id', created.equipId);
    report(!meErr && mePub?.length === 1, 'master_equipment: anon reads approved records', meErr?.message);
    const { data: pending } = await svc
      .from('master_equipment')
      .insert({ manufacturer: 'ZZTEST_AUDIT', model: `PEND-${Date.now()}`, category: 'audio', status: 'pending_review', source: 'av_iq' })
      .select('id')
      .single();
    created.pendingEquipId = pending!.id;
    const { data: mePend } = await anon.from('master_equipment').select('id').eq('id', pending!.id);
    report((mePend ?? []).length === 0, 'master_equipment: pending_review records hidden from public');
  } finally {
    console.log('\nCleaning up audit fixtures...');
    await svc.from('watchlists').delete().in('listing_id', created.listingIds);
    for (const id of created.listingIds) await svc.from('listings').delete().eq('id', id);
    if (created.sellerId) await svc.from('sellers').delete().eq('id', created.sellerId);
    if (created.equipId) await svc.from('master_equipment').delete().eq('id', created.equipId);
    if (created.pendingEquipId) await svc.from('master_equipment').delete().eq('id', created.pendingEquipId);
    for (const id of created.authUserIds) {
      await svc.from('saved_searches').delete().eq('buyer_id', id);
      await svc.from('users').delete().eq('id', id);
      await svc.auth.admin.deleteUser(id);
    }
  }

  console.log(`\n${passes} checks passed, ${issues} ISSUE(S) found`);
  process.exit(issues === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('audit crashed:', e);
  process.exit(1);
});
