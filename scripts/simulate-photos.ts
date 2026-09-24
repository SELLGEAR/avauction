// Verification harness for the seller photo upload flow (0036).
//
// Pure-TS checks: browser-side file validation, Cloudinary request
// signing (against the documented reference vector), upload-response
// signature verification, watermark delivery URLs (transformation on
// delivery, original untouched), and verifyUploadedPhotos() — the submit
// route's gate — across every rejection path.
// DB checks (need 0036 applied — detected, skipped with a notice if not):
// submit_listing() stores the Cloudinary columns, enforces the 8-photo
// minimum and the required shot types, rejects duplicate public_ids;
// admin approval flips photos to approved and the cover surfaces through
// the public read paths.
// RLS checks (schema-independent): a seller reads their own pending
// photos through the client, another seller and anon cannot, and client
// insert/delete on listing_photos is denied at the grant level.
// Live Cloudinary round-trip runs only if CLOUDINARY_* env is present.
// Self-cleaning. Run with: npx tsx scripts/simulate-photos.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import {
  deliveryUrl,
  destroyAsset,
  getCloudinaryConfig,
  originalUrl,
  publicIdPrefix,
  signParams,
  signedUploadParams,
  verifyUploadSignature,
  verifyUploadedPhotos,
  watermarkedUrl,
} from '../lib/photos/cloudinary';
import {
  ALLOWED_FORMATS,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  MIN_PHOTOS,
  REQUIRED_PHOTO_TYPES,
  THUMB_TRANSFORM,
  WATERMARK_TRANSFORM,
  missingRequiredTypes,
  validateFile,
  withTransformation,
  type UploadedPhoto,
} from '../lib/photos/rules';
import { reviewListing } from '../lib/admin/listings';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');
if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY required for the RLS checks');
const db = createClient(url, key, { auth: { persistSession: false } });
const anon = createClient(url, anonKey, { auth: { persistSession: false } });

let failures = 0;
let skipped = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) console.log(`  PASS  ${name}`);
  else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? '');
  }
}
function skip(name: string, why: string) {
  skipped++;
  console.log(`  SKIP  ${name} — ${why}`);
}

// A fake account for the pure-TS checks: signatures are just SHA-1 over
// the secret, so any secret exercises the real code path
const FAKE = { cloudName: 'zztest-cloud', apiKey: '123456789', apiSecret: 'zztest-secret', moderation: null };

const SHOT_TYPES = [
  'front', 'back', 'left_side', 'right_side',
  'powered_on', 'serial_label', 'flight_case', 'damage_closeup',
] as const;

// Builds what the browser hands back after 8 successful Cloudinary
// uploads for `sellerId`, with valid response signatures under `secret`
function fakeUploads(sellerId: string, secret: string, n = 8): UploadedPhoto[] {
  return Array.from({ length: n }, (_, i) => {
    const public_id = `${publicIdPrefix(sellerId)}${uuidAt(i)}`;
    const version = 1700000000 + i;
    const signature = createHash('sha1').update(`public_id=${public_id}&version=${version}${secret}`).digest('hex');
    return {
      public_id, version, signature, format: 'jpg', width: 1600, height: 1200, bytes: 250_000 + i,
      photo_type: SHOT_TYPES[i % SHOT_TYPES.length], position: i,
    };
  });
}
function uuidAt(i: number) {
  return `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`;
}

async function main() {
  const created = { authUserIds: [] as string[], sellerIds: [] as string[], equipmentId: '', adminId: '' };
  const PASSWORD = 'zztest-Photos-123!';

  try {
    // ---- Pure TS: browser-side validation ------------------------------
    console.log('File validation (browser pre-flight)');
    check('jpeg accepted', validateFile({ name: 'a.jpg', type: 'image/jpeg', size: 1024 }) === null);
    check('heic with empty MIME accepted by extension', validateFile({ name: 'IMG_1.HEIC', type: '', size: 1024 }) === null);
    check('pdf rejected as wrong_type', validateFile({ name: 'a.pdf', type: 'application/pdf', size: 1024 }) === 'wrong_type');
    check('renamed exe rejected as wrong_type', validateFile({ name: 'a.jpg', type: 'application/x-msdownload', size: 10 }) === 'wrong_type');
    check('oversized rejected as too_large', validateFile({ name: 'a.jpg', type: 'image/jpeg', size: MAX_PHOTO_BYTES + 1 }) === 'too_large');
    check('at the limit accepted', validateFile({ name: 'a.jpg', type: 'image/jpeg', size: MAX_PHOTO_BYTES }) === null);
    check('empty file rejected', validateFile({ name: 'a.jpg', type: 'image/jpeg', size: 0 }) === 'empty');
    check(`rules: min ${MIN_PHOTOS}, required powered_on + serial_label`,
      MIN_PHOTOS === 8 && REQUIRED_PHOTO_TYPES.includes('powered_on') && REQUIRED_PHOTO_TYPES.includes('serial_label'));
    check('missingRequiredTypes reports the gap',
      JSON.stringify(missingRequiredTypes([{ photo_type: 'front' }, { photo_type: 'powered_on' }])) === '["serial_label"]');

    // ---- Pure TS: signing ----------------------------------------------
    console.log('\nCloudinary signing');
    // Reference vector from Cloudinary's "Generating authentication
    // signatures" documentation
    check('request signature matches the Cloudinary doc vector',
      signParams({ timestamp: 1315060510, public_id: 'sample_image', eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop' }, 'abcd')
        === 'bfd09f95f331f558cbd1320e67aa8d488770583e');
    const sellerA = '11111111-1111-4111-8111-111111111111';
    const sp = signedUploadParams(FAKE, sellerA);
    check('signed params: server-chosen public_id in the seller namespace',
      sp.public_id.startsWith(`listings/${sellerA}/`) && /[0-9a-f-]{36}$/.test(sp.public_id), sp.public_id);
    check('signed params: allowed_formats locked in', sp.allowed_formats === ALLOWED_FORMATS.join(','), sp.allowed_formats);
    check('signed params: signature covers public_id + allowed_formats + timestamp',
      sp.signature === signParams({ timestamp: sp.timestamp, public_id: sp.public_id, allowed_formats: sp.allowed_formats }, FAKE.apiSecret));
    check('signed params: no secret in the response', !JSON.stringify(sp).includes(FAKE.apiSecret));
    check('moderation param only when configured',
      sp.moderation === undefined && signedUploadParams({ ...FAKE, moderation: 'aws_rek' }, sellerA).moderation === 'aws_rek');
    const good = fakeUploads(sellerA, FAKE.apiSecret);
    check('upload response signature verifies', verifyUploadSignature(good[0].public_id, good[0].version, good[0].signature, FAKE.apiSecret));
    check('tampered version fails verification', !verifyUploadSignature(good[0].public_id, good[0].version + 1, good[0].signature, FAKE.apiSecret));
    check('wrong secret fails verification', !verifyUploadSignature(good[0].public_id, good[0].version, good[0].signature, 'other'));

    // ---- Pure TS: watermark delivery ------------------------------------
    console.log('\nWatermark on delivery, original untouched');
    const wm = watermarkedUrl('demo', 'listings/x/y', 42, 'jpg');
    check('watermarked URL carries the avauction.com text layer',
      wm === `https://res.cloudinary.com/demo/image/upload/${WATERMARK_TRANSFORM}/v42/listings/x/y.jpg` && wm.includes('l_text:') && wm.includes('avauction.com'), wm);
    const orig = originalUrl('demo', 'listings/x/y', 42, 'jpg');
    check('original URL has no transformation', orig === 'https://res.cloudinary.com/demo/image/upload/v42/listings/x/y.jpg', orig);
    check('deliveryUrl composes arbitrary transforms', deliveryUrl('demo', 'p', 1, 'png', 'w_10') === 'https://res.cloudinary.com/demo/image/upload/w_10/v1/p.png');
    check('thumbnail transform is also watermarked', THUMB_TRANSFORM.includes('avauction.com'));
    check('withTransformation inserts after /image/upload/',
      withTransformation('https://res.cloudinary.com/demo/image/upload/v1/a/b.jpg', 'w_10') === 'https://res.cloudinary.com/demo/image/upload/w_10/v1/a/b.jpg');
    check('withTransformation leaves non-Cloudinary URLs alone', withTransformation('/demo/x.jpg', 'w_10') === '/demo/x.jpg');

    // ---- Pure TS: verifyUploadedPhotos (the submit gate) ---------------
    console.log('\nverifyUploadedPhotos — submit route gate');
    const v1 = verifyUploadedPhotos(good, sellerA, FAKE);
    check('8 valid uploads accepted', v1.ok && v1.photos.length === 8, v1);
    if (v1.ok) {
      check('stored url is the watermark delivery URL', v1.photos[0].url === watermarkedUrl(FAKE.cloudName, good[0].public_id, good[0].version, 'jpg'), v1.photos[0].url);
      check('positions re-indexed from client order (cover = 0)', v1.photos.every((p, i) => p.position === i));
      check('photo_type carried through', v1.photos[4].photo_type === 'powered_on');
    }
    const reordered = [good[3], good[0], ...good.slice(1, 3), ...good.slice(4)];
    const v2 = verifyUploadedPhotos(reordered, sellerA, FAKE);
    check('client reorder decides the cover', v2.ok && v2.photos[0].public_id === good[3].public_id && v2.photos[0].position === 0);
    const sellerB = '22222222-2222-4222-8222-222222222222';
    const v3 = verifyUploadedPhotos(good, sellerB, FAKE);
    check("another seller's public_id rejected", !v3.ok && v3.error === 'invalid_photos', v3);
    const v4 = verifyUploadedPhotos([{ ...good[0], signature: 'a'.repeat(40) }], sellerA, FAKE);
    check('forged signature rejected', !v4.ok && v4.error === 'invalid_photos', v4);
    const v5 = verifyUploadedPhotos([good[0], good[0]], sellerA, FAKE);
    check('duplicate public_id rejected', !v5.ok && v5.error === 'duplicate_photo', v5);
    const v6 = verifyUploadedPhotos([{ ...good[0], format: 'exe' }], sellerA, FAKE);
    check('disallowed format rejected', !v6.ok && v6.error === 'invalid_photos', v6);
    const v7 = verifyUploadedPhotos([{ ...good[0], photo_type: 'selfie' as never }], sellerA, FAKE);
    check('unknown photo_type rejected', !v7.ok && v7.error === 'invalid_photos', v7);
    const v8 = verifyUploadedPhotos([{ ...good[0], public_id: `listings/${sellerA}/../../x` }], sellerA, FAKE);
    check('path-traversal public_id rejected', !v8.ok && v8.error === 'invalid_photos', v8);
    const v9 = verifyUploadedPhotos(fakeUploads(sellerA, FAKE.apiSecret, MAX_PHOTOS + 1), sellerA, FAKE);
    check(`more than ${MAX_PHOTOS} rejected`, !v9.ok && v9.error === 'too_many_photos', v9);
    const v10 = verifyUploadedPhotos('nope', sellerA, FAKE);
    check('non-array rejected', !v10.ok && v10.error === 'invalid_photos', v10);
    const v11 = verifyUploadedPhotos([{ ...good[0], bytes: -1 }], sellerA, FAKE);
    check('negative bytes rejected', !v11.ok && v11.error === 'invalid_photos', v11);
    const v12 = verifyUploadedPhotos([], sellerA, FAKE);
    check('empty array passes through (DB answers min_photos_required)', v12.ok && v12.photos.length === 0);

    // ---- Live Cloudinary (optional) -------------------------------------
    console.log('\nLive Cloudinary round-trip');
    const live = getCloudinaryConfig();
    if (!live) {
      skip('signed upload + verify + destroy', 'CLOUDINARY_* env not set');
    } else {
      const sp2 = signedUploadParams(live, sellerA);
      // 1x1 PNG
      const png = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
      const form = new FormData();
      form.append('file', new Blob([png], { type: 'image/png' }), 'zztest.png');
      form.append('api_key', sp2.api_key);
      form.append('timestamp', String(sp2.timestamp));
      form.append('signature', sp2.signature);
      form.append('public_id', sp2.public_id);
      form.append('allowed_formats', sp2.allowed_formats);
      if (sp2.moderation) form.append('moderation', sp2.moderation);
      const res = await fetch(sp2.upload_url, { method: 'POST', body: form });
      const body = (await res.json()) as Record<string, any>;
      check('signed upload accepted by Cloudinary', res.ok && body.public_id === sp2.public_id, body);
      if (res.ok) {
        check('response signature verifies with our secret',
          verifyUploadSignature(body.public_id, body.version, body.signature, live.apiSecret));
        const wmRes = await fetch(watermarkedUrl(live.cloudName, body.public_id, body.version, body.format), { method: 'HEAD' });
        check('watermark transformation URL resolves', wmRes.ok, wmRes.status);
        const result = await destroyAsset(live, sp2.public_id);
        check('signed destroy removes the asset', result === 'ok', result);
      }
    }

    // ---- DB setup -------------------------------------------------------
    console.log('\nSetting up test data (ZZTEST_)...');
    const mkUser = async (tag: string) => {
      const email = `zztest_photos_${tag}_${Date.now()}@example.com`;
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
      return createClient(url, anonKey!, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
      });
    };
    const mkSeller = async (tag: string) => {
      const u = await mkUser(tag);
      const { data: s, error } = await db
        .from('sellers')
        .insert({ user_id: u.id, business_name: `ZZTEST_PHOTOS_${tag}`, account_type: 'business' })
        .select('id')
        .single();
      if (error) throw error;
      created.sellerIds.push(s!.id);
      await db.from('users').update({ role: 'seller' }).eq('id', u.id);
      return { ...u, sellerId: s!.id as string };
    };
    const ownerUser = await mkSeller('owner');
    const otherUser = await mkSeller('other');
    const adminUser = await mkUser('admin');
    await db.from('users').update({ role: 'admin' }).eq('id', adminUser.id);
    created.adminId = adminUser.id;
    const { data: equip } = await db
      .from('master_equipment')
      .insert({ manufacturer: 'ZZTest PhotoCo', model: `Lens ${Date.now()}`, aliases: [], category: 'audio', status: 'approved', source: 'av_iq' })
      .select('id')
      .single();
    created.equipmentId = equip!.id;

    // Live secret if configured, else the fake one: the DB never checks
    // signatures (the route does), so either exercises submit_listing()
    const secret = live?.apiSecret ?? FAKE.apiSecret;
    const cloud = live?.cloudName ?? FAKE.cloudName;
    const uploads = fakeUploads(ownerUser.sellerId, secret);
    const verified = verifyUploadedPhotos(uploads, ownerUser.sellerId, { cloudName: cloud, apiSecret: secret });
    if (!verified.ok) throw new Error('fixture photos failed verification');
    const rows = verified.photos;

    const basePayload = (photos: unknown) => ({
      seller_id: ownerUser.sellerId,
      master_equipment_id: created.equipmentId,
      title: 'ZZTEST_PHOTOS_LOT',
      condition_grade: 'A',
      quantity: 1,
      zip_code: '00000',
      asking_price: 900,
      listing_type: 'buy_it_now',
      known_issues: 'None disclosed',
      entry_method: 'form',
      photos,
      qc: { powers_on: true, all_components: true, flight_case: false, cosmetic_damage: 'none',
            known_issues: false, serviced: false, serial_confirmed: true, suggested_grade: 'A', seller_accepted_grade: true },
      admin_meta: { quality_score: 80, score_breakdown: {}, suggested_grade: 'A', price_suggestion: null },
    });
    async function submit(p: Record<string, unknown>) {
      const { data, error } = await db.rpc('submit_listing', { p });
      if (error) throw new Error(`submit_listing failed: ${error.message}`);
      return data as Record<string, any>;
    }

    // ---- 0036 applied? --------------------------------------------------
    const { error: schemaErr } = await db.from('listing_photos').select('public_id').limit(1);
    const migrated = !schemaErr;
    const { data: minRow } = await db.from('pricing_engine_settings').select('value').eq('key', 'min_photos_per_listing').single();
    const minPhotos = Number(minRow?.value ?? 8);

    console.log('\nsubmit_listing() with Cloudinary photos');
    let listingId = '';
    if (!migrated) {
      skip('all schema checks', '0036 not applied yet (listing_photos.public_id missing) — paste supabase/migrations/0036_listing_photos_cloudinary.sql into the SQL editor and rerun');
      // Still create a legacy-shaped listing so the RLS checks below run
      const legacy = rows.map(({ url, photo_type, position }) => ({ url, photo_type, position }));
      const r = await submit(basePayload(legacy));
      if (!r.ok) throw new Error(`legacy submission failed: ${JSON.stringify(r)}`);
      listingId = r.listing_id;
    } else {
      check('min_photos_per_listing flipped to 8 (the 0031 launch blocker)', minPhotos === 8, minPhotos);
      const r1 = await submit(basePayload(rows));
      check('8 verified photos accepted', r1.ok === true, r1);
      listingId = r1.listing_id;
      const { data: stored } = await db
        .from('listing_photos')
        .select('url, public_id, cloudinary_version, format, width, height, bytes, photo_type, position, moderation_status')
        .eq('listing_id', listingId)
        .order('position');
      check('8 rows stored', stored?.length === 8, stored?.length);
      check('Cloudinary identity columns stored',
        stored?.[0]?.public_id === rows[0].public_id && Number(stored?.[0]?.cloudinary_version) === rows[0].version
          && stored?.[0]?.format === 'jpg' && stored?.[0]?.width === 1600 && stored?.[0]?.bytes === rows[0].bytes, stored?.[0]);
      check('stored url is the watermark delivery URL', stored?.[0]?.url.includes(WATERMARK_TRANSFORM), stored?.[0]?.url);
      check('cover is position 0 of the client order', stored?.[0]?.position === 0 && stored?.[0]?.public_id === rows[0].public_id);
      check('photos start pending moderation', stored?.every((p) => p.moderation_status === 'pending') === true);

      const r2 = await submit(basePayload(rows.slice(0, 7)));
      check('7 photos rejected: min_photos_required', r2.ok === false && r2.error === 'min_photos_required' && r2.required === 8, r2);
      const noSerial = rows.map((p, i) => (i === 5 ? { ...p, photo_type: 'other' } : p));
      const r3 = await submit(basePayload(noSerial));
      check('8 photos without a serial_label shot rejected: required_photo_types_missing',
        r3.ok === false && r3.error === 'required_photo_types_missing' && JSON.stringify(r3.missing) === '["serial_label"]', r3);
      const noPower = rows.map((p, i) => (i === 4 ? { ...p, photo_type: 'front' } : p));
      const r4 = await submit(basePayload(noPower));
      check('8 photos without a powered_on shot rejected', r4.ok === false && r4.error === 'required_photo_types_missing', r4);
      const r5 = await submit(basePayload([...rows.slice(0, 7), rows[0]]));
      check('duplicate public_id rejected: duplicate_photo', r5.ok === false && r5.error === 'duplicate_photo', r5);
      const r6 = await submit(basePayload(rows.map((p) => ({ ...p, public_id: undefined }))));
      check('legacy rows without public_id still insert (demo seed compatibility)', r6.ok === true, r6);
      const { count: preCount } = await db.from('listings').select('*', { count: 'exact', head: true }).eq('seller_id', ownerUser.sellerId);
      check('rejected submissions created no listings', preCount === 2, preCount);
    }

    // ---- RLS: photo rows scoped to the owning seller --------------------
    console.log('\nRLS — listing_photos scoped to the owning seller');
    const ownerClient = await signIn(ownerUser.email);
    const otherClient = await signIn(otherUser.email);
    const { data: ownRows, error: ownErr } = await ownerClient.from('listing_photos').select('id, url, position').eq('listing_id', listingId);
    check('owner reads own pending-review photos via client (grant + policy)', !ownErr && ownRows?.length === 8, ownErr?.message ?? ownRows?.length);
    const { data: otherRows, error: otherErr } = await otherClient.from('listing_photos').select('id').eq('listing_id', listingId);
    check("another seller sees none of them", !otherErr && (otherRows ?? []).length === 0, otherErr?.message ?? otherRows);
    const { data: anonRows, error: anonErr } = await anon.from('listing_photos').select('id').eq('listing_id', listingId);
    check('anon sees none while pending', !anonErr && (anonRows ?? []).length === 0, anonErr?.message ?? anonRows);
    const { error: insErr } = await ownerClient.from('listing_photos').insert({ listing_id: listingId, url: 'https://evil.example/x.jpg' });
    check('owner cannot insert a photo row directly (no client grant — the route is the only write path)',
      !!insErr && /permission denied/i.test(insErr.message), insErr?.message);
    const { error: delErr } = await ownerClient.from('listing_photos').delete().eq('listing_id', listingId);
    check('owner cannot delete photo rows directly (no client grant)', !!delErr && /permission denied/i.test(delErr.message), delErr?.message);
    const { error: updErr } = await ownerClient.from('listing_photos').update({ moderation_status: 'approved' }).eq('listing_id', listingId);
    check('owner cannot self-approve moderation (no client grant)', !!updErr && /permission denied/i.test(updErr.message), updErr?.message);

    // ---- Admin approval releases the photos -----------------------------
    console.log('\nAdmin approval — photos follow the listing');
    const a = await reviewListing(created.adminId, listingId, 'approve');
    check('listing approved', a.ok === true, a);
    const { data: approved } = await db.from('listing_photos').select('moderation_status').eq('listing_id', listingId);
    check('all photos flipped to approved on listing approval', approved?.length === 8 && approved.every((p) => p.moderation_status === 'approved'), approved);
    const { data: anonLive, error: anonLiveErr } = await anon.from('listing_photos').select('id, url, position').eq('listing_id', listingId).order('position');
    check('anon now reads the approved photos of the live listing', !anonLiveErr && anonLive?.length === 8, anonLiveErr?.message ?? anonLive?.length);
    const { data: search } = await db.rpc('search_listings', { p: { q: 'ZZTest PhotoCo' } });
    const hit = (search as any)?.results?.find((r: any) => r.id === listingId);
    check('browse card cover = position-0 photo', !!hit && hit.photo_url === anonLive?.[0]?.url, { hit: hit?.photo_url, first: anonLive?.[0]?.url });
    if (migrated) check('browse card cover is watermarked', !!hit?.photo_url?.includes('avauction.com'), hit?.photo_url);
  } finally {
    console.log('\nCleaning up test data...');
    for (const sid of created.sellerIds) {
      await db.from('listings').delete().eq('seller_id', sid);
      await db.from('sellers').delete().eq('id', sid);
    }
    if (created.equipmentId) await db.from('master_equipment').delete().eq('id', created.equipmentId);
    if (created.adminId) await db.from('admin_audit_log').delete().eq('admin_id', created.adminId);
    for (const id of created.authUserIds) {
      await db.from('users').delete().eq('id', id);
      await db.auth.admin.deleteUser(id);
    }
  }

  const summary = failures === 0 ? '\nALL SCENARIOS PASSED' : `\n${failures} CHECK(S) FAILED`;
  console.log(summary + (skipped ? ` (${skipped} skipped)` : ''));
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('simulation crashed:', e);
  process.exit(1);
});
