export type PlaceBidError =
  | "listing_not_found"
  | "not_biddable"
  | "bidding_not_open"
  | "auction_closed"
  | "below_opening_minimum"
  | "bid_too_low"
  | "ceiling_not_raised";

export interface PlaceBidResult {
  accepted: boolean;
  error?: PlaceBidError;
  /** Present on rejection when a valid minimum exists */
  minimum?: number;
  current_bid?: number;
  is_high_bidder?: boolean;
  /** User who should receive an outbid notification, if any */
  outbid_user_id?: string | null;
  extended?: boolean;
  auction_end?: string;
  reserve_met?: boolean;
}

export interface BidIncrementTier {
  /** Upper bound of the bracket, null = no upper bound */
  up_to: number | null;
  increment: number;
}
