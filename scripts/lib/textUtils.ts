/**
 * Every dealer site publishes a single combined "manufacturer + model" title
 * (e.g. "Panasonic ET-D3QW300 1.11-1.70:1 Projector Zoom Lens") rather than
 * separate fields — only GearSource's breadcrumb gives a clean pre-split
 * model. This strips a known manufacturer name off the front (case-insensitive)
 * to approximate the model. Falls back to the full title, un-stripped, when
 * the title doesn't actually start with the manufacturer name — still a
 * usable, searchable string, just not as clean.
 */
export function stripManufacturerPrefix(title: string, manufacturer: string): string {
  const trimmedTitle = title.trim();
  const trimmedManufacturer = manufacturer.trim();
  if (!trimmedManufacturer) return trimmedTitle;

  const lowerTitle = trimmedTitle.toLowerCase();
  const lowerManufacturer = trimmedManufacturer.toLowerCase();
  if (lowerTitle.startsWith(lowerManufacturer)) {
    return trimmedTitle.slice(trimmedManufacturer.length).trim();
  }
  return trimmedTitle;
}

export function stripHtml(html: string | null | undefined): string | null {
  if (!html) return null;
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text || null;
}

function decodeHtmlEntitiesOnce(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'");
}

/**
 * Some sources (usedavgear.com's Yoast-generated JSON-LD, observed 2026-07-18)
 * double-encode entities in category names — "Projection &amp;amp; Lenses" —
 * so this decodes repeatedly until stable, bounded to avoid looping forever
 * on pathological input.
 */
export function decodeHtmlEntities(text: string): string {
  let prev = text;
  let curr = decodeHtmlEntitiesOnce(text);
  let i = 0;
  while (curr !== prev && i < 3) {
    prev = curr;
    curr = decodeHtmlEntitiesOnce(curr);
    i++;
  }
  return curr;
}
