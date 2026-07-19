// Suggested condition grade from the QC checklist answers, per the
// grading system: the platform calculates, the seller confirms or adjusts
// (adjustments set grade_override, flagged for admin review).
//
//   D — Parts/Repair: does not power on / produce full output
//   C — Functional with Disclosures: works but known issues disclosed,
//       or significant cosmetic damage
//   B — Rental Ready: fully operational; minor cosmetic wear, missing
//       non-essential pieces, or no flight case
//   A — Tour Ready: powers on, all components, flight case, clean, no
//       known issues

export type Grade = "A" | "B" | "C" | "D";
export type CosmeticDamage = "none" | "minor" | "significant";

export interface QcAnswers {
  powers_on: boolean;
  all_components: boolean;
  flight_case: boolean;
  cosmetic_damage: CosmeticDamage;
  known_issues: boolean;
  known_issues_description?: string | null;
  serviced: boolean;
  service_description?: string | null;
  serial_confirmed?: boolean;
}

export function gradeFromQc(qc: QcAnswers): Grade {
  if (!qc.powers_on) return "D";
  if (qc.known_issues) return "C";
  if (qc.cosmetic_damage === "significant") return "C";
  if (qc.cosmetic_damage === "minor" || !qc.all_components || !qc.flight_case) return "B";
  return "A";
}
