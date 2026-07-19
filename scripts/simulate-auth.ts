// Verification harness for auth flows + the privilege-escalation fix
// (migration 0025).
//
// Service-role checks: signup trigger auto-creates the buyer row;
// create_seller() business/individual paths, username assignment and
// uniqueness, double-upgrade and validation rejections.
// Anon-key checks (only when NEXT_PUBLIC_SUPABASE_ANON_KEY is in
// .env.local): a real signed-in client can no longer escalate role or
// forge a sellers row — the security fix, tested with a live JWT.
// Self-cleaning. Run with: npx tsx scripts/simulate-auth.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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

async function createSeller(userId: string, p: Record<string, unknown>) {
  const { data, error } = await db.rpc('create_seller', { p_user_id: userId, p });
  if (error) throw new Error(`create_seller failed: ${error.message}`);
  return data as Record<string, any>;
}

async function main() {
  const created = { authUserIds: [] as string[] };
  const PASSWORD = 'zztest-Password-123!';

  try {
    // ---- Signup trigger -------------------------------------------------
    console.log('Signup trigger');
    const email1 = `zztest_auth_a_${Date.now()}@example.com`;
    const { data: u1, error: e1 } = await db.auth.admin.createUser({
      email: email1,
      password: PASSWORD,
      email_confirm: true,
    });
    if (e1) throw e1;
    created.authUserIds.push(u1.user.id);
    const { data: row1 } = await db.from('users').select('*').eq('id', u1.user.id).single();
    check('users row auto-created by trigger', !!row1, row1);
    check('role defaults to buyer', row1?.role === 'buyer', row1);
    check('email mirrored', row1?.email === email1, row1);

    // ---- Seller upgrade: business --------------------------------------
    console.log('\nSeller upgrade — business');
    const up1 = await createSeller(u1.user.id, {
      account_type: 'business',
      business_name: 'ZZTEST Rentals LLC',
      ein: '12-3456789',
      business_type: 'rental_house',
    });
    check('business upgrade ok', up1.ok === true, up1);
    check('provisional status', up1.verification_status === 'provisional', up1);
    check('anonymous username assigned', /^VerifiedSeller_\d{4}$/.test(up1.anonymous_username), up1);
    const { data: afterUp } = await db.from('users').select('role').eq('id', u1.user.id).single();
    check('role flipped to seller', afterUp?.role === 'seller', afterUp);
    const { data: sellerRow } = await db
      .from('sellers')
      .select('account_type, business_name, verification_status, seller_tier, industry_verified')
      .eq('user_id', u1.user.id)
      .single();
    check(
      'sellers row: business, standard tier, not industry verified',
      sellerRow?.account_type === 'business' && sellerRow?.seller_tier === 'standard' &&
        sellerRow?.industry_verified === false,
      sellerRow
    );

    const up1b = await createSeller(u1.user.id, { account_type: 'business', business_name: 'X', ein: 'Y' });
    check('double upgrade rejected', up1b.ok === false && up1b.error === 'already_seller', up1b);

    // ---- Seller upgrade: individual + validation ------------------------
    console.log('\nSeller upgrade — individual + validation');
    const email2 = `zztest_auth_b_${Date.now()}@example.com`;
    const { data: u2, error: e2 } = await db.auth.admin.createUser({
      email: email2,
      password: PASSWORD,
      email_confirm: true,
    });
    if (e2) throw e2;
    created.authUserIds.push(u2.user.id);

    const upBad = await createSeller(u2.user.id, { account_type: 'business', business_name: 'No EIN Inc' });
    check('business without EIN rejected', upBad.ok === false && upBad.error === 'business_name_and_ein_required', upBad);
    const upBad2 = await createSeller(u2.user.id, { account_type: 'partnership' });
    check('invalid account type rejected', upBad2.ok === false && upBad2.error === 'invalid_account_type', upBad2);

    const up2 = await createSeller(u2.user.id, { account_type: 'individual' });
    check('individual upgrade ok (no business fields)', up2.ok === true, up2);
    check('usernames unique across sellers', up2.anonymous_username !== up1.anonymous_username, {
      a: up1.anonymous_username,
      b: up2.anonymous_username,
    });

    // ---- Security fix: live-JWT escalation attempts ---------------------
    if (anonKey) {
      console.log('\nSecurity fix — signed-in client escalation attempts');
      const email3 = `zztest_auth_c_${Date.now()}@example.com`;
      const { data: u3, error: e3 } = await db.auth.admin.createUser({
        email: email3,
        password: PASSWORD,
        email_confirm: true,
      });
      if (e3) throw e3;
      created.authUserIds.push(u3.user.id);

      const client = createClient(url, anonKey, { auth: { persistSession: false } });
      const { data: session, error: signInErr } = await client.auth.signInWithPassword({
        email: email3,
        password: PASSWORD,
      });
      if (signInErr || !session.session) throw new Error(`sign-in failed: ${signInErr?.message}`);
      const authed = createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${session.session.access_token}` } },
      });

      const { data: ownRow } = await authed.from('users').select('id, role').eq('id', u3.user.id).single();
      check('client can still read own users row', ownRow?.role === 'buyer', ownRow);

      await authed.from('users').update({ role: 'admin' }).eq('id', u3.user.id);
      const { data: roleAfter } = await db.from('users').select('role').eq('id', u3.user.id).single();
      check('role escalation via update blocked', roleAfter?.role === 'buyer', roleAfter);

      const { error: insErr } = await authed
        .from('users')
        .insert({ id: u3.user.id, email: 'forged@example.com', role: 'admin' });
      check('users insert from client blocked', !!insErr, insErr?.message);

      const { error: sellErr } = await authed
        .from('sellers')
        .insert({ user_id: u3.user.id, account_type: 'business', industry_verified: true });
      check('forged industry-verified sellers row blocked', !!sellErr, sellErr?.message);
    } else {
      console.log('\nSKIP — NEXT_PUBLIC_SUPABASE_ANON_KEY not in .env.local; live-JWT escalation checks not run');
    }
  } finally {
    // ---- Cleanup --------------------------------------------------------
    console.log('\nCleaning up test data...');
    for (const id of created.authUserIds) {
      await db.from('sellers').delete().eq('user_id', id);
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
