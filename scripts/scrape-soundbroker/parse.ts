/**
 * SoundBroker listing pages use two different <title> templates depending on
 * which era of the site generated them — both verified live on 2026-07-18:
 *   "Listing - DIGICO SD7 - Detail - CONSOLE - SoundBroker.com"
 *   "For Sale - D&B AUDIOTECHNIK D6 AMPS - Listing Detail - SoundBroker.com"
 * Both give an ALL-CAPS "manufacturer + model" middle segment and, for the
 * first template only, a trailing category. Neither separates manufacturer
 * from model — that's done by the caller via stripManufacturerPrefix, using
 * the manufacturer name already known from which /manufacturers/ page this
 * listing was discovered under.
 */
export interface ParsedListingTitle {
  combinedTitle: string;
  categoryRaw: string | null;
}

const LISTING_TEMPLATE = /^Listing - (.+?) - Detail - (.+?) - SoundBroker\.com/;
const FOR_SALE_TEMPLATE = /^For Sale - (.+?) - Listing Detail - SoundBroker\.com/;

export function parseListingPage(html: string, fetchedUrl: string): ParsedListingTitle {
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const rawTitle = titleMatch?.[1]?.trim();
  if (!rawTitle) {
    throw new Error(`No <title> found on ${fetchedUrl}`);
  }

  const listingMatch = rawTitle.match(LISTING_TEMPLATE);
  if (listingMatch) {
    return { combinedTitle: listingMatch[1].trim(), categoryRaw: listingMatch[2].trim() };
  }

  const forSaleMatch = rawTitle.match(FOR_SALE_TEMPLATE);
  if (forSaleMatch) {
    return { combinedTitle: forSaleMatch[1].trim(), categoryRaw: null };
  }

  throw new Error(`Title didn't match a known template on ${fetchedUrl}: "${rawTitle}"`);
}
