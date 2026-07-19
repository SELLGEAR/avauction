import { getSupabaseClient } from './supabaseClient.js';

export type MatchDecision = 'matched' | 'queued' | 'queued_duplicate' | 'rejected';

export interface MatchResult {
  decision: MatchDecision;
  master_equipment_id?: string;
  pending_id?: string;
  best_match_id?: string;
  score: number;
}

// Entry point for the phase-B pricing scrapers: resolve a scraped listing
// to a master_equipment record, or queue/discard it per the data quality
// rules. Only store a market_prices row when decision === 'matched'.
export async function matchOrQueue(input: {
  source: string;
  rawTitle: string;
  manufacturerHint?: string;
  modelHint?: string;
  listingUrl?: string;
}): Promise<MatchResult> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('match_or_queue', {
    p_source: input.source,
    p_raw_title: input.rawTitle,
    p_manufacturer_hint: input.manufacturerHint ?? null,
    p_model_hint: input.modelHint ?? null,
    p_listing_url: input.listingUrl ?? null,
  });
  if (error) throw new Error(`match_or_queue failed: ${error.message}`);
  return data as MatchResult;
}
