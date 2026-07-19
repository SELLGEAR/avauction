// Wrapper for the pricing engine's suggest_price() function. Consumed by
// the seller-app gauge API later — that route must return ranges and
// confidence ONLY, rate limited (moat rule: never raw records, counts, or
// source breakdowns).
//
// Relative imports so simulation scripts can use this outside Next.js.

import { createServiceRoleClient } from "../supabase/server";

export type PriceConfidence = "none" | "low" | "medium" | "high";

export interface PriceSuggestion {
  has_data: boolean;
  suggested_low?: number;
  suggested_high?: number;
  median?: number;
  confidence: PriceConfidence;
  model_records: number;
  effective_weight?: number;
  bootstrap_used?: boolean;
  grade?: string;
  error?: string;
}

export async function suggestPrice(
  masterEquipmentId: string,
  conditionGrade: "A" | "B" | "C" | "D" = "B"
): Promise<PriceSuggestion> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("suggest_price", {
    p_master_equipment_id: masterEquipmentId,
    p_condition_grade: conditionGrade,
  });
  if (error) throw new Error(`suggest_price failed: ${error.message}`);
  return data as PriceSuggestion;
}
