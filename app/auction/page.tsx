"use client";

import { useEffect, useMemo, useState } from "react";
import { CountdownCells } from "@/components/countdown/CountdownCells";
import { LotCard } from "@/components/auction/LotCard";
import { SortChips } from "@/components/auction/SortChips";
import { useAuctionLots } from "@/components/auction/useAuctionLots";
import { nextAuctionDropET } from "@/lib/time/auctionSchedule";
import type { AuctionSort } from "@/lib/auction/types";

const ZIP_STORAGE_KEY = "avauction_buyer_zip";

// The main auction page — the front door. REVISED Aug 16, 2026: every lot
// is live and biddable from the Monday-noon drop, all week, so cards carry
// real bid/countdown data (design/auction-browse.html predates this
// revision and still shows the old pre-bid-only cards). There is no more
// shared "bidding opens in" countdown while lots are live — the header
// only shows a countdown (to the next Monday-noon drop) during the gap
// between auctions, when there are zero lots.
export default function AuctionBrowsePage() {
  const nextDropAt = useMemo(() => nextAuctionDropET(), []);
  const [sort, setSort] = useState<AuctionSort>("ending_soonest");
  const [zip, setZip] = useState<string | undefined>(undefined);

  useEffect(() => {
    const stored = window.localStorage.getItem(ZIP_STORAGE_KEY);
    if (stored) setZip(stored);
  }, []);

  function handleSubmitZip(newZip: string) {
    window.localStorage.setItem(ZIP_STORAGE_KEY, newZip);
    setZip(newZip);
    setSort("nearest");
  }

  const { lots, total, loading, loadingMore, error, hasMore, loadMore } = useAuctionLots({
    sort,
    zip,
  });

  return (
    <main className="mx-auto max-w-[920px] rounded-2xl bg-[#0a0a0a] p-[22px]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-[#1a1a1a] pb-5">
        <div>
          <div className="mb-2 text-xs font-bold uppercase tracking-wider text-[#4a7aaa]">
            New drops every Monday · Auctions on Friday
          </div>
          <h1 className="text-2xl font-semibold text-white">
            This week{loading && total === 0 ? "" : ` · ${total} lot${total === 1 ? "" : "s"}`}
          </h1>
          <div className="mt-1 text-[13px] text-[#666]">
            Pro audio, lighting &amp; video · bidding open all week · closes begin Friday at noon ET
          </div>
        </div>
        {!loading && !error && total === 0 && (
          <CountdownCells target={nextDropAt} caption="Next drop in" size="compact" />
        )}
      </div>

      <div className="mb-[18px]">
        <SortChips sort={sort} hasZip={!!zip} onSelect={setSort} onSubmitZip={handleSubmitZip} />
      </div>

      {error && (
        <div className="rounded-lg border border-[#6a1515] bg-[#2a0a0a] px-4 py-3 text-sm text-[#ff8080]">
          Couldn&apos;t load this week&apos;s lots. Try refreshing.
        </div>
      )}

      {!error && loading && lots.length === 0 && (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-[#222] bg-[#111]">
              <div className="aspect-[4/3] bg-[#181818]" />
              <div className="space-y-2 px-[13px] py-3">
                <div className="h-2.5 w-1/3 rounded bg-[#1a1a1a]" />
                <div className="h-4 w-4/5 rounded bg-[#1a1a1a]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!error && !loading && lots.length === 0 && (
        <div className="rounded-lg border border-[#222] bg-[#111] px-4 py-10 text-center text-sm text-[#888]">
          No lots match this week — check back Monday for the next drop.
        </div>
      )}

      {lots.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {lots.map((lot) => (
              <LotCard key={lot.id} lot={lot} />
            ))}
          </div>

          {hasMore && (
            <div className="mt-[18px] text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-lg border border-[#2a2a2a] px-7 py-2.5 text-[13px] font-medium text-[#999] hover:border-[#3a3a3a] disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : `Load ${total - lots.length} more lots`}
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
