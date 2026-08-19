"use client";

import { use, useState } from "react";
import Link from "next/link";
import { GradeBadge } from "@/components/auction/GradeBadge";
import { LotCloseCountdown } from "@/components/countdown/LotCloseCountdown";
import { BidPanel } from "@/components/listing/BidPanel";
import { useListing } from "@/components/listing/useListing";
import type { ListingDetail } from "@/lib/auction/types";

const CATEGORY_LABEL: Record<string, string> = {
  led_video: "LED/Video",
  audio: "Audio",
  lighting: "Lighting",
  staging: "Staging",
  rigging: "Rigging",
  other: "Other",
};

// The status-driven listing detail page. REVISED model (Aug 16, 2026):
// there is no pre-bid state — a lot is biddable the instant it's visible,
// so an active auction renders straight into the live state. States:
//   Live    — active auction: bid panel, this lot's own close countdown,
//             auto-extend notice inside the final N minutes
//   Closed  — sold: final price, no bid panel (checkout is a later slice)
//   Bumped  — reserve not met at close → the same row is now an active
//             buy-it-now listing; shown as a note + price, no checkout yet
// design/auction-detail.html is the layout reference but predates the
// revision — its pre-bid state is intentionally not built.
export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [urgent, setUrgent] = useState(false);
  const { listing, loading, error, applyBidResult } = useListing(id, urgent);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (loading) {
    return (
      <main className="mx-auto max-w-[920px] p-[22px] text-sm text-[#666]">Loading lot…</main>
    );
  }
  if (error === "not_found" || !listing) {
    return (
      <main className="mx-auto max-w-[920px] p-[22px]">
        <div className="text-sm text-[#999]">This lot doesn&apos;t exist or is no longer listed.</div>
        <Link href="/auction" className="mt-3 inline-block text-sm text-[#4a7aaa] hover:underline">
          ← Back to this week&apos;s auction
        </Link>
      </main>
    );
  }

  const isBuyNow = listing.listing_type === "buy_it_now";
  const isSold = listing.status === "sold";
  const isLiveAuction = listing.status === "active" && listing.listing_type === "auction";
  // Covers both native buy-it-now listings and auction lots auto-bumped
  // after a reserve-not-met close — close_auction_lot() nulls the auction
  // fields on bump, so the two are indistinguishable in the data. Copy
  // must stay neutral (never claim an auction history).
  const isActiveBuyNow = listing.status === "active" && isBuyNow;
  const photo = listing.photos[photoIndex] ?? listing.photos[0];

  return (
    <main className="mx-auto max-w-[920px] rounded-2xl bg-[#0a0a0a] p-[22px]">
      <Link href="/auction" className="mb-4 inline-block text-xs text-[#666] hover:text-[#999]">
        ← This week&apos;s auction
      </Link>

      <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
        {/* Photos */}
        <div>
          <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#181818] text-[56px] text-[#2a2a2a]">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo.url} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <span aria-hidden>▦</span>
            )}
            {listing.condition_grade && (
              <GradeBadge grade={listing.condition_grade} className="absolute left-3 top-3" />
            )}
            <StatusBadge isSold={isSold} isBuyNow={isBuyNow} isLive={isLiveAuction} urgent={urgent} />
          </div>
          {listing.photos.length > 1 && (
            <div className="mt-2 flex gap-2 overflow-x-auto">
              {listing.photos.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setPhotoIndex(i)}
                  className={`h-14 w-[72px] shrink-0 overflow-hidden rounded-md border ${
                    i === photoIndex ? "border-[#4a7aaa]" : "border-[#222]"
                  }`}
                  aria-label={`Photo ${i + 1}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right rail */}
        <div>
          <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#4a7aaa]">
            {listing.manufacturer} · {CATEGORY_LABEL[listing.category] ?? listing.category}
          </div>
          <h1 className="mb-4 text-xl font-semibold leading-tight text-white">{listing.title}</h1>

          {isSold && (
            <div className="rounded-xl border border-[#1a5c38] bg-[#0d2218] p-4">
              <div className="text-[11px] uppercase tracking-wider text-[#22ee77]">
                {isBuyNow ? "Sold" : "Sold — auction closed"}
              </div>
              {/* Buy-it-now sales never touch current_bid — the sale price
                  is the asking price (see purchase_buy_now, 0022) */}
              <div className="mt-1 text-[28px] font-semibold tabular-nums text-white">
                {(() => {
                  const finalPrice = isBuyNow ? listing.asking_price : listing.current_bid;
                  return finalPrice != null ? `$${finalPrice.toLocaleString()}` : "—";
                })()}
              </div>
              {!isBuyNow && (
                <div className="mt-1 text-xs text-[#888]">
                  {listing.bid_count} bid{listing.bid_count === 1 ? "" : "s"}
                </div>
              )}
            </div>
          )}

          {isActiveBuyNow && (
            <div className="rounded-xl border border-[#222] bg-[#111] p-4">
              <div className="text-xs text-[#999]">Available buy-it-now.</div>
              {listing.asking_price != null && (
                <div className="mt-2 text-[24px] font-semibold tabular-nums text-white">
                  ${listing.asking_price.toLocaleString()}
                </div>
              )}
            </div>
          )}

          {isLiveAuction && (
            <>
              <div className="mb-3 rounded-xl border border-[#222] bg-[#111] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="mb-[3px] text-[11px] uppercase tracking-wider text-[#888]">
                      Current bid
                    </div>
                    <div className="text-[26px] font-semibold leading-none tabular-nums text-white">
                      {listing.current_bid != null
                        ? `$${listing.current_bid.toLocaleString()}`
                        : "No bids yet"}
                    </div>
                  </div>
                  {listing.auction_end && (
                    <LotCloseCountdown
                      target={listing.auction_end}
                      onUrgentChange={setUrgent}
                      className="text-right"
                    />
                  )}
                </div>
                <div className="mt-3 flex items-center gap-4 border-t border-[#1e1e1e] pt-3 text-xs text-[#888]">
                  <span>
                    ⚖ {listing.bid_count} bid{listing.bid_count === 1 ? "" : "s"}
                  </span>
                  {listing.watcher_count != null && <span>👁 {listing.watcher_count} watching</span>}
                  {listing.has_reserve ? (
                    <span className={`ml-auto ${listing.reserve_met ? "text-[#22ee77]" : "text-[#ff8c00]"}`}>
                      {listing.reserve_met ? "Reserve met" : "Reserve not met"}
                    </span>
                  ) : (
                    <span className="ml-auto text-[#22ee77]">No reserve</span>
                  )}
                </div>
              </div>

              <BidPanel listing={listing} onBidResult={applyBidResult} />

              {urgent && (
                <div className="mt-3 rounded-lg border border-[#6a1515] bg-[#2a0a0a] px-3 py-2 text-xs text-[#ff4444]">
                  A bid in the final {listing.auto_extend_minutes} min extends this lot{" "}
                  {listing.auto_extend_minutes} more minutes
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="mt-6 grid gap-4 md:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#999]">
            Description
          </div>
          {listing.description ? (
            <p className="text-sm leading-relaxed text-[#ccc]">{listing.description}</p>
          ) : (
            <p className="text-sm text-[#666]">No description provided.</p>
          )}
          <SpecGrid listing={listing} />
        </div>

        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-[#999]">Seller</div>
          <div className="mb-1 text-sm font-semibold text-white">
            {listing.seller.anonymous_username ?? "Verified Seller"}
            {listing.seller.industry_verified && (
              <span className="ml-2 rounded-md border border-[#1a3a5c] bg-[#0d1822] px-[6px] py-[2px] text-[9px] font-bold uppercase tracking-wider text-[#4a7aaa]">
                Industry Verified
              </span>
            )}
          </div>
          <div className="mb-3 text-xs text-[#666]">
            {listing.seller.display_location ?? "Identity revealed after escrow"}
          </div>
          <div className="space-y-1.5 border-t border-[#1e1e1e] pt-3 text-xs text-[#999]">
            <div className="flex justify-between">
              <span>Escrow protected</span>
              <span className="text-[#22ee77]">✓</span>
            </div>
            <div className="flex justify-between">
              <span>72-hr inspection window</span>
              <span className="text-[#22ee77]">✓</span>
            </div>
            <div className="flex justify-between">
              <span>Ships from seller</span>
              <span className="text-[#22ee77]">✓</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function StatusBadge({
  isSold,
  isBuyNow,
  isLive,
  urgent,
}: {
  isSold: boolean;
  isBuyNow: boolean;
  isLive: boolean;
  urgent: boolean;
}) {
  if (isSold) {
    return (
      <span className="absolute right-3 top-3 rounded-md border border-[#2a2a2a] bg-[#141414] px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-wider text-[#999]">
        {isBuyNow ? "Sold" : "Auction closed"}
      </span>
    );
  }
  if (!isLive) return null;
  return (
    <span
      className={`absolute right-3 top-3 flex items-center gap-1.5 rounded-md border px-[7px] py-[3px] text-[9px] font-bold uppercase tracking-wider ${
        urgent
          ? "border-[#6a1515] bg-[#2a0a0a] text-[#ff4444]"
          : "border-[#1a5c38] bg-[#0d2218] text-[#22ee77]"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 animate-pulse rounded-full ${urgent ? "bg-[#ff4444]" : "bg-[#22ee77]"}`}
      />
      {urgent ? "Closing soon" : "Live auction"}
    </span>
  );
}

function SpecGrid({ listing }: { listing: ListingDetail }) {
  const rows: Array<[string, string]> = [];
  if (listing.condition_grade) rows.push(["Condition", `Grade ${listing.condition_grade}`]);
  if (listing.quantity > 1) rows.push(["Quantity", String(listing.quantity)]);
  if (listing.hours_of_use != null) rows.push(["Hours of use", `~${listing.hours_of_use.toLocaleString()}`]);
  if (listing.year_of_manufacture != null) rows.push(["Year", String(listing.year_of_manufacture)]);
  if (listing.flight_case_included != null)
    rows.push(["Flight case", listing.flight_case_included ? "Included" : "Not included"]);
  rows.push(["Location", `Ships from ${listing.zip_code}`]);

  return (
    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-[#1e1e1e] pt-3">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between text-xs">
          <span className="text-[#666]">{k}</span>
          <span className="text-[#ccc]">{v}</span>
        </div>
      ))}
    </div>
  );
}
