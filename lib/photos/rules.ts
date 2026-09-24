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

// Insert a transformation into a Cloudinary secure_url
// (https://res.cloudinary.com/<cloud>/image/upload/v123/id.jpg).
export function withTransformation(secureUrl: string, transform: string): string {
  const marker = "/image/upload/";
  const i = secureUrl.indexOf(marker);
  if (i === -1) return secureUrl;
  return secureUrl.slice(0, i + marker.length) + transform + "/" + secureUrl.slice(i + marker.length);
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
}

export function missingRequiredTypes(photos: { photo_type: string }[]): string[] {
  const present = new Set(photos.map((p) => p.photo_type));
  return REQUIRED_PHOTO_TYPES.filter((t) => !present.has(t));
}
