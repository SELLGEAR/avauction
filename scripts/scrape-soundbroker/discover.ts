import * as cheerio from 'cheerio';
import { fetchWithRateLimit } from '../lib/fetch.js';
import { logError } from '../lib/logger.js';
import type { ManufacturerLink } from './types.js';

const LABEL = 'soundbroker-scraper';
const ORIGIN = 'https://www.soundbroker.com';

// robots.txt (checked 2026-07-18) declares Crawl-delay: 5 for soundbroker.com —
// respected explicitly here since fetch.ts's robots handling only reads Disallow.
const CRAWL_DELAY_MS = 5_000;

/**
 * Maps a listing page's resolved URL to the manufacturer name it was
 * discovered under. Populated as discoverListingUrls walks each manufacturer
 * page — every entry lands here before its URL is yielded, so a caller
 * consuming discoverListingUrls one item at a time (as runScraper does) can
 * always look a URL up immediately after receiving it.
 */
const manufacturerByListingUrl = new Map<string, string>();

export function getManufacturerForListing(url: string): string | undefined {
  return manufacturerByListingUrl.get(url);
}

/**
 * SoundBroker has no sitemap. Its advSearch page's "Browse by Manufacturer"
 * dropdown (~1,100 options, verified 2026-07-18) is the only full-catalog
 * index available — each option links to a /manufacturers/{SLUG}/ page
 * listing that brand's current inventory.
 */
async function fetchManufacturerLinks(): Promise<ManufacturerLink[]> {
  const html = await fetchWithRateLimit(`${ORIGIN}/advSearch/`, { crawlDelayMs: CRAWL_DELAY_MS });
  const $ = cheerio.load(html);

  const links: ManufacturerLink[] = [];
  $('option[value*="/manufacturers/"]').each((_, el) => {
    const url = $(el).attr('value')?.trim();
    const name = $(el).text().trim();
    if (url && name) {
      links.push({ url, name });
    }
  });
  return links;
}

/**
 * Every manufacturer page also renders an unrelated sponsored "amazon"
 * widget link and, occasionally, /WANTED/ buyer-request threads mixed into
 * the same link soup — neither is real inventory, so both are filtered out.
 */
function extractListingUrls(html: string): string[] {
  const $ = cheerio.load(html);
  const urls = new Set<string>();

  $('a[href*="/listingview/"]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (/\/amazon\//i.test(href) || /\/wanted\//i.test(href)) return;

    const absolute = new URL(href, ORIGIN).toString();
    urls.add(absolute);
  });

  return [...urls];
}

export async function* discoverListingUrls(): AsyncGenerator<string> {
  const manufacturers = await fetchManufacturerLinks();

  for (const { url: manufacturerUrl, name } of manufacturers) {
    let html: string;
    try {
      html = await fetchWithRateLimit(manufacturerUrl, { crawlDelayMs: CRAWL_DELAY_MS });
    } catch (err) {
      logError(LABEL, `Failed to fetch manufacturer page ${manufacturerUrl}`, err);
      continue;
    }

    for (const listingUrl of extractListingUrls(html)) {
      if (!manufacturerByListingUrl.has(listingUrl)) {
        manufacturerByListingUrl.set(listingUrl, name);
      }
      yield listingUrl;
    }
  }
}
