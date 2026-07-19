import { fetchWithRateLimit, type FetchOptions } from './fetch.js';

/** Fields actually used out of Shopify's public product JSON payload. */
export interface ShopifyProduct {
  title: string;
  vendor: string;
  product_type: string;
  tags: string[] | string;
  body_html: string | null;
  image: { src: string } | null;
  handle: string;
}

/**
 * Every Shopify storefront exposes {product-url}.json publicly by default —
 * clean structured data (vendor, title, product_type, tags, body_html)
 * without any HTML parsing. Confirmed present on both avgear.com and
 * clairusedgear.com on 2026-07-18. If a store ever disables this, the fetch
 * simply 404s like any other missing page.
 */
export async function fetchShopifyProduct(productUrl: string, opts?: FetchOptions): Promise<ShopifyProduct> {
  const jsonUrl = productUrl.endsWith('.json') ? productUrl : `${productUrl}.json`;
  const body = await fetchWithRateLimit(jsonUrl, opts);
  const data = JSON.parse(body) as { product?: ShopifyProduct };
  if (!data.product) {
    throw new Error(`No product field in Shopify JSON for ${jsonUrl}`);
  }
  return data.product;
}
