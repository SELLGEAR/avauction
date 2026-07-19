import { discoverSitemapUrls } from './sitemap.js';
import { fetchShopifyProduct } from './shopify.js';
import { mapCategory } from './mapCategory.js';
import { upsertMasterEquipment } from './upsert.js';
import { stripManufacturerPrefix, stripHtml } from './textUtils.js';
import { logError } from './logger.js';
import { runScraper, type ProcessUrlResult } from './runScraper.js';
import type { MasterEquipmentRecord } from './types.js';

export interface ShopifyScraperConfig {
  label: string;
  source: string;
  sitemapUrl: string;
  /**
   * Vendor values (case-insensitive) that are actually the store's own name,
   * not a real manufacturer — e.g. avgear.com sets vendor:"AVGear.com" on
   * some listings instead of the OEM (confirmed live 2026-07-18: an ADJ D6
   * splitter, with "ADJ" plainly in the title, has vendor:"AVGear.com").
   * There's no admin review gate for these auto-approved sources, so a
   * record like that would sit in master_equipment permanently mislabeled —
   * skipping it is cheaper than inserting a wrong manufacturer.
   */
  excludeVendors?: string[];
}

/**
 * Both avgear.com and clairusedgear.com are Shopify storefronts with an
 * identical public product JSON contract (see shopify.ts) — this is the one
 * scraper implementation shared verbatim between them, parameterized only by
 * which store to hit and what source value to record.
 */
export function runShopifyScraper(config: ShopifyScraperConfig): Promise<void> {
  const { label, source, sitemapUrl } = config;
  const excludedVendors = new Set((config.excludeVendors ?? []).map((v) => v.toLowerCase()));

  async function* discoverUrls(): AsyncGenerator<string> {
    for await (const url of discoverSitemapUrls(sitemapUrl)) {
      if (new URL(url).pathname.startsWith('/products/')) {
        yield url;
      }
    }
  }

  async function processUrl(url: string): Promise<ProcessUrlResult> {
    const product = await fetchShopifyProduct(url);
    const manufacturer = product.vendor?.trim();
    if (!manufacturer) {
      throw new Error(`Missing vendor on ${url}`);
    }
    if (excludedVendors.has(manufacturer.toLowerCase())) {
      throw new Error(`vendor "${manufacturer}" is the store's own name, not a real manufacturer, on ${url}`);
    }

    const model = stripManufacturerPrefix(product.title, manufacturer);
    const tags = Array.isArray(product.tags) ? product.tags.join(' ') : product.tags;
    // Widen the mapCategory input beyond product_type alone (often generic,
    // e.g. "camera lens") with tags and title, which usually carry more
    // specific category signal.
    const categoryHint = [product.product_type, tags, product.title].filter(Boolean).join(' ');

    const record: MasterEquipmentRecord = {
      manufacturer,
      model,
      series: null,
      category: mapCategory(categoryHint || null),
      category_raw: product.product_type || null,
      description: stripHtml(product.body_html),
      bullet_points: [],
      image_url: product.image?.src ?? null,
      manufacturer_website_url: null,
      source_url: url,
      source,
      status: 'approved',
      scraped_at: new Date().toISOString(),
    };

    const result = await upsertMasterEquipment(record, { onConflict: 'product_key', ignoreDuplicates: true });
    return result ? { outcome: 'inserted', masterEquipmentId: result.id } : { outcome: 'duplicate_skipped' };
  }

  return runScraper({ label, source, discoverUrls, processUrl }).catch((err) => {
    logError(label, 'Fatal', err);
    process.exit(1);
  });
}
