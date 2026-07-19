import type { BidIncrementTier } from "./types";

// Mirror of the ladder seeded in pricing_engine_settings
// (bid_increment_tiers). The database function is authoritative — this
// mirror exists for client-side validation and "minimum bid" UI display.
// If the admin panel changes the setting, fetch it rather than relying on
// these defaults.
export const DEFAULT_INCREMENT_TIERS: BidIncrementTier[] = [
  { up_to: 500, increment: 25 },
  { up_to: 2500, increment: 50 },
  { up_to: 10000, increment: 100 },
  { up_to: 25000, increment: 250 },
  { up_to: 100000, increment: 500 },
  { up_to: null, increment: 1000 },
];

export function bidIncrement(
  currentBid: number,
  tiers: BidIncrementTier[] = DEFAULT_INCREMENT_TIERS
): number {
  for (const tier of tiers) {
    if (tier.up_to === null || currentBid < tier.up_to) return tier.increment;
  }
  return tiers[tiers.length - 1]?.increment ?? 1000;
}

export function minimumNextBid(
  currentBid: number,
  tiers: BidIncrementTier[] = DEFAULT_INCREMENT_TIERS
): number {
  return currentBid + bidIncrement(currentBid, tiers);
}
