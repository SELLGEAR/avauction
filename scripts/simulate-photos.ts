// Verification harness for the seller photo upload flow (0036) and the
// seller-anonymity layer (0037: authenticated delivery + blur regions).
//
// Pure-TS checks: browser-side file validation, Cloudinary request
// signing (against the documented reference vector), upload-response
// signature verification, DELIVERY signing (type=authenticated: the
// signature covers the transformation, so stripping/editing it changes
// the signature), blur-region normalization and pixel mapping, detection
// record normalization, and verifyUploadedPhotos() — the submit route's
// gate — across every rejection path.
// Live Cloudinary (runs when CLOUDINARY_* env is present): a real
// authenticated upload, then the lock-down proof — buyer URL 200,
// transformation stripped -> not 200, transformation edited -> not 200,
// unsigned original -> not 200, public-type path -> not 200, admin-signed
// original 200, blur-region URL 200, signed destroy.
// Live detection (runs when ANTHROPIC_API_KEY is present): the vision scan
// on a synthetic image returns a well-formed record.
// DB checks (need 0036/0037 applied — detected, skipped with a notice if
// not): submit_listing() stores the Cloudinary columns, blur regions and
// detection, enforces the 8-photo minimum and the required shot types,
// rejects duplicate public_ids; admin approval flips photos to approved;
// the admin review query pairs a signed clean original with the buyer URL.
// RLS checks (schema-independent): a seller reads their own pending
// photos through the client, another seller and anon cannot, and client
// insert/update/delete on listing_photos is denied at the grant level.
// Self-cleaning. Run with: npx tsx scripts/simulate-photos.ts

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import {
  BLUR_STRENGTH,
  DELIVERY_TYPE,
  assetExists,
  blurTransform,
  buyerTransform,
  buyerUrl,
  deliverySignature,
  destroyAsset,
  editorUrl,
  getCloudinaryConfig,
  originalUrl,
  publicIdPrefix,
  signParams,
  signedDeliveryUrl,
  signedUploadParams,
  thumbUrl,
  verifyUploadSignature,
  verifyUploadedPhotos,
  type PhotoIdentity,
} from '../lib/photos/cloudinary';
import {
  ALLOWED_FORMATS,
  MAX_BLUR_REGIONS,
  MAX_PHOTOS,
  MAX_PHOTO_BYTES,
  MIN_PHOTOS,
  REQUIRED_PHOTO_TYPES,
  THUMB_TRANSFORM,
  WATERMARK_TRANSFORM,
  missingRequiredTypes,
  normalizeBlurRegions,
  normalizeDetection,
  validateFile,
  type BlurRegion,
  type UploadedPhoto,
} from '../lib/photos/rules';
import { DEFAULT_DETECTION_MODEL, detectIdentifyingMarks, getDetectionModel, parseDetectionOutput } from '../lib/photos/detect';
import { getListingPhotosForReview, reviewListing } from '../lib/admin/listings';

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

// 64x48 PNG with a solid block — big enough for a real blur region
function testPng(): Buffer {
  // Minimal PNG encoder for a flat RGB image
  const w = 64, h = 48;
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const o = y * (w * 3 + 1) + 1 + x * 3;
      const dark = x > 20 && x < 44 && y > 12 && y < 36;
      raw[o] = dark ? 20 : 200; raw[o + 1] = dark ? 20 : 200; raw[o + 2] = dark ? 20 : 200;
    }
  }
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
    return Buffer.concat([len, td, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

async function status(u: string): Promise<number> {
  const r = await fetch(u, { method: 'GET', redirect: 'manual' });
  return r.status;
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

    // ---- Pure TS: upload signing ---------------------------------------
    console.log('\nCloudinary upload signing');
    check('request signature matches the Cloudinary doc vector',
      signParams({ timestamp: 1315060510, public_id: 'sample_image', eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop' }, 'abcd')
        === 'bfd09f95f331f558cbd1320e67aa8d488770583e');
    const sellerA = '11111111-1111-4111-8111-111111111111';
    const sp = signedUploadParams(FAKE, sellerA);
    check('signed params: server-chosen public_id in the seller namespace',
      sp.public_id.startsWith(`listings/${sellerA}/`) && /[0-9a-f-]{36}$/.test(sp.public_id), sp.public_id);
    check('signed params: allowed_formats locked in', sp.allowed_formats === ALLOWED_FORMATS.join(','), sp.allowed_formats);
    check('signed params: type=authenticated locked in', sp.type === 'authenticated' && DELIVERY_TYPE === 'authenticated');
    check('signed params: signature covers public_id + type + allowed_formats + timestamp',
      sp.signature === signParams({ timestamp: sp.timestamp, public_id: sp.public_id, allowed_formats: sp.allowed_formats, type: 'authenticated' }, FAKE.apiSecret));
    check('a signature without type would NOT verify (browser cannot drop it)',
      sp.signature !== signParams({ timestamp: sp.timestamp, public_id: sp.public_id, allowed_formats: sp.allowed_formats }, FAKE.apiSecret));
    check('signed params: no secret in the response', !JSON.stringify(sp).includes(FAKE.apiSecret));
    check('moderation param only when configured',
      sp.moderation === undefined && signedUploadParams({ ...FAKE, moderation: 'aws_rek' }, sellerA).moderation === 'aws_rek');
    const good = fakeUploads(sellerA, FAKE.apiSecret);
    check('upload response signature verifies', verifyUploadSignature(good[0].public_id, good[0].version, good[0].signature, FAKE.apiSecret));
    check('tampered version fails verification', !verifyUploadSignature(good[0].public_id, good[0].version + 1, good[0].signature, FAKE.apiSecret));
    check('wrong secret fails verification', !verifyUploadSignature(good[0].public_id, good[0].version, good[0].signature, 'other'));

    // ---- Pure TS: delivery signing (the lock-down) ----------------------
    console.log('\nDelivery signing — authenticated type, signature covers the transformation');
    const ident: PhotoIdentity = { public_id: 'listings/x/y', version: 42, format: 'jpg', width: 1600, height: 1200 };
    const sig = deliverySignature('w_10', 'listings/x/y', 'jpg', 'abcd');
    const expectedSig = 's--' + createHash('sha1').update('w_10/listings/x/y.jpgabcd').digest('base64').slice(0, 8).replace(/\//g, '_').replace(/\+/g, '-') + '--';
    check('signature = s--base64(sha1(transform/public_id.format + secret))[0..8]--, version excluded', sig === expectedSig, { sig, expectedSig });
    check('signature is URL-safe', /^s--[A-Za-z0-9_-]{8}--$/.test(sig), sig);
    const su = signedDeliveryUrl(FAKE, 'listings/x/y', 42, 'jpg', 'w_10');
    check('URL layout: /image/authenticated/<sig>/<transform>/v<version>/<public_id>.<format>',
      su === `https://res.cloudinary.com/zztest-cloud/image/authenticated/${deliverySignature('w_10', 'listings/x/y', 'jpg', FAKE.apiSecret)}/w_10/v42/listings/x/y.jpg`, su);
    check('changing the transformation changes the signature',
      deliverySignature('w_10', 'listings/x/y', 'jpg', 'abcd') !== deliverySignature('w_11', 'listings/x/y', 'jpg', 'abcd'));
    check('stripping the transformation changes the signature',
      deliverySignature('w_10', 'listings/x/y', 'jpg', 'abcd') !== deliverySignature('', 'listings/x/y', 'jpg', 'abcd'));
    check('original URL has an empty transformation and is still signed',
      originalUrl(FAKE, ident) === `https://res.cloudinary.com/zztest-cloud/image/authenticated/${deliverySignature('', 'listings/x/y', 'jpg', FAKE.apiSecret)}/v42/listings/x/y.jpg`, originalUrl(FAKE, ident));
    const bu = buyerUrl(FAKE, ident, []);
    check('buyer URL (no regions) = signed watermark transform', bu.includes(`/${WATERMARK_TRANSFORM}/v42/`) && bu.includes('/image/authenticated/s--'), bu);
    check('buyer URL never uses the public upload type', !bu.includes('/image/upload/'));
    check('thumb URL is watermarked too', thumbUrl(FAKE, ident, []).includes(THUMB_TRANSFORM));
    check('editor URL is clean (no watermark, no blur) but signed',
      !editorUrl(FAKE, ident).includes('l_text') && editorUrl(FAKE, ident).includes('/image/authenticated/s--'));

    // ---- Pure TS: blur regions -----------------------------------------
    console.log('\nBlur regions — normalized in, pixels out, applied before the watermark');
    const r1 = normalizeBlurRegions([{ x: 0.1, y: 0.2, w: 0.3, h: 0.1, label: 'asset tag' }]);
    check('valid region kept with label', r1?.length === 1 && r1[0].label === 'asset tag', r1);
    const r2 = normalizeBlurRegions([{ x: 0.9, y: 0.9, w: 0.5, h: 0.5 }]);
    check('region clamped to the image', r2?.[0].w === 0.1 && r2?.[0].h === 0.1, r2);
    check('degenerate (tiny) region dropped', normalizeBlurRegions([{ x: 0.5, y: 0.5, w: 0.001, h: 0.001 }])?.length === 0);
    check('non-numeric region rejected', normalizeBlurRegions([{ x: 'a', y: 0, w: 1, h: 1 }]) === null);
    check('non-array rejected', normalizeBlurRegions('nope') === null);
    check('undefined -> empty list', JSON.stringify(normalizeBlurRegions(undefined)) === '[]');
    const bt = blurTransform([{ x: 0.25, y: 0.5, w: 0.5, h: 0.25 }], 1600, 1200);
    check('pixel mapping from normalized coords', bt === `e_blur_region:${BLUR_STRENGTH},x_400,y_600,w_800,h_300`, bt);
    const bt2 = blurTransform([{ x: 0.9, y: 0.9, w: 0.2, h: 0.2 }], 100, 100);
    check('pixel region never exceeds the image', bt2 === `e_blur_region:${BLUR_STRENGTH},x_90,y_90,w_10,h_10`, bt2);
    check('blur is applied BEFORE the watermark (original coordinate space)',
      buyerTransform([{ x: 0, y: 0, w: 0.5, h: 0.5 }], 100, 100).startsWith('e_blur_region:') && buyerTransform([{ x: 0, y: 0, w: 0.5, h: 0.5 }], 100, 100).endsWith(WATERMARK_TRANSFORM));
    check('no regions -> plain watermark transform', buyerTransform([], 100, 100) === WATERMARK_TRANSFORM);
    const d1 = normalizeDetection({ status: 'done', suggested: [{ x: 0, y: 0, w: 0.2, h: 0.2, label: 'logo' }], model: 'claude-opus-5' });
    check('detection record normalized', d1.status === 'done' && d1.suggested.length === 1 && d1.model === 'claude-opus-5', d1);
    check('unknown detection status -> skipped', normalizeDetection({ status: 'weird' }).status === 'skipped');
    check('garbage detection -> skipped/empty', normalizeDetection('x').status === 'skipped');

    // ---- Pure TS: detection output parsing -----------------------------
    console.log('\nDetection output parsing (model JSON -> regions)');
    const parsed = parseDetectionOutput({
      marks: [
        { kind: 'asset_tag', label: 'asset tag', x: 100, y: 200, w: 300, h: 100 },
        { kind: 'manufacturer_branding', label: 'Yamaha logo', x: 0, y: 0, w: 100, h: 100 },
        { kind: 'serial_plate', label: 'serial', x: 0, y: 0, w: 100, h: 100 },
        { kind: 'company_name', label: 'rental co stencil', x: 900, y: 900, w: 300, h: 300 },
      ],
    });
    check('only seller-identifying kinds become regions', parsed.length === 2 && parsed.every((r) => r.label !== 'Yamaha logo' && r.label !== 'serial'), parsed);
    check('1000-grid converted to normalized and clamped', parsed[0].x === 0.1 && parsed[0].w === 0.3 && parsed[1].x === 0.9 && parsed[1].w === 0.1, parsed);
    check('malformed detection output -> no regions', parseDetectionOutput({ marks: 'nope' }).length === 0);
    const savedModel = process.env.PHOTO_DETECTION_MODEL;
    delete process.env.PHOTO_DETECTION_MODEL;
    check(`detection model defaults to ${DEFAULT_DETECTION_MODEL}`, getDetectionModel() === DEFAULT_DETECTION_MODEL && DEFAULT_DETECTION_MODEL === 'claude-opus-5-5');
    process.env.PHOTO_DETECTION_MODEL = 'claude-zztest-override';
    check('PHOTO_DETECTION_MODEL overrides the default', getDetectionModel() === 'claude-zztest-override');
    if (savedModel === undefined) delete process.env.PHOTO_DETECTION_MODEL; else process.env.PHOTO_DETECTION_MODEL = savedModel;

    // ---- Pure TS: verifyUploadedPhotos (the submit gate) ---------------
    console.log('\nverifyUploadedPhotos — submit route gate');
    const v1 = verifyUploadedPhotos(good, sellerA, FAKE);
    check('8 valid uploads accepted', v1.ok && v1.photos.length === 8, v1);
    if (v1.ok) {
      check('stored url is the SIGNED authenticated buyer URL', v1.photos[0].url === buyerUrl(FAKE, v1.photos[0], []), v1.photos[0].url);
      check('positions re-indexed from client order (cover = 0)', v1.photos.every((p, i) => p.position === i));
      check('photo_type carried through', v1.photos[4].photo_type === 'powered_on');
      check('no regions -> empty blur_regions, detection skipped', v1.photos[0].blur_regions.length === 0 && v1.photos[0].detection.status === 'skipped');
    }
    const withRegions = good.map((p, i) => (i === 0
      ? { ...p, blur_regions: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.1, label: 'stencil' }], detection: { status: 'done', suggested: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.1 }], model: 'claude-opus-5', note: null } }
      : p));
    const v1r = verifyUploadedPhotos(withRegions, sellerA, FAKE);
    check('regions accepted and baked into the stored url', v1r.ok && v1r.photos[0].blur_regions.length === 1 && v1r.photos[0].url.includes('e_blur_region:'), v1r.ok ? v1r.photos[0].url : v1r);
    check('detection record stored alongside', v1r.ok && v1r.photos[0].detection.status === 'done' && v1r.photos[0].detection.suggested.length === 1);
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
    const v13 = verifyUploadedPhotos([{ ...good[0], blur_regions: 'bad' as never }], sellerA, FAKE);
    check('malformed blur_regions rejected', !v13.ok && v13.error === 'invalid_blur_regions', v13);
    const tooMany = Array.from({ length: MAX_BLUR_REGIONS + 1 }, (_, i) => ({ x: i / 20, y: 0, w: 0.02, h: 0.1 }));
    const v14 = verifyUploadedPhotos([{ ...good[0], blur_regions: tooMany }], sellerA, FAKE);
    check(`more than ${MAX_BLUR_REGIONS} regions rejected`, !v14.ok && v14.error === 'invalid_blur_regions', v14);

    // ---- Live Cloudinary (optional) -------------------------------------
    console.log('\nLive Cloudinary — authenticated upload + delivery lock-down');
    const live = getCloudinaryConfig();
    let liveIdent: PhotoIdentity | null = null;
    if (!live) {
      skip('authenticated upload + lock-down proof + destroy', 'CLOUDINARY_* env not set');
    } else {
      const sp2 = signedUploadParams(live, sellerA);
      const form = new FormData();
      form.append('file', new Blob([new Uint8Array(testPng())], { type: 'image/png' }), 'zztest.png');
      form.append('api_key', sp2.api_key);
      form.append('timestamp', String(sp2.timestamp));
      form.append('signature', sp2.signature);
      form.append('public_id', sp2.public_id);
      form.append('type', sp2.type);
      form.append('allowed_formats', sp2.allowed_formats);
      if (sp2.moderation) form.append('moderation', sp2.moderation);
      const res = await fetch(sp2.upload_url, { method: 'POST', body: form });
      const body = (await res.json()) as Record<string, any>;
      check('signed authenticated upload accepted by Cloudinary', res.ok && body.public_id === sp2.public_id, res.ok ? body.public_id : body);
      if (res.ok) {
        check('asset stored as type=authenticated', body.type === 'authenticated', body.type);
        check('response signature verifies with our secret',
          verifyUploadSignature(body.public_id, body.version, body.signature, live.apiSecret));
        liveIdent = { public_id: body.public_id, version: body.version, format: body.format, width: body.width, height: body.height };
        const buyer = buyerUrl(live, liveIdent, []);
        check('buyer URL (signed watermark) resolves', (await status(buyer)) === 200, buyer);
        // Strip the transformation but keep the signature
        const stripped = buyer.replace(`/${WATERMARK_TRANSFORM}/`, '/');
        const sStripped = await status(stripped);
        check('transformation STRIPPED from the buyer URL -> rejected', sStripped !== 200, { stripped, status: sStripped });
        // Edit the transformation (drop the watermark layer, keep the resize)
        const edited = buyer.replace(WATERMARK_TRANSFORM, 'c_limit,w_1600,h_1600,q_auto,f_auto');
        const sEdited = await status(edited);
        check('transformation EDITED (watermark removed) -> rejected', sEdited !== 200, { edited, status: sEdited });
        // Unsigned original under the authenticated type
        const unsignedOriginal = `https://res.cloudinary.com/${live.cloudName}/image/authenticated/v${liveIdent.version}/${liveIdent.public_id}.${liveIdent.format}`;
        const sUnsigned = await status(unsignedOriginal);
        check('UNSIGNED original -> rejected', sUnsigned !== 200, { unsignedOriginal, status: sUnsigned });
        // The public delivery type does not exist for this asset
        const publicPath = `https://res.cloudinary.com/${live.cloudName}/image/upload/v${liveIdent.version}/${liveIdent.public_id}.${liveIdent.format}`;
        const sPublic = await status(publicPath);
        check('public /image/upload/ path -> rejected', sPublic !== 200, { publicPath, status: sPublic });
        // Admin-signed clean original
        const orig = originalUrl(live, liveIdent);
        check('admin-signed clean original resolves', (await status(orig)) === 200, orig);
        check('editor URL (clean, capped) resolves', (await status(editorUrl(live, liveIdent))) === 200);
        // Blur region syntax is accepted by Cloudinary
        const blurred = buyerUrl(live, liveIdent, [{ x: 0.3, y: 0.25, w: 0.4, h: 0.5 }]);
        check('buyer URL with a blur region resolves (e_blur_region accepted)', (await status(blurred)) === 200, blurred);
        const blurredStripped = blurred.replace(/e_blur_region:[^/]+\//, '');
        check('blur region STRIPPED from the buyer URL -> rejected', (await status(blurredStripped)) !== 200, blurredStripped);
        check('thumb URL with region resolves', (await status(thumbUrl(live, liveIdent, [{ x: 0.3, y: 0.25, w: 0.4, h: 0.5 }]))) === 200);
      }
    }

    // ---- Live detection (optional) --------------------------------------
    console.log('\nLive detection — Claude vision scan');
    if (!process.env.ANTHROPIC_API_KEY) {
      skip('vision scan on the test image', 'ANTHROPIC_API_KEY not set');
    } else {
      const det = await detectIdentifyingMarks({ imageBase64: testPng().toString('base64'), mediaType: 'image/png', photoType: 'front' });
      check('detection returns a well-formed record', ['done', 'failed'].includes(det.status) && Array.isArray(det.suggested), det);
      if (det.status === 'done') check(`detection ran on the configured model (${getDetectionModel()})`, det.model === getDetectionModel(), det.model);
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
    const cfgForDb = live ?? FAKE;
    const uploads = fakeUploads(ownerUser.sellerId, cfgForDb.apiSecret).map((p, i) => (i === 0
      ? { ...p, blur_regions: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.1, label: 'stencil' }] as BlurRegion[],
          detection: { status: 'done' as const, suggested: [{ x: 0.1, y: 0.1, w: 0.2, h: 0.1 }], model: 'claude-opus-5', note: null } }
      : p));
    const verified = verifyUploadedPhotos(uploads, ownerUser.sellerId, cfgForDb);
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

    // ---- 0036 / 0037 applied? -------------------------------------------
    const { error: schemaErr36 } = await db.from('listing_photos').select('public_id').limit(1);
    const { error: schemaErr37 } = await db.from('listing_photos').select('blur_regions').limit(1);
    const migrated36 = !schemaErr36;
    const migrated37 = !schemaErr37;
    const { data: minRow } = await db.from('pricing_engine_settings').select('value').eq('key', 'min_photos_per_listing').single();
    const minPhotos = Number(minRow?.value ?? 8);

    console.log('\nsubmit_listing() with Cloudinary photos');
    let listingId = '';
    if (!migrated36) {
      skip('all schema checks', '0036 not applied yet (listing_photos.public_id missing)');
      const legacy = rows.map(({ url, photo_type, position }) => ({ url, photo_type, position }));
      const r = await submit(basePayload(legacy));
      if (!r.ok) throw new Error(`legacy submission failed: ${JSON.stringify(r)}`);
      listingId = r.listing_id;
    } else {
      check('min_photos_per_listing flipped to 8 (the 0031 launch blocker)', minPhotos === 8, minPhotos);
      const r1 = await submit(basePayload(rows));
      check('8 verified photos accepted', r1.ok === true, r1);
      listingId = r1.listing_id;
      const cols = 'url, public_id, cloudinary_version, format, width, height, bytes, photo_type, position, moderation_status' + (migrated37 ? ', blur_regions, detection' : '');
      const { data: stored } = await db.from('listing_photos').select(cols).eq('listing_id', listingId).order('position');
      const s0 = (stored ?? [])[0] as Record<string, any> | undefined;
      check('8 rows stored', stored?.length === 8, stored?.length);
      check('Cloudinary identity columns stored',
        s0?.public_id === rows[0].public_id && Number(s0?.cloudinary_version) === rows[0].version
          && s0?.format === 'jpg' && s0?.width === 1600 && s0?.bytes === rows[0].bytes, s0);
      check('stored url is a SIGNED authenticated URL', typeof s0?.url === 'string' && s0.url.includes('/image/authenticated/s--'), s0?.url);
      check('stored url carries the watermark transform', typeof s0?.url === 'string' && s0.url.includes(WATERMARK_TRANSFORM), s0?.url);
      check('stored url carries the blur region', typeof s0?.url === 'string' && s0.url.includes('e_blur_region:'), s0?.url);
      check('cover is position 0 of the client order', s0?.position === 0 && s0?.public_id === rows[0].public_id);
      check('photos start pending moderation', (stored ?? []).every((p: any) => p.moderation_status === 'pending'));
      if (!migrated37) {
        skip('blur_regions / detection columns', '0037 not applied yet (listing_photos.blur_regions missing) — paste supabase/migrations/0037_listing_photo_blur_regions.sql into the SQL editor and rerun');
      } else {
        check('blur_regions stored', Array.isArray(s0?.blur_regions) && s0.blur_regions.length === 1 && s0.blur_regions[0].label === 'stencil', s0?.blur_regions);
        check('detection record stored', s0?.detection?.status === 'done' && s0?.detection?.suggested?.length === 1, s0?.detection);
        const s1 = (stored ?? [])[1] as Record<string, any>;
        check('photo without regions stores [] and an explicit skipped detection record',
          Array.isArray(s1?.blur_regions) && s1.blur_regions.length === 0 && s1?.detection?.status === 'skipped' && s1?.detection?.suggested?.length === 0, s1);
      }

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

    // ---- Admin review: clean original beside the buyer version ----------
    console.log('\nAdmin review — signed original beside the buyer URL');
    if (!migrated37) {
      skip('getListingPhotosForReview', '0037 not applied');
    } else {
      const review = await getListingPhotosForReview(listingId);
      check('review returns the listing and its photos', !!review && review.photos.length === 8, review?.photos.length);
      const first = review?.photos[0];
      check('review photo has a signed clean original URL',
        !!first?.original_url && first.original_url.includes('/image/authenticated/s--') && !first.original_url.includes('l_text'), first?.original_url);
      check('review photo buyer URL is the stored (blurred + watermarked) URL', first?.buyer_url === rows[0].url);
      check('original and buyer URLs differ', first?.original_url !== first?.buyer_url);
      check('review carries blur regions + detection', first?.blur_regions.length === 1 && first?.detection.status === 'done', first);
      const unknown = await getListingPhotosForReview('00000000-0000-4000-8000-000000000000');
      check('unknown listing -> null', unknown === null);
      // The public read paths must never expose an original URL
      const { data: pubCols } = await db.from('listing_photos').select('url').eq('listing_id', listingId);
      check('no stored url is a clean original (every one carries the watermark transform)',
        (pubCols ?? []).every((p) => typeof p.url === 'string' && p.url.includes('l_text')), pubCols);
    }

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
    if (migrated36) check('browse card cover is watermarked + signed', !!hit?.photo_url?.includes('avauction.com') && !!hit?.photo_url?.includes('/image/authenticated/s--'), hit?.photo_url);

    // ---- Live cleanup ---------------------------------------------------
    if (live && liveIdent) {
      const result = await destroyAsset(live, liveIdent.public_id);
      check('signed destroy (type=authenticated) removes the asset', result === 'ok', result);
      // CDN invalidation is async, so ask the Admin API rather than the CDN
      check('destroyed asset is gone from the account (Admin API 404)', !(await assetExists(live, liveIdent.public_id)));
    }
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
