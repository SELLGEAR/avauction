import { config } from 'dotenv';
config({ path: '.env.local' });

import { discoverSitemapUrls } from '../lib/sitemap.js';
import { fetchWithRateLimit } from '../lib/fetch.js';
import { mapCategory } from '../lib/mapCategory.js';
import { upsertMasterEquipment } from '../lib/upsert.js';
import { logError } from '../lib/logger.js';
import { stripManufacturerPrefix } from '../lib/textUtils.js';
import { runScraper, type ProcessUrlResult } from '../lib/runScraper.js';
import { parseProductPage } from './parse.js';
import { getBrandDisplayName } from './brandName.js';
import type { MasterEquipmentRecord } from '../lib/types.js';

const LABEL = 'gearsupply-scraper';
const SOURCE = 'gearsupply';

// sitemap.xml is a single flat file mixing product pages (/p/{slug}), brand
// index pages (/brand/{slug}), category pages (/c/{slug}), per-vendor storefronts
// (/store/{slug}), individual marketplace listings (/gsm-listing/{id}-{slug}),
// blog posts, and static pages all together — /p/ is the canonical product
// catalog, so everything else is filtered out after discovery.
const SITEMAP = 'https://gearsupply.com/sitemap.xml';
const PRODUCT_PATH_PREFIX = 'https://gearsupply.com/p/';

async function* discoverUrls(): AsyncGenerator<string> {
  for await (const url of discoverSitemapUrls(SITEMAP)) {
    if (url.startsWith(PRODUCT_PATH_PREFIX)) {
      yield url;
    }
  }
}

async function processUrl(url: string): Promise<ProcessUrlResult> {
  const html = await fetchWithRateLimit(url);
  const raw = parseProductPage(html, url);
  const manufacturer = await getBrandDisplayName(raw.brandSlug);
  const model = stripManufacturerPrefix(raw.name, manufacturer);
  const categoryRaw = raw.categoriesRaw.join(' > ') || null;

  const record: MasterEquipmentRecord = {
    manufacturer,
    model,
    series: null,
    category: mapCategory(categoryRaw),
    category_raw: categoryRaw,
    description: raw.description,
    bullet_points: [],
    image_url: raw.imageUrl,
    manufacturer_website_url: null,
    source_url: url,
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
