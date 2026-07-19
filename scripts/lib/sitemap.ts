import * as cheerio from 'cheerio';
import { fetchWithRateLimit, type FetchOptions } from './fetch.js';

/**
 * Walks a sitemap URL, auto-detecting whether it's a <sitemapindex> (recurses
 * into each child <sitemap><loc>) or a flat <urlset> (yields each <url><loc>
 * directly). Every source in this batch uses one of these two shapes, some
 * nested two levels deep (GearSource, AVGear, Clair Used Gear) and some flat
 * from the start (Gearsupply) — this handles both without the caller needing
 * to know which.
 *
 * Doesn't filter by path — a flat sitemap can mix product URLs with pages,
 * blog posts, brand/category index pages, etc. Callers filter after.
 */
export async function* discoverSitemapUrls(sitemapUrl: string, opts?: FetchOptions): AsyncGenerator<string> {
  const xml = await fetchWithRateLimit(sitemapUrl, opts);
  const $ = cheerio.load(xml, { xmlMode: true });

  if ($('sitemapindex').length > 0) {
    const childSitemapUrls = $('sitemap > loc')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);

    for (const childUrl of childSitemapUrls) {
      yield* discoverSitemapUrls(childUrl, opts);
    }
    return;
  }

  const urls = $('url > loc')
    .map((_, el) => $(el).text().trim())
    .get()
    .filter(Boolean);

  for (const url of urls) {
    yield url;
  }
}
