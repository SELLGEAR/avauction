import { getSupabaseClient } from './supabaseClient.js';
import type { MasterEquipmentRecord } from './types.js';

export interface UpsertOptions {
  /** Column (or comma-separated columns) the ON CONFLICT target matches against. */
  onConflict: string;
  /**
   * true  -> ON CONFLICT DO NOTHING. Use for cross-source seeding, where an
   *          existing row (from any source) must be left untouched rather
   *          than overwritten by a lower-confidence rescrape.
   * false -> ON CONFLICT DO UPDATE, refreshing every field on `record`. Use
   *          only when re-running the *same* source against its own
   *          previously-upserted row is the intended refresh.
   */
  ignoreDuplicates: boolean;
}

/**
 * Returns the row id when a row was actually inserted (or updated), and null
 * when ignoreDuplicates:true hit a conflict and DID NOTHING — the caller
 * uses that null to distinguish "new product" from "already known" for
 * summary counts and scrape-log outcomes.
 */
export async function upsertMasterEquipment(
  record: MasterEquipmentRecord,
  opts: UpsertOptions
): Promise<{ id: string } | null> {
  const db = getSupabaseClient();

  const { data, error } = await db
    .from('master_equipment')
    .upsert(record, { onConflict: opts.onConflict, ignoreDuplicates: opts.ignoreDuplicates })
    .select('id')
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase upsert failed for ${record.manufacturer} ${record.model}: ${error.message}`);
  }

  return data as { id: string } | null;
}
