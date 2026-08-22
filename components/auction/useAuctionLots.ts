"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AuctionSort, SearchListingResult, SearchListingsResponse } from "@/lib/auction/types";

const PER_PAGE = 24;

interface UseAuctionLotsArgs {
  sort: AuctionSort;
  zip?: string;
  /** Bump to force a fresh page-1 fetch even when sort/zip are unchanged
   *  — e.g. resubmitting the same zip to retry a failed nearest search. */
  refresh?: number;
}

interface UseAuctionLotsResult {
  lots: SearchListingResult[];
  total: number;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

// Wraps GET /api/search?type=auction — the only listing_type this page
// ever requests. Resets to page 1 and replaces results when sort/zip
// change; loadMore appends. sort=nearest is skipped (falls back to the
// default) until a zip is supplied, since search_listings() errors
// without one.
export function useAuctionLots({ sort, zip, refresh = 0 }: UseAuctionLotsArgs): UseAuctionLotsResult {
  const [lots, setLots] = useState<SearchListingResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const effectiveSort = sort === "nearest" && !zip ? "newly_listed" : sort;

  const fetchPage = useCallback(
    async (targetPage: number, append: boolean) => {
      const id = ++requestId.current;
      append ? setLoadingMore(true) : setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        type: "auction",
        sort: effectiveSort,
        page: String(targetPage),
        per_page: String(PER_PAGE),
      });
      if (effectiveSort === "nearest" && zip) params.set("zip", zip);

      try {
        const res = await fetch(`/api/search?${params.toString()}`);
        const data = (await res.json()) as SearchListingsResponse & { error?: string };
        if (id !== requestId.current) return; // stale response, a newer request superseded it

        if (!res.ok || data.error) {
          setError(data.error ?? "search_failed");
          return;
        }

        setTotal(data.total);
        setPage(data.page);
        setLots((prev) => (append ? [...prev, ...data.results] : data.results));
      } catch {
        if (id === requestId.current) setError("network_error");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    // refresh isn't read inside — it's a dep so a bump recreates this
    // callback and refires the page-1 effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveSort, zip, refresh]
  );

  useEffect(() => {
    void fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    void fetchPage(page + 1, true);
  }, [fetchPage, page]);

  return {
    lots,
    total,
    loading,
    loadingMore,
    error,
    hasMore: lots.length < total,
    loadMore,
  };
}
