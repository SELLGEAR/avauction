import { fetchWithRateLimit } from '../lib/fetch.js';
import { decodeHtmlEntities } from '../lib/textUtils.js';
import { logError } from '../lib/logger.js';

const GEARSUPPLY_ORIGIN = 'https://gearsupply.com';
const LABEL = 'gearsupply-scraper';

const cache = new Map<string, string>();

function titleCaseFallback(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * fullParentProduct only carries a lowercase brand slug ("etc", "allen-heath"),
 * not a display name. Gearsupply's /brand/{slug} page title follows
 * "Used {Brand} Gear for Sale | Gearsupply Pro AV Marketplace" — verified
 * 2026-07-18 — so this fetches and caches that once per brand per run rather
 * than once per product. Falls back to a title-cased version of the slug for
 * the rare slug with no matching brand page ("Brand Not Found").
 */
export async function getBrandDisplayName(brandSlug: string): Promise<string> {
  const cached = cache.get(brandSlug);
  if (cached) return cached;

  const fallback = titleCaseFallback(brandSlug);

  try {
    const html = await fetchWithRateLimit(`${GEARSUPPLY_ORIGIN}/brand/${brandSlug}`);
    const titleMatch = html.match(/<title>([^<]*)<\/title>/);
    const rawTitle = titleMatch?.[1] ?? '';
    const nameMatch = rawTitle.match(/^Used (.+?) Gear for Sale/);
    const displayName = nameMatch ? decodeHtmlEntities(nameMatch[1].trim()) : fallback;
    cache.set(brandSlug, displayName);
    return displayName;
  } catch (err) {
    logError(LABEL, `Failed to fetch brand display name for ${brandSlug}`, err);
    cache.set(brandSlug, fallback);
    return fallback;
  }
}
