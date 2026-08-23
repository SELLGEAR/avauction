// Suggested condition grade from the QC checklist answers, per the decided
// grading system (final, July 28, 2026): A Excellent / B Very Good /
// C Good / D Fair, plus Poor / For Parts as a separate state OUTSIDE the
// A–D scale. The platform calculates, the seller confirms or adjusts
// (adjustments set grade_override, flagged for admin review).
//
//   Poor — not fully operational (doesn't power on / produce full output).
//          NOT a priced grade: no gauge, never feeds the median. Submission
//          is blocked (form + server guard) until for-parts listings ship —
//          a broken unit stored as D would poison D-grade comps in the
//          pricing engine.
//   D — Fair: functional but with disclosed known issues
//   C — Good: works properly, significant cosmetic wear, essentials intact
//   B — Very Good: minor cosmetic marks or missing non-essential pieces,
//       no effect on performance
//   A — Excellent: powers on, complete, clean, no known issues
//
// Flight case is deliberately NOT a grade input — it's a value add-on
// recorded separately (listings.flight_case_included), not unit condition.

export type Grade = "A" | "B" | "C" | "D";
export type SuggestedGrade = Grade | "poor";
export type CosmeticDamage = "none" | "minor" | "significant";

export const GRADE_NAMES: Record<Grade, string> = {
  A: "Excellent",
  B: "Very Good",
  C: "Good",
  D: "Fair",
};

export const POOR_NAME = "Poor / For Parts";

// Buyer-facing definitions — decided market-standard language, do not
// reword into invented terms (see CLAUDE.md, Grading System).
export const GRADE_DEFINITIONS: Record<Grade, string> = {
  A: "Looks and performs like new. Tested to full manufacturer spec, only minor signs of use. Ready for high-profile touring and broadcast.",
  B: "Fully functional, minor cosmetic marks such as light scuffs or rack rash. No effect on performance.",
  C: "Works properly with visible cosmetic wear from regular professional use. Everything essential is intact.",
  D: "Functional but with noticeable wear or minor known issues, disclosed in the listing. Priced accordingly.",
};

export const POOR_DEFINITION =
  "Not fully operational, or sold for parts, repair, or salvage. Sold strictly as-is, no returns. Inspect before bidding.";

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

export function gradeFromQc(qc: QcAnswers): SuggestedGrade {
  if (!qc.powers_on) return "poor";
  if (qc.known_issues) return "D";
  if (qc.cosmetic_damage === "significant") return "C";
  if (qc.cosmetic_damage === "minor" || !qc.all_components) return "B";
  return "A";
}
