import { getSupabaseClient } from './supabaseClient.js';

const PAGE_SIZE = 1000;

/**
 * Loads every source_url already upserted for a given source so a crawl can
 * skip already-completed products on resume after an interruption. Supabase
 * itself is the checkpoint — no separate state file to keep in sync — which
 * is correct even after an ungraceful kill, since each upsert already
 * committed durably the moment it happened.
 *
 * This only works for scrapers where every successfully-processed page is
 * guaranteed to produce a master_equipment row (true for AV-iQ, which is the
 * only current user of this function). Scrapers that can legitimately skip a
 * page without inserting anything — because product_key already exists from
 * another source — need scrapeLog.ts's visited-URL tracking instead.
 */
export async function loadCompletedUrls(source: string): Promise<Set<string>> {
  const db = getSupabaseClient();
  const urls = new Set<string>();
  let from = 0;

  while (true) {
    const { data, error } = await db
      .from('master_equipment')
      .select('source_url')
      .eq('source', source)
      .not('source_url', 'is', null)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to load completed URLs for resume (${source}): ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data as Array<{ source_url: string | null }>) {
      if (row.source_url) urls.add(row.source_url);
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return urls;
}
