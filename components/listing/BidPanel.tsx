"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";
import type { ListingDetail, PlaceBidError, PlaceBidResult } from "@/lib/auction/types";

interface BidPanelProps {
  listing: ListingDetail;
  onBidResult: (result: PlaceBidResult) => void;
}

// Friendly copy per place_bid() rejection code. minimum, when present on
// the result, is appended by the caller.
const ERROR_COPY: Record<PlaceBidError, string> = {
  listing_not_found: "This lot is no longer available.",
  not_biddable: "This lot is not open for bidding.",
  bidding_not_open: "Bidding hasn't opened on this lot yet.",
  auction_closed: "This lot has closed.",
  below_opening_minimum: "Your bid is below the opening minimum",
  bid_too_low: "Your bid is below the next minimum",
  ceiling_not_raised: "You're already the high bidder — a new max must raise your current ceiling.",
};

// The proxy max-bid panel — live state only; the page never renders this
// once a lot is sold. With no session everything renders disabled behind
// a "Sign in to bid" state linking to /auth; the panel picks the session
// up via onAuthStateChange the moment sign-in completes.
export function BidPanel({ listing, onBidResult }: BidPanelProps) {
  const [token, setToken] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    // Guarded like useListing: a Supabase client that can't init (missing
    // NEXT_PUBLIC_ env var) must degrade to signed-out, not crash the page.
    let supabase;
    try {
      supabase = createBrowserClient();
    } catch (e) {
      console.error("supabase client unavailable, rendering signed-out:", e);
      setAuthChecked(true);
      return;
    }
    void supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setAuthChecked(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signedIn = token != null;
  const isHighBidder = listing.viewer?.is_high_bidder ?? false;

  const placeBid = useCallback(async () => {
    if (!token || submitting) return;
    const maxBid = Number(input.replace(/[$,\s]/g, ""));
    if (!Number.isInteger(maxBid) || maxBid <= 0) {
      setFeedback({ kind: "error", text: "Enter a whole-dollar amount." });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/bids", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({ listingId: listing.id, maxBid }),
      });
      // Route-level rejections (401/429/500) return {error} without an
      // `accepted` field; place_bid outcomes always carry `accepted`.
      const result = (await res.json()) as PlaceBidResult | { error: string };

      if (!("accepted" in result)) {
        setFeedback({
          kind: "error",
          text:
            result.error === "rate_limited"
              ? "Too many bids too fast — give it a moment."
              : "Bid failed — try again.",
        });
        return;
      }

      if (result.accepted) {
        onBidResult(result);
        setInput("");
        setFeedback({
          kind: "success",
          text: result.is_high_bidder
            ? result.extended
              ? "You're the high bidder — and this lot just extended."
              : "You're the high bidder. We'll bid up to your max for you."
            : "Your max was outbid instantly by an existing proxy bid — raise it to take the lead.",
        });
      } else {
        const code = result.error as PlaceBidError | undefined;
        const base = code ? ERROR_COPY[code] : "Bid rejected.";
        const withMin =
          result.minimum != null && (code === "bid_too_low" || code === "below_opening_minimum")
            ? `${base} — bid at least $${result.minimum.toLocaleString()}.`
            : `${base}`;
        setFeedback({ kind: "error", text: withMin });
      }
    } catch {
      setFeedback({ kind: "error", text: "Network error — your bid was not placed." });
    } finally {
      setSubmitting(false);
    }
  }, [token, submitting, input, listing.id, onBidResult]);

  const minLine =
    listing.current_bid == null
      ? `Opening bid: $${listing.minimum_next_bid.toLocaleString()}`
      : `Next minimum bid: $${listing.minimum_next_bid.toLocaleString()}${
          listing.bid_increment != null ? ` · $${listing.bid_increment.toLocaleString()} increment` : ""
        }`;

  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-4">
      {isHighBidder && (
        <div className="mb-3 rounded-lg border border-[#1a5c38] bg-[#0d2218] px-3 py-2 text-xs font-medium text-[#22ee77]">
          You&apos;re the high bidder
        </div>
      )}

      <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[#999]">
        Your max bid <span className="normal-case text-[#666]">· we bid up to this for you</span>
      </label>
      <div className="flex gap-2">
        <div className="flex flex-1 items-center rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3">
          <span className="text-sm text-[#666]">$</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void placeBid();
            }}
            disabled={!signedIn || submitting}
            inputMode="numeric"
            placeholder={listing.minimum_next_bid.toLocaleString()}
            className="w-full bg-transparent py-2.5 pl-1 text-sm tabular-nums text-white placeholder-[#444] outline-none disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Your max bid in dollars"
          />
        </div>
        <button
          onClick={() => void placeBid()}
          disabled={!signedIn || submitting}
          className="rounded-lg bg-[#22ee77] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {!authChecked ? "…" : signedIn ? (submitting ? "Placing…" : "Place bid") : "Sign in to bid"}
        </button>
      </div>
      <div className="mt-2 text-xs tabular-nums text-[#666]">{minLine}</div>

      {authChecked && !signedIn && (
        <div className="mt-3 text-xs text-[#888]">
          <Link
            href={`/auth?next=${encodeURIComponent(`/listing/${listing.id}`)}`}
            className="text-[#4a7aaa] hover:underline"
          >
            Sign in or create an account
          </Link>{" "}
          to bid.
        </div>
      )}

      {feedback && (
        <div
          role="status"
          className={
            feedback.kind === "success"
              ? "mt-3 rounded-lg border border-[#1a5c38] bg-[#0d2218] px-3 py-2 text-xs text-[#22ee77]"
              : "mt-3 rounded-lg border border-[#6a1515] bg-[#2a0a0a] px-3 py-2 text-xs text-[#ff4444]"
          }
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
