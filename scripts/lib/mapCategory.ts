/**
 * Keyword heuristic over scraped category/breadcrumb text, mapping to the
 * platform's five-value category enum (master_equipment.category). Not
 * authoritative for any source — every row lands with a status that admin
 * can correct, so this doesn't need to be exact, just a reasonable default.
 */
const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  { category: 'led_video', keywords: ['led', 'video wall', 'display', 'projector', 'media server', 'video'] },
  { category: 'audio', keywords: ['audio', 'speaker', 'microphone', 'mixer', 'amplifier', 'console'] },
  { category: 'lighting', keywords: ['lighting', 'light'] },
  { category: 'staging', keywords: ['staging', 'stage', 'truss', 'riser'] },
  { category: 'rigging', keywords: ['rigging', 'rig', 'hoist', 'motor chain', 'chain hoist'] },
];

export function mapCategory(categoryRaw: string | null): string {
  if (!categoryRaw) return 'other';
  const haystack = categoryRaw.toLowerCase();

  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return category;
    }
  }

  return 'other';
}
