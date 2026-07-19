import * as cheerio from 'cheerio';
import type { RawAvIqProduct } from './types.js';

/**
 * Selectors verified against a live AV-iQ product page on 2026-07-16
 * (https://www.av-iq.com/avcat/ctl1642/index.cfm?manufacturer=american-audio&product=10-mxr).
 * AV-iQ has no documented API or markup contract, so these are reverse-engineered
 * from current markup and may need updating if the site redesigns.
 */
export function parseProductPage(html: string, fetchedUrl: string): RawAvIqProduct {
  const $ = cheerio.load(html);

  const idAttrEl = $('[data-prodid]').first();
  const avIqProductId = idAttrEl.attr('data-prodid');
  if (!avIqProductId) {
    throw new Error(`No data-prodid found on ${fetchedUrl} — page structure may have changed`);
  }

  const manufacturer = idAttrEl.attr('data-company-name')?.trim();
  const model = idAttrEl.attr('data-product-model-number')?.trim();
  if (!manufacturer || !model) {
    throw new Error(`Missing manufacturer/model attributes on ${fetchedUrl}`);
  }

  let series: string | null = null;
  $('h2').each((_, el) => {
    const label = $(el).find('span').first().text().trim();
    if (label.startsWith('Series:')) {
      series = $(el).find('span').eq(1).text().trim() || null;
    }
  });

  const description = $('h1.font-size-22').first().text().trim() || null;

  // The page has a short features ul.NBul near the top and a second ul.NBul
  // inside .ProdDetailInfo holding the full spec table further down — only
  // the former is the "bullet points" field, so exclude anything nested in
  // .ProdDetailInfo before taking the first remaining list.
  const bulletPoints = $('ul.NBul')
    .filter((_, el) => $(el).parents('.ProdDetailInfo').length === 0)
    .first()
    .find('li.NBli')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter(Boolean);

  // Breadcrumb, e.g. "Audio Production Equipment : Audio Mixers / Consoles : American Audio - 10 MXR".
  // The sitewide "Search by Category" nav menu also uses category= links (for every
  // category on the site), so anchor off the subcategory= link instead — that query
  // param only ever appears in the real breadcrumb, never in the nav menu — and scope
  // the category link collection to that same container.
  const subcategoryLink = $('a[href^="index.cfm?subcategory="]').first();
  const breadcrumbContainer = subcategoryLink.length > 0 ? subcategoryLink.closest('div') : null;
  const categoryLinks = breadcrumbContainer
    ? breadcrumbContainer
        .find('a[href^="index.cfm?category="], a[href^="index.cfm?subcategory="]')
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean)
    : [];
  const categoryRaw = categoryLinks.length > 0 ? categoryLinks.join(' > ') : null;

  const imageUrl = $('meta[property="og:image"]').attr('content')?.trim() || null;

  const sourceUrl =
    $('link[rel="canonical"]').attr('href')?.trim() ||
    $('meta[property="og:url"]').attr('content')?.trim() ||
    fetchedUrl;

  return {
    avIqProductId,
    manufacturer,
    model,
    series,
    description,
    bulletPoints,
    categoryRaw,
    imageUrl,
    sourceUrl,
  };
}

/**
 * Manufacturer website link is optional and lives only on the manufacturer's
 * own profile page (?manufacturer={slug}), not the product page. AV-iQ renders
 * it as an onclick="trackWebsiteLinkClick('https://...')" handler when present,
 * and omits the element entirely when a manufacturer has none on file.
 */
export function parseManufacturerWebsite(html: string): string | null {
  const $ = cheerio.load(html);
  let websiteUrl: string | null = null;

  $('[onclick*="trackWebsiteLinkClick"]').each((_, el) => {
    const onclick = $(el).attr('onclick') ?? '';
    const match = onclick.match(/trackWebsiteLinkClick\(['"]([^'"]+)['"]\)/);
    if (match) {
      websiteUrl = match[1];
    }
  });

  return websiteUrl;
}
