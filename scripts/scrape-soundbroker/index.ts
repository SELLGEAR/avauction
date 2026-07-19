import { config } from 'dotenv';
config({ path: '.env.local' });

import { fetchWithRateLimit } from '../lib/fetch.js';
import { mapCategory } from '../lib/mapCategory.js';
import { upsertMasterEquipment } from '../lib/upsert.js';
import { logError } from '../lib/logger.js';
import { stripManufacturerPrefix } from '../lib/textUtils.js';
import { runScraper, type ProcessUrlResult } from '../lib/runScraper.js';
import { discoverListingUrls, getManufacturerForListing } from './discover.js';
import { parseListingPage } from './parse.js';
import type { MasterEquipmentRecord } from '../lib/types.js';

const LABEL = 'soundbroker-scraper';
const SOURCE = 'soundbroker';
const CRAWL_DELAY_MS = 5_000;

function categoryFromUrlPath(url: string): string | null {
  const segment = new URL(url).pathname.split('/').filter(Boolean)[0];
  return segment ? segment.replace(/_+/g, ' ').trim() || null : null;
}

async function processUrl(url: string): Promise<ProcessUrlResult> {
  const manufacturer = getManufacturerForListing(url);
  if (!manufacturer) {
    // Defensive only — discoverListingUrls always records a URL's manufacturer
    // before yielding it, and the retry pass runs after the main pass fully
    // exhausts discovery within the same process, so the map is always
    // populated by the time either pass calls processUrl.
    throw new Error(`No manufacturer known for ${url} — discovery/process ordering invariant violated`);
  }

  const html = await fetchWithRateLimit(url, { crawlDelayMs: CRAWL_DELAY_MS });
  const { combinedTitle, categoryRaw } = parseListingPage(html, url);
  const model = stripManufacturerPrefix(combinedTitle, manufacturer);
  const resolvedCategoryRaw = categoryRaw ?? categoryFromUrlPath(url);

  const record: MasterEquipmentRecord = {
    manufacturer,
    model,
    series: null,
    category: mapCategory(resolvedCategoryRaw),
    category_raw: resolvedCategoryRaw,
    description: null,
    bullet_points: [],
    image_url: null,
    manufacturer_website_url: null,
    source_url: url,
    source: SOURCE,
    status: 'approved',
    scraped_at: new Date().toISOString(),
  };

  const result = await upsertMasterEquipment(record, { onConflict: 'product_key', ignoreDuplicates: true });
  return result ? { outcome: 'inserted', masterEquipmentId: result.id } : { outcome: 'duplicate_skipped' };
}

runScraper({ label: LABEL, source: SOURCE, discoverUrls: discoverListingUrls, processUrl }).catch((err) => {
  logError(LABEL, 'Fatal', err);
  process.exit(1);
});
