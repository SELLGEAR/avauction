// Cloudinary server helpers — SIGNED uploads, AUTHENTICATED delivery.
// Server-only: reads CLOUDINARY_API_SECRET. Never import from a client
// component.
//
// Upload: the browser asks POST /api/photos for a signature -> uploads the
// file straight to api.cloudinary.com with it (the file never transits
// our server) -> hands the upload response back at submit time -> the
// submit route calls verifyUploadedPhotos(), which checks Cloudinary's
// RESPONSE signature (sha1 of public_id + version + secret). That proves
// each public_id really was created in our account, without an Admin API
// round-trip per photo.
//
// Delivery: every photo is uploaded with type=authenticated, so NOTHING
// about it is publicly addressable — not the original, not any derived
// version — unless the URL carries a delivery signature over the exact
// transformation + public_id. Buyers get a signed URL for the
// blur+watermark transformation; stripping or editing the transformation
// invalidates the signature and Cloudinary returns 401. Clean originals
// are signed only inside admin routes (requireAdmin) — see originalUrl().
//
// Namespacing: every public_id is listings/<seller_id>/<uuid>, chosen by
// the server and locked in the signed params — a seller can neither name
// an asset nor attach another seller's upload.

import { createHash, randomUUID } from "node:crypto";
import {
  ALLOWED_FORMATS,
  MAX_BLUR_REGIONS,
  MAX_PHOTOS,
  PHOTO_TYPE_VALUES,
  THUMB_TRANSFORM,
  WATERMARK_TRANSFORM,
  normalizeBlurRegions,
  normalizeDetection,
  type BlurRegion,
  type DetectionRecord,
  type PhotoType,
  type UploadedPhoto,
} from "./rules";

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  // Optional add-on (CLAUDE.md moderation layer 1), e.g. "aws_rek". Only
  // sent when set — the upload fails if the add-on isn't enabled on the
  // account.
  moderation: string | null;
}

// Every listing photo is stored with this delivery type. Changing it would
// make previously stored signed URLs (which embed the type) stop working.
export const DELIVERY_TYPE = "authenticated";

// Accepts either the three discrete vars or the CLOUDINARY_URL form
// (cloudinary://<api_key>:<api_secret>@<cloud_name>) from the console.
export function getCloudinaryConfig(): CloudinaryConfig | null {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? "";
  let apiKey = process.env.CLOUDINARY_API_KEY ?? "";
  let apiSecret = process.env.CLOUDINARY_API_SECRET ?? "";
  const url = process.env.CLOUDINARY_URL;
  if ((!cloudName || !apiKey || !apiSecret) && url) {
    const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@([^/?]+)/);
    if (m) {
      apiKey ||= m[1];
      apiSecret ||= m[2];
      cloudName ||= m[3];
    }
  }
  if (!cloudName || !apiKey || !apiSecret) return null;
  const moderation = (process.env.CLOUDINARY_MODERATION ?? "").trim();
  return { cloudName, apiKey, apiSecret, moderation: moderation || null };
}

// Cloudinary's API signing rule: sort params by key, join as k=v&k=v,
// append the secret, SHA-1 hex. Arrays are comma-joined. file/api_key/
// resource_type/cloud_name are never part of the string.
export function signParams(params: Record<string, string | number>, apiSecret: string): string {
  const toSign = Object.keys(params)
    .filter((k) => params[k] !== "" && params[k] !== undefined && params[k] !== null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + apiSecret).digest("hex");
}

export function publicIdPrefix(sellerId: string): string {
  return `listings/${sellerId}/`;
}

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PUBLIC_ID_RE = new RegExp(`^listings/${UUID}/${UUID}$`);

export function isValidPublicId(publicId: string, sellerId?: string): boolean {
  if (!PUBLIC_ID_RE.test(publicId)) return false;
  return sellerId ? publicId.startsWith(publicIdPrefix(sellerId)) : true;
}

export interface SignedUploadParams {
  cloud_name: string;
  api_key: string;
  upload_url: string;
  timestamp: number;
  signature: string;
  public_id: string;
  type: string;
  allowed_formats: string;
  moderation?: string;
}

// One signature per file. Each carries a fresh server-chosen public_id and
// locks type=authenticated in — the browser cannot upload a public asset.
export function signedUploadParams(cfg: CloudinaryConfig, sellerId: string): SignedUploadParams {
  const timestamp = Math.floor(Date.now() / 1000);
  const public_id = publicIdPrefix(sellerId) + randomUUID();
  const allowed_formats = ALLOWED_FORMATS.join(",");
  const params: Record<string, string | number> = {
    timestamp, public_id, allowed_formats, type: DELIVERY_TYPE,
  };
  if (cfg.moderation) params.moderation = cfg.moderation;
  const signature = signParams(params, cfg.apiSecret);
  return {
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    upload_url: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    timestamp,
    signature,
    public_id,
    type: DELIVERY_TYPE,
    allowed_formats,
    ...(cfg.moderation ? { moderation: cfg.moderation } : {}),
  };
}

// Cloudinary signs every upload RESPONSE over exactly public_id + version.
export function verifyUploadSignature(
  publicId: string,
  version: number,
  signature: string,
  apiSecret: string
): boolean {
  const expected = createHash("sha1")
    .update(`public_id=${publicId}&version=${version}${apiSecret}`)
    .digest("hex");
  return expected === signature.toLowerCase();
}

// ---- Delivery URL signing ------------------------------------------------
//
// Cloudinary delivery signature (cloudinary_npm lib/utils/index.js):
//   to_sign  = [transformation, public_id.format].join('/')   (NO version)
//   sig      = 's--' + base64(sha1(to_sign + api_secret))[0..8]
//                      with '/' -> '_' and '+' -> '-'          + '--'
//   url      = https://res.cloudinary.com/<cloud>/image/<type>/<sig>/
//              <transformation>/v<version>/<public_id>.<format>
// Because the transformation is inside the signed string, a URL with the
// transformation removed or edited carries the wrong signature.

export function deliverySignature(transform: string, publicId: string, format: string, apiSecret: string): string {
  const toSign = [transform, `${publicId}.${format}`].filter((p) => p !== "").join("/");
  const digest = createHash("sha1").update(toSign + apiSecret).digest("base64");
  return `s--${digest.slice(0, 8).replace(/\//g, "_").replace(/\+/g, "-")}--`;
}

export function signedDeliveryUrl(
  cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">,
  publicId: string,
  version: number,
  format: string,
  transform: string
): string {
  const sig = deliverySignature(transform, publicId, format, cfg.apiSecret);
  const parts = [
    `https://res.cloudinary.com/${cfg.cloudName}/image/${DELIVERY_TYPE}`,
    sig,
    transform,
    `v${version}`,
    `${publicId}.${format}`,
  ].filter((p) => p !== "");
  return parts.join("/");
}

// Blur regions -> Cloudinary region effects, in ORIGINAL pixel coordinates
// (regions are stored normalized 0..1 so the same record works for every
// derived size). One chained component per region, applied before the
// resize + watermark so coordinates stay in original space.
export const BLUR_STRENGTH = 2000;

export function blurTransform(regions: BlurRegion[], width: number, height: number): string {
  return regions
    .map((r) => {
      const x = Math.max(0, Math.floor(r.x * width));
      const y = Math.max(0, Math.floor(r.y * height));
      const w = Math.max(1, Math.min(width - x, Math.ceil(r.w * width)));
      const h = Math.max(1, Math.min(height - y, Math.ceil(r.h * height)));
      return `e_blur_region:${BLUR_STRENGTH},x_${x},y_${y},w_${w},h_${h}`;
    })
    .join("/");
}

// The buyer-facing transformation: blur regions (if any) then watermark.
export function buyerTransform(regions: BlurRegion[], width: number, height: number, base = WATERMARK_TRANSFORM): string {
  const blur = blurTransform(regions, width, height);
  return blur ? `${blur}/${base}` : base;
}

export interface PhotoIdentity {
  public_id: string;
  version: number;
  format: string;
  width: number;
  height: number;
}

// Buyer delivery URL: blurred + watermarked, signed. This is what gets
// stored in listing_photos.url.
export function buyerUrl(cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">, p: PhotoIdentity, regions: BlurRegion[]): string {
  return signedDeliveryUrl(cfg, p.public_id, p.version, p.format, buyerTransform(regions, p.width, p.height));
}

// Seller-preview thumbnail: same blur + watermark at tile size.
export function thumbUrl(cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">, p: PhotoIdentity, regions: BlurRegion[]): string {
  return signedDeliveryUrl(cfg, p.public_id, p.version, p.format, buyerTransform(regions, p.width, p.height, THUMB_TRANSFORM));
}

// Editor view for drawing boxes: original pixels, capped long edge, NO
// blur and NO watermark so the seller can see what they're covering.
// Signed, so still not derivable from the buyer URL. Served only to the
// owning seller (namespace check in the route).
export const EDITOR_TRANSFORM = "c_limit,w_1400,h_1400,q_auto,f_auto";
export function editorUrl(cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">, p: PhotoIdentity): string {
  return signedDeliveryUrl(cfg, p.public_id, p.version, p.format, EDITOR_TRANSFORM);
}

// Clean original: ADMIN ONLY. The only callers are requireAdmin routes and
// the server-side detection fetch. Never store or return this to sellers,
// buyers, or public responses.
export function originalUrl(cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">, p: Pick<PhotoIdentity, "public_id" | "version" | "format">): string {
  return signedDeliveryUrl(cfg, p.public_id, p.version, p.format, "");
}

// Downscaled clean copy for the vision model (Claude downsamples past
// ~1568px anyway). Signed; used server-side only.
export const DETECTION_TRANSFORM = "c_limit,w_1568,h_1568,q_auto:good,f_jpg";
export function detectionUrl(cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">, p: Pick<PhotoIdentity, "public_id" | "version" | "format">): string {
  return signedDeliveryUrl(cfg, p.public_id, p.version, p.format, DETECTION_TRANSFORM);
}

// Kept for callers that only need the watermark on a known-clean photo
export function watermarkedUrl(cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">, publicId: string, version: number, format: string): string {
  return signedDeliveryUrl(cfg, publicId, version, format, WATERMARK_TRANSFORM);
}

// Row shape handed to submit_listing() — url is the buyer delivery URL
export interface VerifiedPhotoRow extends PhotoIdentity {
  url: string;
  bytes: number;
  photo_type: PhotoType;
  position: number;
  blur_regions: BlurRegion[];
  detection: DetectionRecord;
}

export type VerifyResult =
  | { ok: true; photos: VerifiedPhotoRow[] }
  | {
      ok: false;
      error: "invalid_photos" | "duplicate_photo" | "too_many_photos" | "invalid_blur_regions";
      detail: string;
    };

const isPosInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

// Validate + verify the client's photo array for one seller. Rejects
// anything not provably uploaded to OUR account under THIS seller's
// prefix. Positions are re-indexed from the client's order so the cover
// (position 0) is exactly what the seller chose. Blur regions are
// normalized and capped; the stored url bakes them in.
export function verifyUploadedPhotos(
  raw: unknown,
  sellerId: string,
  cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">
): VerifyResult {
  if (!Array.isArray(raw)) return { ok: false, error: "invalid_photos", detail: "photos must be an array" };
  if (raw.length > MAX_PHOTOS) {
    return { ok: false, error: "too_many_photos", detail: `max ${MAX_PHOTOS}` };
  }
  const seen = new Set<string>();
  const rows: VerifiedPhotoRow[] = [];

  for (let i = 0; i < raw.length; i++) {
    const p = raw[i] as Partial<UploadedPhoto> | null;
    const at = `photos[${i}]`;
    if (!p || typeof p !== "object") return { ok: false, error: "invalid_photos", detail: `${at}: not an object` };
    if (typeof p.public_id !== "string" || !isValidPublicId(p.public_id, sellerId)) {
      return { ok: false, error: "invalid_photos", detail: `${at}: public_id not in this seller's namespace` };
    }
    if (!isPosInt(p.version)) return { ok: false, error: "invalid_photos", detail: `${at}: version` };
    if (typeof p.signature !== "string" || !/^[0-9a-f]{40}$/i.test(p.signature)) {
      return { ok: false, error: "invalid_photos", detail: `${at}: signature` };
    }
    if (!verifyUploadSignature(p.public_id, p.version, p.signature, cfg.apiSecret)) {
      return { ok: false, error: "invalid_photos", detail: `${at}: upload signature does not verify` };
    }
    if (typeof p.format !== "string" || !ALLOWED_FORMATS.includes(p.format.toLowerCase())) {
      return { ok: false, error: "invalid_photos", detail: `${at}: format` };
    }
    if (!isPosInt(p.width) || !isPosInt(p.height) || !isPosInt(p.bytes)) {
      return { ok: false, error: "invalid_photos", detail: `${at}: dimensions/bytes` };
    }
    if (typeof p.photo_type !== "string" || !PHOTO_TYPE_VALUES.includes(p.photo_type)) {
      return { ok: false, error: "invalid_photos", detail: `${at}: photo_type` };
    }
    if (seen.has(p.public_id)) return { ok: false, error: "duplicate_photo", detail: p.public_id };
    seen.add(p.public_id);

    const regions = normalizeBlurRegions(p.blur_regions);
    if (!regions) return { ok: false, error: "invalid_blur_regions", detail: `${at}: blur_regions` };
    if (regions.length > MAX_BLUR_REGIONS) {
      return { ok: false, error: "invalid_blur_regions", detail: `${at}: more than ${MAX_BLUR_REGIONS} regions` };
    }
    const detection = normalizeDetection(p.detection);

    const format = p.format.toLowerCase();
    const identity: PhotoIdentity = {
      public_id: p.public_id, version: p.version, format, width: p.width, height: p.height,
    };
    rows.push({
      ...identity,
      url: buyerUrl(cfg, identity, regions),
      bytes: p.bytes,
      photo_type: p.photo_type as PhotoType,
      position: i,
      blur_regions: regions,
      detection,
    });
  }
  return { ok: true, photos: rows };
}

// Signed destroy — used when a seller removes a photo before submitting.
// Returns Cloudinary's result string ("ok" | "not found").
export async function destroyAsset(cfg: CloudinaryConfig, publicId: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    public_id: publicId, timestamp, invalidate: "true", type: DELIVERY_TYPE,
  };
  const signature = signParams(params, cfg.apiSecret);
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    invalidate: "true",
    type: DELIVERY_TYPE,
    api_key: cfg.apiKey,
    signature,
  });
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/destroy`, {
    method: "POST",
    body,
  });
  const json = (await res.json().catch(() => ({}))) as { result?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(json.error?.message ?? `cloudinary destroy ${res.status}`);
  return json.result ?? "unknown";
}

// Admin API existence check (basic auth with the API key pair). Used by
// the harness to confirm a destroy without waiting on CDN invalidation,
// which is asynchronous and can serve a cached copy for minutes.
export async function assetExists(cfg: CloudinaryConfig, publicId: string): Promise<boolean> {
  const auth = Buffer.from(`${cfg.apiKey}:${cfg.apiSecret}`).toString("base64");
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cfg.cloudName}/resources/image/${DELIVERY_TYPE}/${encodeURIComponent(publicId).replace(/%2F/g, "/")}`,
    { headers: { Authorization: `Basic ${auth}` } }
  );
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`cloudinary admin api ${res.status}`);
  return true;
}
