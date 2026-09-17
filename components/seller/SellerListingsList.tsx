"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import { GradeBadge } from "@/components/auction/GradeBadge";
import { LotCloseCountdown } from "@/components/countdown/LotCloseCountdown";
import { GRADE_NAMES, type Grade } from "@/lib/listings/gradeFromQc";

// The seller's own listings, read directly through RLS
// (listings_seller_read_own, 0007) with the browser client — no API route.
// The seller_id filter matters: the public-read-active policy would
// otherwise include OTHER sellers' live listings in the result.
//
// Status → group mapping. There is no 'rejected' status: rejection returns
// a listing to 'draft' with rejection_reason set (0035), and since
// submit_listing only ever creates at 'pending_review', a draft here IS a
// returned listing. Edit/resubmit of returned drafts is out of scope
// (loose end, Sept 17 2026).

interface SellerListing {
  id: string;
  title: string;
  status: string;
  listing_type: string;
  condition_grade: string | null;
  asking_price: number | null;
  reserve_price: number | null;
  current_bid: number | null;
  bid_count: number;
  quantity: number;
  auction_end: string | null;
  rejection_reason: string | null;
  created_at: string;
}

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; listings: SellerListing[] };

const TYPE_LABELS: Record<string, string> = {
  auction: "Auction",
  buy_it_now: "Buy it now",
  flash_listing: "Flash listing",
};

function money(n: number | null): string {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function ListingRow({ listing }: { listing: SellerListing }) {
  const isLiveAuction = listing.status === "active" && listing.listing_type === "auction";
  // The detail page serves the auction experience today (buy-it-now gets
  // its own treatment later) — only link rows it renders correctly.
  const href =
    listing.listing_type === "auction" && (listing.status === "active" || listing.status === "sold")
      ? `/listing/${listing.id}`
      : null;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{listing.title}</p>
          <p className="mt-0.5 text-xs text-[#888]">
            {TYPE_LABELS[listing.listing_type] ?? listing.listing_type}
            {listing.quantity > 1 && ` · Qty ${listing.quantity}`}
            {listing.condition_grade && (
              <> · Grade {listing.condition_grade} {GRADE_NAMES[listing.condition_grade as Grade] ?? ""}</>
            )}
          </p>
        </div>
        {listing.condition_grade && <GradeBadge grade={listing.condition_grade} />}
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="text-[#bbb]">
          {listing.listing_type === "auction" ? (
            listing.current_bid != null ? (
              <>
                {money(listing.current_bid)}{" "}
                <span className="text-[#666]">
                  · {listing.bid_count} bid{listing.bid_count === 1 ? "" : "s"}
                </span>
              </>
            ) : listing.status === "active" ? (
              "No bids yet"
            ) : (
              <>Asking {money(listing.asking_price)}</>
            )
          ) : (
            <>Asking {money(listing.asking_price)}</>
          )}
        </span>
        {isLiveAuction && listing.auction_end && (
          <LotCloseCountdown target={listing.auction_end} size="compact" />
        )}
      </div>

      {listing.status === "draft" && listing.rejection_reason && (
        <div className="mt-2 rounded-lg border border-[#3a2a00] bg-[#1a1300] px-3 py-2 text-xs text-[#ffb020]">
          Returned from review: {listing.rejection_reason}
        </div>
      )}
    </>
  );

  const rowClass = "block rounded-xl border border-[#222] bg-[#111] p-3.5";
  return href ? (
    <Link href={href} className={`${rowClass} transition-colors hover:border-[#3a3a3a]`}>
      {body}
    </Link>
  ) : (
    <div className={rowClass}>{body}</div>
  );
}

function Group({ title, listings }: { title: string; listings: SellerListing[] }) {
  if (listings.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666]">
        {title} · {listings.length}
      </h2>
      <div className="grid gap-2">
        {listings.map((l) => (
          <ListingRow key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}

export function SellerListingsList({ sellerId }: { sellerId: string }) {
  const [state, setState] = useState<ListState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = createBrowserClient();
        const { data, error } = await supabase
          .from("listings")
          .select(
            "id, title, status, listing_type, condition_grade, asking_price, reserve_price, current_bid, bid_count, quantity, auction_end, rejection_reason, created_at"
          )
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        if (!cancelled) setState({ status: "ready", listings: (data ?? []) as SellerListing[] });
      } catch (e) {
        console.error("seller listings load failed:", e);
        if (!cancelled) setState({ status: "error" });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [sellerId]);

  if (state.status === "loading") {
    return <p className="text-sm text-[#666]">Loading your listings…</p>;
  }
  if (state.status === "error") {
    return (
      <p className="text-sm text-[#ff4444]">
        Couldn&apos;t load your listings. Refresh the page to try again.
      </p>
    );
  }

  const { listings } = state;
  if (listings.length === 0) {
    return (
      <div className="rounded-xl border border-[#222] bg-[#111] p-4">
        <p className="text-sm text-[#bbb]">You haven&apos;t listed any gear yet.</p>
        <Link href="/sell/new" className="mt-2 inline-block text-xs text-[#4a7aaa] hover:underline">
          List your first item →
        </Link>
      </div>
    );
  }

  const byStatus = (...statuses: string[]) => listings.filter((l) => statuses.includes(l.status));

  return (
    <div>
      <Group title="In review" listings={byStatus("pending_review")} />
      <Group title="Live" listings={byStatus("active")} />
      <Group title="Returned from review" listings={byStatus("draft")} />
      <Group title="Ended" listings={byStatus("sold", "expired", "delisted")} />
    </div>
  );
}
