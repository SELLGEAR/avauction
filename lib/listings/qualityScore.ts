// Listing quality score, 0-100. ADMIN-ONLY: stored in listing_admin_meta,
// never returned to sellers or shown publicly. Deterministic so admin can
// compare listings fairly; the breakdown explains every point.

import type { QcAnswers } from "./gradeFromQc";

export interface PhotoInput {
  url: string;
  photo_type?: string;
}

export interface QualityInput {
  photos: PhotoInput[];
  qc: QcAnswers;
  description?: string | null;
  knownIssues: string;
  serialNumbers: string[];
  quantity: number;
  hoursOfUse?: number | null;
  gradeOverride: boolean;
}

export interface QualityResult {
  score: number;
  breakdown: Record<string, number>;
}

// Key guided shots that earn coverage points beyond the raw count
const BONUS_PHOTO_TYPES = ["front", "back", "powered_on", "serial_label", "flight_case"];

export function qualityScore(input: QualityInput): QualityResult {
  const b: Record<string, number> = {};

  // Photos — up to 30: 20 for meeting the 8-photo minimum (pro-rated
  // below it for draft feedback), +2 per key guided shot type present
  const photoBase = Math.min(input.photos.length, 8) / 8 * 20;
  const types = new Set(input.photos.map((p) => p.photo_type));
  const coverage = BONUS_PHOTO_TYPES.filter((t) => types.has(t)).length * 2;
  b.photos = Math.round(photoBase + coverage);

  // QC completeness — up to 20: serial confirmed (8), issue description
  // present when issues declared (6), service description when serviced (6)
  let qcPts = input.qc.serial_confirmed ? 8 : 0;
  qcPts += !input.qc.known_issues || (input.qc.known_issues_description ?? "").trim().length > 0 ? 6 : 0;
  qcPts += !input.qc.serviced || (input.qc.service_description ?? "").trim().length > 0 ? 6 : 0;
  b.qc_completeness = qcPts;

  // Description depth — up to 15
  const descLen = (input.description ?? "").trim().length;
  b.description = descLen >= 200 ? 15 : descLen >= 80 ? 10 : descLen > 0 ? 5 : 0;

  // Serial numbers vs quantity — up to 10
  const serialRatio = input.quantity > 0
    ? Math.min(input.serialNumbers.length / input.quantity, 1)
    : 0;
  b.serial_numbers = Math.round(serialRatio * 10);

  // Hours of use disclosed — 10
  b.hours_of_use = input.hoursOfUse != null ? 10 : 0;

  // Seller accepted the QC-suggested grade — 10
  b.grade_agreement = input.gradeOverride ? 0 : 10;

  // Known-issues field has real content, not a token entry — 5
  const ki = input.knownIssues.trim().toLowerCase();
  b.known_issues_detail = ki.length > 10 && ki !== "none disclosed" ? 5 : 0;

  const score = Math.max(0, Math.min(100, Object.values(b).reduce((a, v) => a + v, 0)));
  return { score, breakdown: b };
}
