// Photo rules shared by the uploader (browser) and the submit path
// (server). No Node imports — this file must stay client-safe.
//
// The DB is the source of truth for the minimum and the required shot
// types (pricing_engine_settings: min_photos_per_listing,
// required_photo_types — migration 0036). The constants here mirror the
// business rule for display and pre-flight gating; submit_listing()
// enforces it regardless of what the client sends.

export const MIN_PHOTOS = 8;
export const MAX_PHOTOS = 24;

// CLAUDE.md: powered-on test shot required for electronic gear, serial
// number label required. Enforced server-side; the uploader gates
// "Continue" on them too.
export const REQUIRED_PHOTO_TYPES = ["powered_on", "serial_label"] as const;

// Mirrors the listing_photos.photo_type check constraint (0007), minus
// packaging_preship (a transaction-stage shot, not a listing shot).
export const PHOTO_TYPES = [
  { value: "front", label: "Front", guide: "Straight on, whole unit in frame" },
  { value: "back", label: "Back", guide: "Connections and panel visible" },
  { value: "left_side", label: "Left side", guide: "" },
  { value: "right_side", label: "Right side", guide: "" },
  { value: "powered_on", label: "Powered on", guide: "Running and producing output — required" },
  { value: "serial_label", label: "Serial label", guide: "Legible serial number plate — required" },
  { value: "damage_closeup", label: "Damage close-up", guide: "Any cosmetic damage you disclosed" },
  { value: "flight_case", label: "Flight case", guide: "If included" },
  { value: "other", label: "Other", guide: "" },
] as const;

export type PhotoType = (typeof PHOTO_TYPES)[number]["value"];

export const PHOTO_TYPE_VALUES: readonly string[] = PHOTO_TYPES.map((t) => t.value);

// Suggested order for auto-assigning a type to each newly added photo:
// the guided shot sequence from the listing flow spec.
export const GUIDED_SHOT_ORDER: PhotoType[] = [
  "front", "back", "left_side", "right_side", "powered_on", "serial_label",
  "damage_closeup", "flight_case",
];

// Cloudinary's per-image ceiling on the free/plus plans is 10 MB; phone
// camera JPEGs are 2–6 MB, so this never bites a legitimate seller.
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

// Browser MIME types accepted at the drop zone. HEIC/HEIF are what iPhones
// produce by default; Cloudinary converts them on delivery via f_auto.
export const ACCEPTED_MIME_TYPES: readonly string[] = [
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
];

// Cloudinary formats allowed in the SIGNED upload params — Cloudinary
// rejects anything else server-side, so a renamed .exe never becomes an
// asset even if the browser check is bypassed.
export const ALLOWED_FORMATS: readonly string[] = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

// Extension fallback for browsers that report an empty MIME type for HEIC
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;

export type FileRejection = "wrong_type" | "too_large" | "empty";

export function validateFile(file: { name: string; type: string; size: number }): FileRejection | null {
  const typeOk =
    ACCEPTED_MIME_TYPES.includes(file.type) ||
    (file.type === "" && ACCEPTED_EXTENSIONS.test(file.name));
  if (!typeOk) return "wrong_type";
  if (file.size <= 0) return "empty";
  if (file.size > MAX_PHOTO_BYTES) return "too_large";
  return null;
}

export const REJECTION_MESSAGES: Record<FileRejection, string> = {
  wrong_type: "Only JPG, PNG, WEBP or HEIC photos.",
  too_large: `Over ${Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB — resize or re-shoot.`,
  empty: "That file is empty.",
};

// Watermark: applied on DELIVERY as a Cloudinary transformation — the
// stored original is untouched. c_limit keeps aspect ratio and caps the
// long edge; q_auto/f_auto do Cloudinary's compression + format work.
// The text layer is Cloudinary's l_text syntax (font_size_style:text).
export const WATERMARK_TRANSFORM =
  "c_limit,w_1600,h_1600,q_auto,f_auto/l_text:Arial_40_bold:avauction.com,co_white,o_70,g_south_east,x_24,y_24";

// Uploader tile thumbnails — small, watermarked the same way so the seller
// sees exactly what buyers will
export const THUMB_TRANSFORM =
  "c_fill,w_400,h_300,q_auto,f_auto/l_text:Arial_18_bold:avauction.com,co_white,o_70,g_south_east,x_10,y_10";

// Insert a transformation into a PUBLIC (type=upload) Cloudinary URL.
// Listing photos are type=authenticated and need a server signature, so
// the uploader gets its preview URLs from POST /api/photos/preview instead;
// this stays for legacy/public assets only.
export function withTransformation(secureUrl: string, transform: string): string {
  const marker = "/image/upload/";
  const i = secureUrl.indexOf(marker);
  if (i === -1) return secureUrl;
  return secureUrl.slice(0, i + marker.length) + transform + "/" + secureUrl.slice(i + marker.length);
}

// ---- Seller-identity blur (anonymity layer) -------------------------------
//
// A blur region is a rectangle in NORMALIZED image coordinates (0..1 of
// the original width/height) so one record serves every derived size.
// Regions come from Claude vision as suggestions and from the seller's
// own edits; the final set is stored per photo and applied on DELIVERY as
// Cloudinary e_blur_region transformations (lib/photos/cloudinary.ts) —
// the original is never modified.
export interface BlurRegion {
  x: number;
  y: number;
  w: number;
  h: number;
  // Free text from detection ("asset tag", "rental company stencil") or
  // "manual" for seller-drawn boxes. Display only.
  label?: string;
}

export const MAX_BLUR_REGIONS = 12;
// Smaller than this and the box is a stray click, not a mark
export const MIN_BLUR_REGION_SIZE = 0.005;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const round4 = (v: number) => Math.round(v * 10000) / 10000;

// Validate + clamp a client-supplied region list. Returns null when the
// input isn't a list of numeric rectangles; drops degenerate boxes.
export function normalizeBlurRegions(raw: unknown): BlurRegion[] | null {
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return null;
  const out: BlurRegion[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") return null;
    const { x, y, w, h, label } = r as Record<string, unknown>;
    if (![x, y, w, h].every((v) => typeof v === "number" && Number.isFinite(v))) return null;
    const nx = clamp01(x as number);
    const ny = clamp01(y as number);
    const nw = clamp01(Math.min(w as number, 1 - nx));
    const nh = clamp01(Math.min(h as number, 1 - ny));
    if (nw < MIN_BLUR_REGION_SIZE || nh < MIN_BLUR_REGION_SIZE) continue;
    out.push({
      x: round4(nx), y: round4(ny), w: round4(nw), h: round4(nh),
      ...(typeof label === "string" && label.trim() !== "" ? { label: label.trim().slice(0, 60) } : {}),
    });
  }
  return out;
}

// What happened when the photo was scanned for identifying marks. Stored
// beside the seller's final regions so admin can compare suggested vs
// accepted. "unavailable" = no API key configured; "failed" = the call
// errored or timed out; either way the seller continues manually.
export type DetectionStatus = "done" | "failed" | "unavailable" | "skipped";

export interface DetectionRecord {
  status: DetectionStatus;
  suggested: BlurRegion[];
  model: string | null;
  note: string | null;
}

export const DETECTION_STATUSES: readonly DetectionStatus[] = ["done", "failed", "unavailable", "skipped"];

export function normalizeDetection(raw: unknown): DetectionRecord {
  const fallback: DetectionRecord = { status: "skipped", suggested: [], model: null, note: null };
  if (!raw || typeof raw !== "object") return fallback;
  const r = raw as Record<string, unknown>;
  const status = DETECTION_STATUSES.includes(r.status as DetectionStatus) ? (r.status as DetectionStatus) : "skipped";
  const suggested = normalizeBlurRegions(r.suggested) ?? [];
  return {
    status,
    suggested: suggested.slice(0, MAX_BLUR_REGIONS),
    model: typeof r.model === "string" ? r.model.slice(0, 60) : null,
    note: typeof r.note === "string" ? r.note.slice(0, 200) : null,
  };
}

// What the client hands back per photo after a successful upload — the
// Cloudinary response fields the server verifies (public_id + version +
// signature) plus the ones it records.
export interface UploadedPhoto {
  public_id: string;
  version: number;
  signature: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  photo_type: PhotoType;
  position: number;
  blur_regions?: BlurRegion[];
  detection?: DetectionRecord;
}

export function missingRequiredTypes(photos: { photo_type: string }[]): string[] {
  const present = new Set(photos.map((p) => p.photo_type));
  return REQUIRED_PHOTO_TYPES.filter((t) => !present.has(t));
}
