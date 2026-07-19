import * as cheerio from 'cheerio';
import { decodeHtmlEntities } from '../lib/textUtils.js';
import type { RawGearSourceProduct } from './types.js';

interface JsonLdProductNode {
  '@type'?: string;
  name?: string;
  description?: string;
  image?: string[];
  category?: string;
  brand?: { name?: string };
  url?: string;
}

interface JsonLdBreadcrumbNode {
  '@type'?: string;
  itemListElement?: Array<{ name?: string }>;
}

/**
 * GearSource's master-product pages (not the noisier /product/{slug}/{stock-id}
 * for-sale listings) embed a schema.org Product + BreadcrumbList pair in a
 * <script id="page-schema" type="application/ld+json"> tag — verified against
 * a live page on 2026-07-18
 * (https://gearsource.com/consoles-mixers/digico-quantum-112-digital-console).
 * The Product node's own "name" is a marketing title ("New and Used DiGiCo
 * Quantum 112 Digital Console for sale"), not a clean model — the last
 * breadcrumb entry ("Quantum 112 Digital Console") is the clean model text.
 */
export function parseProductPage(html: string, fetchedUrl: string): RawGearSourceProduct {
  const $ = cheerio.load(html);

  const raw = $('script#page-schema[type="application/ld+json"]').first().text();
  if (!raw) {
    throw new Error(`No page-schema JSON-LD found on ${fetchedUrl} — page structure may have changed`);
  }

  let data: { '@graph'?: Array<JsonLdProductNode | JsonLdBreadcrumbNode> };
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new Error(
      `Failed to parse page-schema JSON-LD on ${fetchedUrl}: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const graph = data['@graph'] ?? [];
  const product = graph.find((node): node is JsonLdProductNode => node['@type'] === 'Product');
  const breadcrumb = graph.find((node): node is JsonLdBreadcrumbNode => node['@type'] === 'BreadcrumbList');

  if (!product) {
    throw new Error(`No Product node in JSON-LD @graph on ${fetchedUrl}`);
  }

  const manufacturer = product.brand?.name?.trim();
  if (!manufacturer) {
    throw new Error(`Missing brand.name on ${fetchedUrl}`);
  }

  const breadcrumbItems = breadcrumb?.itemListElement ?? [];
  const lastCrumbName = breadcrumbItems[breadcrumbItems.length - 1]?.name?.trim();
  const model = lastCrumbName || product.name?.trim();
  if (!model) {
    throw new Error(`Could not determine model on ${fetchedUrl}`);
  }

  // Breadcrumb shape is Home > ...category levels... > product name — the
  // levels in between are the category path; product.category is the fallback
  // for the rare page missing a breadcrumb.
  const categoryRaw =
    breadcrumbItems.length > 2
      ? breadcrumbItems
          .slice(1, -1)
          .map((item) => item.name)
          .filter((name): name is string => Boolean(name))
          .join(' > ')
      : (product.category ?? null);

  return {
    manufacturer: decodeHtmlEntities(manufacturer),
    model: decodeHtmlEntities(model),
    categoryRaw: categoryRaw ? decodeHtmlEntities(categoryRaw) : null,
    description: product.description ? decodeHtmlEntities(product.description.trim()) : null,
    imageUrl: product.image?.[0] ?? null,
    sourceUrl: product.url ?? fetchedUrl,
  };
}
