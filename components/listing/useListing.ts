"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
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
        const { data } = await createBrowserClient().auth.getSession();
        const token = data.session?.access_token;
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

  const isLiveAuction = listing?.status === "active" && listing.listing_type === "auction";

  useEffect(() => {
    if (!isLiveAuction) return;
    const interval = setInterval(
      () => void fetchListing(true),
      urgent ? POLL_URGENT_MS : POLL_MS
    );
    return () => clearInterval(interval);
  }, [fetchListing, isLiveAuction, urgent]);

  const refetch = useCallback(() => {
    void fetchListing(true);
  }, [fetchListing]);

  const applyBidResult = useCallback((result: PlaceBidResult) => {
    if (!result.accepted) return;
    setListing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        current_bid: result.current_bid ?? prev.current_bid,
        auction_end: result.auction_end ?? prev.auction_end,
        reserve_met: result.reserve_met ?? prev.reserve_met,
        viewer: prev.viewer
          ? { ...prev.viewer, is_high_bidder: result.is_high_bidder ?? prev.viewer.is_high_bidder }
          : prev.viewer,
      };
    });
  }, []);

  return { listing, loading, error, refetch, applyBidResult };
}
