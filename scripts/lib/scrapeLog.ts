import { getSupabaseClient } from './supabaseClient.js';

const PAGE_SIZE = 1000;

export type ScrapeOutcome = 'inserted' | 'duplicate_skipped' | 'error';

/**
 * Resume checkpoint for scrapers where a successfully-processed page can
 * legitimately produce no new master_equipment row (product_key already
 * existed from another source). Unlike completed.ts, this tracks every URL a
 * scraper has visited — regardless of outcome — via master_equipment_scrape_log,
 * so those pages aren't re-fetched every run.
 *
 * Only 'inserted' and 'duplicate_skipped' count as "done" here, matching
 * AV-iQ's completed.ts semantics: an 'error' outcome is deliberately left out
 * so a URL that failed gets picked back up by the next full run, on top of
 * the immediate retry pass driven by errorLog.ts.
 */
export async function loadVisitedUrls(source: string): Promise<Set<string>> {
  const db = getSupabaseClient();
  const urls = new Set<string>();
  let from = 0;

  while (true) {
    const { data, error } = await db
      .from('master_equipment_scrape_log')
      .select('source_url')
      .eq('source', source)
      .in('outcome', ['inserted', 'duplicate_skipped'])
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to load scrape log for resume (${source}): ${error.message}`);
    }
    if (!data || data.length === 0) break;

    for (const row of data as Array<{ source_url: string }>) {
      urls.add(row.source_url);
    }

    if (data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }

  return urls;
}

export async function recordScrapeOutcome(
  source: string,
  sourceUrl: string,
  outcome: ScrapeOutcome,
  opts: { masterEquipmentId?: string; message?: string } = {}
): Promise<void> {
  const db = getSupabaseClient();
  const { error } = await db.from('master_equipment_scrape_log').upsert(
    {
      source,
      source_url: sourceUrl,
      outcome,
      master_equipment_id: opts.masterEquipmentId ?? null,
      message: opts.message ?? null,
      scraped_at: new Date().toISOString(),
    },
    { onConflict: 'source,source_url' }
  );

  if (error) {
    throw new Error(`Failed to record scrape log entry for ${sourceUrl}: ${error.message}`);
  }
}
