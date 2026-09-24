// Cloudinary server helpers — SIGNED uploads only, no unsigned presets.
// Server-only: reads CLOUDINARY_API_SECRET. Never import from a client
// component.
//
// Flow: the browser asks POST /api/photos for a signature -> uploads the
// file straight to api.cloudinary.com with it (the file never transits
// our server) -> hands the upload response back at submit time -> the
// submit route calls verifyUploadedPhotos(), which checks Cloudinary's
// RESPONSE signature (sha1 of public_id + version + secret). That proves
// each public_id really was created in our account, without an Admin API
// round-trip per photo.
//
// Namespacing: every public_id is listings/<seller_id>/<uuid>, chosen by
// the server and locked in the signed params — a seller can neither name
// an asset nor attach another seller's upload.

import { createHash, randomUUID } from "node:crypto";
import {
  ALLOWED_FORMATS,
  MAX_PHOTOS,
  PHOTO_TYPE_VALUES,
  WATERMARK_TRANSFORM,
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

// Cloudinary's signing rule: sort params by key, join as k=v&k=v, append
// the secret, SHA-1 hex. Arrays are comma-joined. file/api_key/
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

const PUBLIC_ID_RE =
  /^listings\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export interface SignedUploadParams {
  cloud_name: string;
  api_key: string;
  upload_url: string;
  timestamp: number;
  signature: string;
  public_id: string;
  allowed_formats: string;
  moderation?: string;
}

// One signature per file. Each carries a fresh server-chosen public_id.
export function signedUploadParams(cfg: CloudinaryConfig, sellerId: string): SignedUploadParams {
  const timestamp = Math.floor(Date.now() / 1000);
  const public_id = publicIdPrefix(sellerId) + randomUUID();
  const allowed_formats = ALLOWED_FORMATS.join(",");
  const params: Record<string, string | number> = { timestamp, public_id, allowed_formats };
  if (cfg.moderation) params.moderation = cfg.moderation;
  const signature = signParams(params, cfg.apiSecret);
  return {
    cloud_name: cfg.cloudName,
    api_key: cfg.apiKey,
    upload_url: `https://api.cloudinary.com/v1_1/${cfg.cloudName}/image/upload`,
    timestamp,
    signature,
    public_id,
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

// Delivery URL for a stored asset with a transformation applied — the
// original stays as uploaded; `transform` is computed on the CDN edge.
export function deliveryUrl(
  cloudName: string,
  publicId: string,
  version: number,
  format: string,
  transform: string
): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/v${version}/${publicId}.${format}`;
}

export function watermarkedUrl(cloudName: string, publicId: string, version: number, format: string): string {
  return deliveryUrl(cloudName, publicId, version, format, WATERMARK_TRANSFORM);
}

export function originalUrl(cloudName: string, publicId: string, version: number, format: string): string {
  return `https://res.cloudinary.com/${cloudName}/image/upload/v${version}/${publicId}.${format}`;
}

// Row shape handed to submit_listing() — url is the watermarked delivery URL
export interface VerifiedPhotoRow {
  url: string;
  public_id: string;
  version: number;
  format: string;
  width: number;
  height: number;
  bytes: number;
  photo_type: PhotoType;
  position: number;
}

export type VerifyResult =
  | { ok: true; photos: VerifiedPhotoRow[] }
  | { ok: false; error: "invalid_photos" | "duplicate_photo" | "too_many_photos"; detail: string };

const isPosInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

// Validate + verify the client's photo array for one seller. Rejects
// anything not provably uploaded to OUR account under THIS seller's
// prefix. Positions are re-indexed from the client's order so the cover
// (position 0) is exactly what the seller chose.
export function verifyUploadedPhotos(
  raw: unknown,
  sellerId: string,
  cfg: Pick<CloudinaryConfig, "cloudName" | "apiSecret">
): VerifyResult {
  if (!Array.isArray(raw)) return { ok: false, error: "invalid_photos", detail: "photos must be an array" };
  if (raw.length > MAX_PHOTOS) {
    return { ok: false, error: "too_many_photos", detail: `max ${MAX_PHOTOS}` };
  }
  const prefix = publicIdPrefix(sellerId);
  const seen = new Set<string>();
  const rows: VerifiedPhotoRow[] = [];

  for (let i = 0; i < raw.length; i++) {
    const p = raw[i] as Partial<UploadedPhoto> | null;
    const at = `photos[${i}]`;
    if (!p || typeof p !== "object") return { ok: false, error: "invalid_photos", detail: `${at}: not an object` };
    if (typeof p.public_id !== "string" || !PUBLIC_ID_RE.test(p.public_id) || !p.public_id.startsWith(prefix)) {
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

    const format = p.format.toLowerCase();
    rows.push({
      url: watermarkedUrl(cfg.cloudName, p.public_id, p.version, format),
      public_id: p.public_id,
      version: p.version,
      format,
      width: p.width,
      height: p.height,
      bytes: p.bytes,
      photo_type: p.photo_type as PhotoType,
      position: i,
    });
  }
  return { ok: true, photos: rows };
}

// Signed destroy — used when a seller removes a photo before submitting.
// Returns Cloudinary's result string ("ok" | "not found").
export async function destroyAsset(cfg: CloudinaryConfig, publicId: string): Promise<string> {
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = { public_id: publicId, timestamp, invalidate: "true" };
  const signature = signParams(params, cfg.apiSecret);
  const body = new URLSearchParams({
    public_id: publicId,
    timestamp: String(timestamp),
    invalidate: "true",
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
