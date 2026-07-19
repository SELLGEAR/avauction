import { config } from 'dotenv';
config({ path: '.env.local' });

import { discoverSitemapUrls } from '../lib/sitemap.js';
import { fetchWithRateLimit } from '../lib/fetch.js';
import { mapCategory } from '../lib/mapCategory.js';
import { upsertMasterEquipment } from '../lib/upsert.js';
import { logError } from '../lib/logger.js';
import { runScraper, type ProcessUrlResult } from '../lib/runScraper.js';
import { parseProductPage } from './parse.js';
import type { MasterEquipmentRecord } from '../lib/types.js';

const LABEL = 'gearsource-scraper';
const SOURCE = 'gearsource';

// The master-product catalog (one canonical page per real-world product,
// e.g. /consoles-mixers/digico-quantum-112-digital-console) — deliberately
// not listing-sitemap.xml, which enumerates individual noisy for-sale stock
// items (lot numbers, "lot of 2" quantities) rather than clean products.
const SITEMAP_INDEX = 'https://gearsource.com/static/master-product-sitemap.xml';

async function* discoverUrls(): AsyncGenerator<string> {
  yield* discoverSitemapUrls(SITEMAP_INDEX);
}

async function processUrl(url: string): Promise<ProcessUrlResult> {
  const html = await fetchWithRateLimit(url);
  const raw = parseProductPage(html, url);

  const record: MasterEquipmentRecord = {
    manufacturer: raw.manufacturer,
    model: raw.model,
    series: null,
    category: mapCategory(raw.categoryRaw),
    category_raw: raw.categoryRaw,
    description: raw.description,
    bullet_points: [],
    image_url: raw.imageUrl,
    manufacturer_website_url: null,
    source_url: raw.sourceUrl,
    source: SOURCE,
    status: 'approved',
    scraped_at: new Date().toISOString(),
  };

  const result = await upsertMasterEquipment(record, { onConflict: 'product_key', ignoreDuplicates: true });
  return result ? { outcome: 'inserted', masterEquipmentId: result.id } : { outcome: 'duplicate_skipped' };
}

runScraper({ label: LABEL, source: SOURCE, discoverUrls, processUrl }).catch((err) => {
  logError(LABEL, 'Fatal', err);
  process.exit(1);
});
