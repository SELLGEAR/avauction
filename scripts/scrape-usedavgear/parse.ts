import * as cheerio from 'cheerio';
import { decodeHtmlEntities, stripManufacturerPrefix } from '../lib/textUtils.js';
import type { RawUsedAvGearProduct } from './types.js';

interface JsonLdProductNode {
  '@type'?: string;
  name?: string;
  description?: string;
  image?: string;
  url?: string;
  brand?: { name?: string };
}

interface JsonLdBreadcrumbNode {
  '@type'?: string;
  itemListElement?: Array<{ item?: { name?: string } }>;
}

/**
 * usedavgear.com is WooCommerce + Yoast SEO. Yoast emits two separate
 * <script type="application/ld+json"> blocks per page — a WebPage graph and
 * a BreadcrumbList+Product graph — verified live on 2026-07-18
 * (https://usedavgear.com/product/panasonic-pt-rq25ku-4k-laser-projector/).
 * Unlike GearSource's breadcrumb (flat {name, item: url}), Yoast nests the
 * name inside item: {item: {name, "@id"}}.
 */
export function parseProductPage(html: string, fetchedUrl: string): RawUsedAvGearProduct {
  const $ = cheerio.load(html);

  // Yoast emits a WebPage graph (with its own generic site BreadcrumbList)
  // and, in a separate <script> tag, a BreadcrumbList+Product pair scoped to
  // this specific product — verified on the same live page cited above.
  // Nodes must stay grouped per-script rather than flattened across all
  // scripts, or the generic WebPage breadcrumb gets matched instead of the
  // product's own one (it did, silently producing an empty category, until
  // this was caught by testing against a real saved page).
  let product: JsonLdProductNode | undefined;
  let breadcrumb: JsonLdBreadcrumbNode | undefined;

  $('script[type="application/ld+json"]').each((_, el) => {
    let data: { '@graph'?: Array<JsonLdProductNode | JsonLdBreadcrumbNode> };
    try {
      data = JSON.parse($(el).text());
    } catch {
      return;
    }
    const graph = data['@graph'];
    if (!Array.isArray(graph)) return;

    const productNode = graph.find((node): node is JsonLdProductNode => node['@type'] === 'Product');
    if (productNode) {
      product = productNode;
      breadcrumb = graph.find((node): node is JsonLdBreadcrumbNode => node['@type'] === 'BreadcrumbList');
    }
  });

  if (!product) {
    throw new Error(`No Product node in JSON-LD on ${fetchedUrl}`);
  }

  const manufacturer = product.brand?.name?.trim();
  const name = product.name?.trim();
  if (!manufacturer || !name) {
    throw new Error(`Missing brand.name or name on ${fetchedUrl}`);
  }

  const breadcrumbItems = breadcrumb?.itemListElement ?? [];
  const categoryRaw =
    breadcrumbItems.length > 2
      ? breadcrumbItems
          .slice(1, -1)
          .map((entry) => entry.item?.name)
          .filter((n): n is string => Boolean(n))
          .map(decodeHtmlEntities)
          .join(' > ')
      : null;

  return {
    manufacturer: decodeHtmlEntities(manufacturer),
    model: stripManufacturerPrefix(decodeHtmlEntities(name), decodeHtmlEntities(manufacturer)),
    categoryRaw,
    description: product.description ? decodeHtmlEntities(product.description.trim()) : null,
    imageUrl: product.image ?? null,
    sourceUrl: product.url ?? fetchedUrl,
  };
}
