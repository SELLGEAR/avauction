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

const LABEL = 'usedavgear-scraper';
const SOURCE = 'usedavgear';

// robots.txt (checked 2026-07-18) declares Crawl-delay: 10.
const CRAWL_DELAY_MS = 10_000;

// The Yoast product-sitemap.xml specifically — sitemap_index.xml also lists
// page-sitemap, blocks-sitemap, product_brand-sitemap, product_cat-sitemap,
// and featured_item-sitemap, none of which are individual products.
const PRODUCT_SITEMAP = 'https://usedavgear.com/product-sitemap.xml';

async function* discoverUrls(): AsyncGenerator<string> {
  // product-sitemap.xml also includes the /shop/ archive page itself
  // alongside actual /product/{slug}/ detail pages — only the latter carry
  // Product JSON-LD.
  for await (const url of discoverSitemapUrls(PRODUCT_SITEMAP, { crawlDelayMs: CRAWL_DELAY_MS })) {
    if (new URL(url).pathname.startsWith('/product/')) {
      yield url;
    }
  }
}

async function processUrl(url: string): Promise<ProcessUrlResult> {
  const html = await fetchWithRateLimit(url, { crawlDelayMs: CRAWL_DELAY_MS });
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
