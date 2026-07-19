import * as cheerio from 'cheerio';
import { fetchWithRateLimit } from '../lib/fetch.js';
import { logError } from '../lib/logger.js';
import type { ProductTarget } from './types.js';

const PRODUCT_SITEMAP_INDEX = 'https://www.av-iq.com/sitemaps/sitemap-index-product-rrc.xml';

async function fetchSitemapLocs(url: string): Promise<string[]> {
  const xml = await fetchWithRateLimit(url);
  const $ = cheerio.load(xml, { xmlMode: true });
  return $('loc')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);
}

function parseProductTarget(productUrl: string): ProductTarget | null {
  try {
    const parsed = new URL(productUrl);
    const manufacturerSlug = parsed.searchParams.get('manufacturer');
    const productSlug = parsed.searchParams.get('product');
    if (!manufacturerSlug || !productSlug) return null;
    return { manufacturerSlug, productSlug };
  } catch {
    return null;
  }
}

/**
 * Discovery via AV-iQ's published product sitemap (named explicitly in
 * robots.txt) rather than crawling the manufacturer=all index page and each
 * manufacturer's listing page. The sitemap is a flat list of exact product
 * URLs — no listing-page pagination to parse, no risk of missing products
 * behind a "load more" control.
 */
export async function* discoverProductTargets(): AsyncGenerator<ProductTarget> {
  const subSitemapUrls = await fetchSitemapLocs(PRODUCT_SITEMAP_INDEX);

  for (const sitemapUrl of subSitemapUrls) {
    let productUrls: string[];
    try {
      productUrls = await fetchSitemapLocs(sitemapUrl);
    } catch (err) {
      logError('av-iq-scraper', `Failed to fetch sub-sitemap ${sitemapUrl}`, err);
      continue;
    }

    for (const productUrl of productUrls) {
      const target = parseProductTarget(productUrl);
      if (target) {
        yield target;
      }
    }
  }
}
