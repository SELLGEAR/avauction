import { config } from 'dotenv';
config({ path: '.env.local' });

import { discoverProductTargets } from './discover.js';
import { fetchWithRateLimit } from '../lib/fetch.js';
import { parseProductPage } from './parse.js';
import { getManufacturerWebsite } from './manufacturerWebsite.js';
import { mapCategory } from '../lib/mapCategory.js';
import { upsertMasterEquipment } from '../lib/upsert.js';
import { loadCompletedUrls } from '../lib/completed.js';
import { appendErrorEntry, readErrorEntries, writeErrorEntries, type ErrorLogEntry } from '../lib/errorLog.js';
import { createSummary, log, logError, printSummary } from '../lib/logger.js';
import { PRIORITY_MANUFACTURER_SLUGS } from './priorityManufacturers.js';
import type { MasterEquipmentRecord } from '../lib/types.js';

const LABEL = 'av-iq-scraper';
const SOURCE = 'av_iq';
const AV_IQ_ORIGIN = 'https://www.av-iq.com';
const PRODUCT_CONTROLLER = 'ctl1642';

// Optional dry-run controls, e.g.:
//   SCRAPE_MANUFACTURER_FILTER=american-audio SCRAPE_LIMIT=20 npm run scrape:av-iq
const manufacturerFilter = process.env.SCRAPE_MANUFACTURER_FILTER || null;
const limit = process.env.SCRAPE_LIMIT ? Number(process.env.SCRAPE_LIMIT) : null;

// Full-catalog crawls should opt into the CLAUDE.md priority manufacturer allowlist
// (see priorityManufacturers.ts) rather than pulling AV-iQ's entire ~280K-product,
// mostly-irrelevant-to-professional-AV catalog:
//   SCRAPE_ALLOWLIST_ONLY=true npm run scrape:av-iq
const allowlistOnly = process.env.SCRAPE_ALLOWLIST_ONLY === 'true';

const startedAt = Date.now();
function elapsedMinutes(): string {
  return ((Date.now() - startedAt) / 60_000).toFixed(1);
}

function buildProductUrl(manufacturerSlug: string, productSlug: string): string {
  return `${AV_IQ_ORIGIN}/avcat/${PRODUCT_CONTROLLER}/index.cfm?manufacturer=${manufacturerSlug}&product=${productSlug}`;
}

/**
 * Fetch + parse + upsert a single product. Shared by the main pass and the
 * retry pass so both go through identical logic. manufacturerSlug is read
 * back off the URL rather than threaded through separately — it's a query
 * param on every product URL already, so there's nothing to reconstruct.
 */
async function processProduct(productUrl: string): Promise<void> {
  const html = await fetchWithRateLimit(productUrl);
  const raw = parseProductPage(html, productUrl);

  const manufacturerSlug = new URL(productUrl).searchParams.get('manufacturer');
  const manufacturerWebsite = manufacturerSlug ? await getManufacturerWebsite(manufacturerSlug) : null;

  const record: MasterEquipmentRecord = {
    manufacturer: raw.manufacturer,
    model: raw.model,
    series: raw.series,
    category: mapCategory(raw.categoryRaw),
    category_raw: raw.categoryRaw,
    description: raw.description,
    bullet_points: raw.bulletPoints,
    image_url: raw.imageUrl,
    manufacturer_website_url: manufacturerWebsite,
    av_iq_product_id: raw.avIqProductId,
    source_url: raw.sourceUrl,
    source: SOURCE,
    status: 'pending_review',
    scraped_at: new Date().toISOString(),
  };

  await upsertMasterEquipment(record, { onConflict: 'av_iq_product_id', ignoreDuplicates: false });
}

async function runMainPass(completedUrls: Set<string>): Promise<ReturnType<typeof createSummary>> {
  const summary = createSummary();
  let processed = 0;

  for await (const target of discoverProductTargets()) {
    summary.discovered++;

    if (summary.discovered % 10_000 === 0) {
      log(LABEL, `...${summary.discovered} sitemap entries walked (${elapsedMinutes()}m elapsed)`);
    }

    if (manufacturerFilter && target.manufacturerSlug !== manufacturerFilter) {
      summary.skipped++;
      continue;
    }
    if (allowlistOnly && !PRIORITY_MANUFACTURER_SLUGS.has(target.manufacturerSlug)) {
      summary.skipped++;
      continue;
    }

    const productUrl = buildProductUrl(target.manufacturerSlug, target.productSlug);

    if (completedUrls.has(productUrl)) {
      summary.skipped++;
      continue;
    }
    if (limit !== null && processed >= limit) {
      break;
    }
    processed++;

    if (processed % 25 === 0) {
      log(
        LABEL,
        `progress: processed=${processed} upserted=${summary.upserted} errors=${summary.errors} (${elapsedMinutes()}m elapsed)`
      );
    }

    try {
      await processProduct(productUrl);
      summary.upserted++;
    } catch (err) {
      summary.errors++;
      logError(LABEL, `Failed on ${productUrl}`, err);
      await appendErrorEntry(LABEL, {
        url: productUrl,
        message: err instanceof Error ? err.message : String(err),
        failedAt: new Date().toISOString(),
      });
    }
  }

  return summary;
}

/**
 * Re-attempts everything logged as failed during the main pass (across this
 * run and any prior interrupted runs). Whatever still fails gets written
 * back so the log always reflects current, not historical, failures.
 */
async function runRetryPass(): Promise<void> {
  const entries = await readErrorEntries(LABEL);
  if (entries.length === 0) {
    log(LABEL, 'Retry pass: no logged failures to retry.');
    return;
  }

  log(LABEL, `Retry pass: re-attempting ${entries.length} previously failed products...`);

  const stillFailing: ErrorLogEntry[] = [];
  let succeeded = 0;

  for (const entry of entries) {
    try {
      await processProduct(entry.url);
      succeeded++;
    } catch (err) {
      logError(LABEL, `Retry failed on ${entry.url}`, err);
      stillFailing.push({
        ...entry,
        message: err instanceof Error ? err.message : String(err),
        failedAt: new Date().toISOString(),
      });
    }
  }

  await writeErrorEntries(LABEL, stillFailing);
  log(
    LABEL,
    `Retry pass complete: ${succeeded} recovered, ${stillFailing.length} still failing (see state/${LABEL}/errors.ndjson).`
  );
}

async function run(): Promise<void> {
  log(LABEL, 'Loading already-completed products for resume...');
  const completedUrls = await loadCompletedUrls(SOURCE);
  log(LABEL, `${completedUrls.size} products already done — resuming past those.`);

  const summary = await runMainPass(completedUrls);
  printSummary(LABEL, summary);

  await runRetryPass();
}

run().catch((err) => {
  logError(LABEL, 'Fatal', err);
  process.exit(1);
});
