"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GradeBadge } from "@/components/auction/GradeBadge";
import { LotCloseCountdown } from "@/components/countdown/LotCloseCountdown";
import { GRADE_NAMES, type Grade } from "@/lib/listings/gradeFromQc";
import {
  GROUP_LABELS,
  GROUP_ORDER,
  type SellerGroup,
  type SellerListingRow,
} from "@/lib/seller/listings";

// The seller's own listings via GET /api/seller/listings (service role,
// scoped by seller_id server-side). Grouped by state, with a filter row.
// Every row links to the seller detail view — including buy-it-now rows
// and returned drafts, which have no public page.
//
// State → group is defined in lib/seller/listings.ts. There is no
// 'rejected' status: rejection returns a listing to 'draft' with
// rejection_reason (0035). Edit/resubmit of returned drafts is still out
// of scope (loose end #17a); the row says what the seller CAN do.

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; listings: SellerListingRow[] };

const TYPE_LABELS: Record<string, string> = {
  auction: "Auction",
  buy_it_now: "Buy it now",
  flash_listing: "Flash listing",
};

export const DELIST_LABELS: Record<string, string> = {
  sold_on_platform: "sold through AVauction",
  sold_privately: "sold privately",
  no_longer_selling: "no longer selling",
  no_answer: "no reason given",
};

export function money(n: number | null): string {
  if (n == null) return "—";
  return `$${Number(n).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function ListingRow({ listing }: { listing: SellerListingRow }) {
  const isLiveAuction = listing.status === "active" && listing.listing_type === "auction";
  return (
    <Link
      href={`/seller/listings/${listing.id}`}
      className="block rounded-xl border border-[#222] bg-[#111] p-3 transition-colors hover:border-[#3a3a3a]"
    >
      <div className="flex gap-3">
        <div className="relative h-16 w-[84px] shrink-0 overflow-hidden rounded-md bg-[#181818]">
          {listing.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#333]">▦</div>
          )}
          {listing.photo_count > 1 && (
            <span className="absolute bottom-1 right-1 rounded bg-black/70 px-1 text-[10px] text-[#bbb]">
              {listing.photo_count}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
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

          <div className="mt-1.5 flex items-center justify-between gap-3 text-xs">
            <span className="text-[#bbb]">
              {listing.listing_type === "auction" && listing.current_bid != null ? (
                <>
                  {money(listing.current_bid)}{" "}
                  <span className="text-[#666]">
                    · {listing.bid_count} bid{listing.bid_count === 1 ? "" : "s"}
                  </span>
                </>
              ) : isLiveAuction ? (
                "No bids yet"
              ) : (
                <>Asking {money(listing.asking_price)}</>
              )}
              {listing.watcher_count != null && (
                <span className="text-[#666]"> · {listing.watcher_count} watching</span>
              )}
            </span>
            {isLiveAuction && listing.auction_end && (
              <LotCloseCountdown target={listing.auction_end} size="compact" />
            )}
          </div>
        </div>
      </div>

      {listing.status === "draft" && (
        <div className="mt-2 rounded-lg border border-[#3a2a00] bg-[#1a1300] px-3 py-2 text-xs text-[#ffb020]">
          Returned from review{listing.rejection_reason ? `: ${listing.rejection_reason}` : ""}.
          <span className="text-[#bb8a2a]"> Open it to see what you can do next.</span>
        </div>
      )}
      {listing.status === "delisted" && (
        <p className="mt-2 text-xs text-[#666]">
          Withdrawn{listing.delist_reason ? ` — ${DELIST_LABELS[listing.delist_reason] ?? listing.delist_reason}` : ""}
        </p>
      )}
    </Link>
  );
}

function Group({ group, listings }: { group: SellerGroup; listings: SellerListingRow[] }) {
  if (listings.length === 0) return null;
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666]">
        {GROUP_LABELS[group]} · {listings.length}
      </h2>
      <div className="grid gap-2">
        {listings.map((l) => (
          <ListingRow key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}

export function SellerListingsList({ token }: { token: string }) {
  const [state, setState] = useState<ListState>({ status: "loading" });
  const [filter, setFilter] = useState<SellerGroup | "all">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/seller/listings", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as { listings: SellerListingRow[] };
        if (!cancelled) setState({ status: "ready", listings: body.listings });
      } catch (e) {
        console.error("seller listings load failed:", e);
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

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
        <p className="mt-1 text-xs text-[#888]">
          Find it in the catalog, answer the condition checklist, add photos, set a price — one item at a time.
        </p>
        <Link href="/sell/new" className="mt-3 inline-block rounded-lg bg-[#22ee77] px-4 py-2 text-sm font-semibold text-[#0a0a0a]">
          List your first item
        </Link>
      </div>
    );
  }

  const counts = new Map<SellerGroup, number>();
  for (const l of listings) counts.set(l.group, (counts.get(l.group) ?? 0) + 1);
  const groupsPresent = GROUP_ORDER.filter((g) => (counts.get(g) ?? 0) > 0);
  const visible = filter === "all" ? listings : listings.filter((l) => l.group === filter);

  return (
    <div>
      {groupsPresent.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {(["all", ...groupsPresent] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setFilter(g)}
              className={`rounded-full border px-2.5 py-1 text-xs ${
                filter === g
                  ? "border-[#22ee77] bg-[#0d2218] text-white"
                  : "border-[#2a2a2a] text-[#999] hover:border-[#3a3a3a]"
              }`}
            >
              {g === "all" ? `All · ${listings.length}` : `${GROUP_LABELS[g]} · ${counts.get(g)}`}
            </button>
          ))}
        </div>
      )}
      {GROUP_ORDER.map((g) => (
        <Group key={g} group={g} listings={visible.filter((l) => l.group === g)} />
      ))}
    </div>
  );
}
