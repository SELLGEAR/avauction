import { fetchWithRateLimit } from '../lib/fetch.js';
import { parseManufacturerWebsite } from './parse.js';
import { logError } from '../lib/logger.js';

const AV_IQ_ORIGIN = 'https://www.av-iq.com';
const MANUFACTURER_PROFILE_CONTROLLER = 'ctl1642';

const cache = new Map<string, string | null>();

/**
 * Manufacturer website is only present on the manufacturer's profile page,
 * not the product page, so it's fetched once per manufacturer and cached
 * for the rest of the run rather than re-fetched per product.
 */
export async function getManufacturerWebsite(manufacturerSlug: string): Promise<string | null> {
  if (cache.has(manufacturerSlug)) {
    return cache.get(manufacturerSlug) ?? null;
  }

  const url = `${AV_IQ_ORIGIN}/avcat/${MANUFACTURER_PROFILE_CONTROLLER}/index.cfm?manufacturer=${manufacturerSlug}`;

  try {
    const html = await fetchWithRateLimit(url);
    const website = parseManufacturerWebsite(html);
    cache.set(manufacturerSlug, website);
    return website;
  } catch (err) {
    logError('av-iq-scraper', `Failed to fetch manufacturer website for ${manufacturerSlug}`, err);
    cache.set(manufacturerSlug, null);
    return null;
  }
}
