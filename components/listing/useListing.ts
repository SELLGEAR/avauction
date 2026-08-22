"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { bidIncrement } from "@/lib/auction/increments";
import type { ListingDetail, PlaceBidResult } from "@/lib/auction/types";

const POLL_MS = 10_000;
const POLL_URGENT_MS = 3_000;

interface UseListingResult {
  listing: ListingDetail | null;
  loading: boolean;
  error: "not_found" | "load_failed" | null;
  refetch: () => void;
  /** Fold an accepted PlaceBidResult into local state so the UI updates
   *  before the next poll (auto-extend's new auction_end included). */
  applyBidResult: (result: PlaceBidResult) => void;
}

// Fetch + poll for the listing detail page. Realtime is a follow-up slice
// — polling is cheap, correct, and replaceable. The interval tightens in
// the final auto-extend window (`urgent`, driven by LotCloseCountdown's
// onUrgentChange) and stops entirely once the listing is sold. Sends the
// Supabase session token when one exists so the response includes the
// viewer block; anonymous requests get the same listing without it.
export function useListing(id: string, urgent: boolean): UseListingResult {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<"not_found" | "load_failed" | null>(null);
  const requestId = useRef(0);

  const fetchListing = useCallback(
    async (background: boolean) => {
      const rid = ++requestId.current;
      if (!background) setLoading(true);

      try {
        // Session lookup is best-effort: if the Supabase browser client
        // can't init (e.g. missing NEXT_PUBLIC_ env var), degrade to an
        // anonymous request rather than failing the whole page — the
        // listing itself needs no auth.
        let token: string | undefined;
        try {
          const { data } = await createBrowserClient().auth.getSession();
          token = data.session?.access_token;
        } catch (e) {
          console.error("supabase client unavailable, fetching anonymously:", e);
        }
        const res = await fetch(`/api/listings/${id}`, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
          cache: "no-store",
        });
        if (rid !== requestId.current) return; // superseded by a newer request

        if (res.status === 404) {
          setError("not_found");
          setListing(null);
          return;
        }
        if (!res.ok) {
          // Keep showing the last good data on a failed background poll
          if (!background) setError("load_failed");
          return;
        }
        setListing((await res.json()) as ListingDetail);
        setError(null);
      } catch {
        if (rid === requestId.current && !background) setError("load_failed");
      } finally {
        if (rid === requestId.current && !background) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void fetchListing(false);
  }, [fetchListing]);

  // Refetch on sign-in/sign-out so the viewer block (high-bidder pill,
  // watch state) appears or disappears immediately instead of waiting out
  // a poll interval — and polling never runs on closed lots, so without
  // this the viewer block would never update there at all.
  useEffect(() => {
    let supabase;
    try {
      supabase = createBrowserClient();
    } catch {
      return; // no client → no session changes to react to
    }
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void fetchListing(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchListing]);

  const isLiveAuction = listing?.status === "active" && listing.listing_type === "auction";

  useEffect(() => {
    if (!isLiveAuction) return;
    const interval = setInterval(
      () => void fetchListing(true),
      urgent ? POLL_URGENT_MS : POLL_MS
    );
    return () => clearInterval(interval);
  }, [fetchListing, isLiveAuction, urgent]);

  // Foreground refetch — shows the loading state and surfaces errors.
  // Used by the page's Retry button after a failed load; background polls
  // use fetchListing(true) directly.
  const refetch = useCallback(() => {
    void fetchListing(false);
  }, [fetchListing]);

  const applyBidResult = useCallback((result: PlaceBidResult) => {
    if (!result.accepted) return;
    setListing((prev) => {
      if (!prev) return prev;
      const newCurrent = result.current_bid ?? prev.current_bid;
      // Recompute the next-minimum locally so BidPanel's "Next minimum
      // bid" line doesn't lag a poll interval behind an accepted bid.
      // Uses DEFAULT_INCREMENT_TIERS — if the admin panel ever changes
      // the ladder this drifts until the next poll, which the server's
      // own values then correct.
      const newIncrement = newCurrent != null ? bidIncrement(newCurrent) : prev.bid_increment;
      return {
        ...prev,
        current_bid: newCurrent,
        auction_end: result.auction_end ?? prev.auction_end,
        reserve_met: result.reserve_met ?? prev.reserve_met,
        minimum_next_bid:
          newCurrent != null && newIncrement != null
            ? newCurrent + newIncrement
            : prev.minimum_next_bid,
        bid_increment: newIncrement,
        // A first bid right after sign-in can land before any
        // token-carrying poll, so viewer may still be null here — promote
        // it from the bid result. is_watched: false is a safe default the
        // next poll corrects.
        viewer: prev.viewer
          ? { ...prev.viewer, is_high_bidder: result.is_high_bidder ?? prev.viewer.is_high_bidder }
          : result.is_high_bidder != null
            ? { is_high_bidder: result.is_high_bidder, is_watched: false }
            : prev.viewer,
      };
    });
  }, []);

  return { listing, loading, error, refetch, applyBidResult };
}
