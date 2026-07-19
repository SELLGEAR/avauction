import type { RawGearsupplyProduct } from './types.js';

/**
 * gearsupply.com is a Next.js app that streams product data as an RSC
 * "flight" payload — self.__next_f.push([1, "...escaped JSON-like text..."])
 * — rather than a <script type="application/ld+json"> block or a page-json
 * API. There's no full JSON to JSON.parse here (the payload isn't valid JSON
 * on its own, and the trailing name_embedding field is a multi-thousand-float
 * vector not worth parsing), so this extracts just the handful of fields
 * needed via windowed regexes anchored on the fixed field order observed in
 * fullParentProduct on a live page on 2026-07-18
 * (https://gearsupply.com/p/etc-source-four-edlt-50-degree-lens-tube):
 * id, family, name, sku, slug, status, description, short_description,
 * primary_image, brand, categories, ...(name_embedding onward, ignored).
 */
/**
 * The captured text is a JSON string's contents, not a fully-parsed value —
 * \uXXXX escapes (e.g. "2P&G" for "2P&G", found live on 2026-07-18 on
 * https://gearsupply.com/p/10-2pg-20a-123-cable) come through as literal
 * backslash-u-four-hex-digits unless decoded explicitly.
 */
function decodeJsonUnicodeEscapes(text: string): string {
  return text.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function extractBetween(text: string, key: string, nextKey: string): string | null | undefined {
  const pattern = new RegExp(`\\\\"${key}\\\\":(.*?),\\\\"${nextKey}\\\\"`, 's');
  const match = text.match(pattern);
  if (!match) return undefined;

  const raw = match[1].trim();
  if (raw === 'null') return null;

  const quoted = raw.match(/^\\"(.*)\\"$/s);
  return decodeJsonUnicodeEscapes(quoted ? quoted[1] : raw);
}

function extractCategories(text: string): string[] {
  const match = text.match(/\\"categories\\":\[(.*?)\]/s);
  if (!match || !match[1].trim()) return [];

  return match[1]
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const quoted = item.match(/^\\"(.*)\\"$/s);
      return decodeJsonUnicodeEscapes(quoted ? quoted[1] : item);
    });
}

export function parseProductPage(html: string, fetchedUrl: string): RawGearsupplyProduct {
  const anchorIndex = html.indexOf('fullParentProduct');
  if (anchorIndex === -1) {
    throw new Error(`No fullParentProduct payload found on ${fetchedUrl} — page structure may have changed`);
  }

  // Comfortably covers id..categories on every product observed; name_embedding
  // (thousands of characters of floats) starts well past this and is never needed.
  const window = html.slice(anchorIndex, anchorIndex + 4000);

  const name = extractBetween(window, 'name', 'sku');
  const brandSlug = extractBetween(window, 'brand', 'categories');
  if (!name || !brandSlug) {
    throw new Error(`Missing name or brand in fullParentProduct on ${fetchedUrl}`);
  }

  const description = extractBetween(window, 'description', 'short_description') || null;
  const primaryImage = extractBetween(window, 'primary_image', 'brand') || null;
  const categoriesRaw = extractCategories(window);

  return {
    brandSlug,
    name: name.trim(),
    description,
    categoriesRaw,
    imageUrl: primaryImage,
  };
}
