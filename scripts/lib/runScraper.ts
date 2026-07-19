import { appendErrorEntry, readErrorEntries, writeErrorEntries, type ErrorLogEntry } from './errorLog.js';
import { createSummary, log, logError, printSummary } from './logger.js';
import { loadVisitedUrls, recordScrapeOutcome, type ScrapeOutcome } from './scrapeLog.js';

export interface ProcessUrlResult {
  outcome: Extract<ScrapeOutcome, 'inserted' | 'duplicate_skipped'>;
  masterEquipmentId?: string;
}

export interface ScraperRunOptions {
  label: string;
  source: string;
  discoverUrls: () => AsyncGenerator<string>;
  processUrl: (url: string) => Promise<ProcessUrlResult>;
}

/**
 * Shared main-pass + retry-pass orchestration for every source that dedupes
 * against master_equipment_scrape_log (i.e. everything except AV-iQ, whose
 * completed.ts checkpoint predates this and works differently — see
 * scripts/lib/completed.ts). Each scraper only supplies how to discover URLs
 * and how to turn one URL into a master_equipment row.
 */
export async function runScraper(opts: ScraperRunOptions): Promise<void> {
  const { label, source, discoverUrls, processUrl } = opts;

  const limit = process.env.SCRAPE_LIMIT ? Number(process.env.SCRAPE_LIMIT) : null;
  const startedAt = Date.now();
  const elapsedMinutes = () => ((Date.now() - startedAt) / 60_000).toFixed(1);

  log(label, 'Loading already-visited URLs for resume...');
  const visitedUrls = await loadVisitedUrls(source);
  log(label, `${visitedUrls.size} URLs already done — resuming past those.`);

  const summary = createSummary();
  let processed = 0;

  async function attempt(url: string): Promise<void> {
    try {
      const result = await processUrl(url);
      if (result.outcome === 'inserted') {
        summary.upserted++;
      } else {
        summary.skipped++;
      }
      await recordScrapeOutcome(source, url, result.outcome, { masterEquipmentId: result.masterEquipmentId });
    } catch (err) {
      summary.errors++;
      const message = err instanceof Error ? err.message : String(err);
      logError(label, `Failed on ${url}`, err);
      await appendErrorEntry(label, { url, message, failedAt: new Date().toISOString() });
      // Best-effort — a failure here shouldn't mask the original error above.
      await recordScrapeOutcome(source, url, 'error', { message }).catch(() => {});
      throw err;
    }
  }

  for await (const url of discoverUrls()) {
    summary.discovered++;

    if (summary.discovered % 5_000 === 0) {
      log(label, `...${summary.discovered} sitemap entries walked (${elapsedMinutes()}m elapsed)`);
    }
    if (visitedUrls.has(url)) {
      summary.skipped++;
      continue;
    }
    if (limit !== null && processed >= limit) {
      break;
    }
    processed++;

    if (processed % 25 === 0) {
      log(
        label,
        `progress: processed=${processed} upserted=${summary.upserted} skipped=${summary.skipped} errors=${summary.errors} (${elapsedMinutes()}m elapsed)`
      );
    }

    await attempt(url).catch(() => {});
  }

  printSummary(label, summary);

  const entries = await readErrorEntries(label);
  if (entries.length === 0) {
    log(label, 'Retry pass: no logged failures to retry.');
    return;
  }

  log(label, `Retry pass: re-attempting ${entries.length} previously failed URLs...`);
  const stillFailing: ErrorLogEntry[] = [];
  let succeeded = 0;

  for (const entry of entries) {
    try {
      const result = await processUrl(entry.url);
      succeeded++;
      await recordScrapeOutcome(source, entry.url, result.outcome, { masterEquipmentId: result.masterEquipmentId });
    } catch (err) {
      logError(label, `Retry failed on ${entry.url}`, err);
      stillFailing.push({
        url: entry.url,
        message: err instanceof Error ? err.message : String(err),
        failedAt: new Date().toISOString(),
      });
    }
  }

  await writeErrorEntries(label, stillFailing);
  log(
    label,
    `Retry pass complete: ${succeeded} recovered, ${stillFailing.length} still failing (see state/${label}/errors.ndjson).`
  );
}
