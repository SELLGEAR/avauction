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

export type ConditionGrade = "A" | "B" | "C" | "D";

// One row of search_listings()'s `results` array — see
// supabase/migrations/0024_search_browse.sql. watcher_count is null
// whenever it's below pricing_engine_settings.min_watchers_to_display
// (social-proof threshold), not when it's zero.
export interface SearchListingResult {
  id: string;
  title: string;
  manufacturer: string;
  model: string;
  category: string;
  condition_grade: ConditionGrade;
  listing_type: "auction" | "buy_it_now" | "flash_listing";
  asking_price: number | null;
  current_bid: number | null;
  bid_count: number;
  auction_end: string | null;
  zip_code: string;
  quantity: number;
  effective_price: number | null;
  distance_miles: number | null;
  watcher_count: number | null;
  photo_url: string | null;
  is_watched?: boolean;
}

export interface SearchListingsResponse {
  total: number;
  page: number;
  per_page: number;
  results: SearchListingResult[];
}

export type AuctionSort = "ending_soonest" | "most_watched" | "nearest" | "price_low";
