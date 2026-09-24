"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GradeBadge } from "@/components/auction/GradeBadge";
import { LotCloseCountdown } from "@/components/countdown/LotCloseCountdown";
import { DELIST_LABELS, money } from "@/components/seller/SellerListingsList";
import { GRADE_NAMES, type Grade } from "@/lib/listings/gradeFromQc";
import { PHOTO_TYPES } from "@/lib/photos/rules";
import {
  GROUP_LABELS,
  type DelistReason,
  type SellerListingDetail as Detail,
  type WithdrawBlock,
} from "@/lib/seller/listings";

// The seller's view of one listing: status + what to do next, the photos
// exactly as buyers see them (blur regions + watermark, signed), and every
// field they submitted. Withdraw lives here, gated by the same rule the
// server enforces. Bidder identities never appear — only amounts/counts.

type State =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error" }
  | { status: "ready"; detail: Detail };

const TYPE_LABELS: Record<string, string> = { auction: "Friday auction", buy_it_now: "Buy it now", flash_listing: "Flash listing" };
const CATEGORY_LABEL: Record<string, string> = {
  led_video: "LED/Video", audio: "Audio", lighting: "Lighting", staging: "Staging", rigging: "Rigging", other: "Other",
};
const BLOCK_TEXT: Record<WithdrawBlock, string> = {
  auction_has_bids: "This auction already has bids, so bidders hold a commitment. Only AVauction can pull a lot mid-auction — contact us if something's wrong.",
  already_sold: "This listing sold.",
  already_ended: "This listing has ended.",
  already_withdrawn: "This listing was already withdrawn.",
};
const REASON_LABELS: Record<Exclude<DelistReason, "no_answer">, string> = {
  sold_on_platform: "Yes — it sold through AVauction",
  sold_privately: "No — it sold somewhere else",
  no_longer_selling: "No — I'm just not selling it anymore",
};

function typeLabel(v: string) {
  return PHOTO_TYPES.find((t) => t.value === v)?.label ?? v;
}
function yesNo(v: boolean | null | undefined) {
  return v == null ? "—" : v ? "Yes" : "No";
}

function StatusPanel({ d }: { d: Detail }) {
  const isLiveAuction = d.status === "active" && d.listing_type === "auction";
  return (
    <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-sm text-[#bbb]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#22ee77]">{GROUP_LABELS[d.group]}</span>
        {isLiveAuction && d.auction_end && <LotCloseCountdown target={d.auction_end} size="compact" />}
      </div>
      {d.status === "pending_review" && (
        <p className="mt-2">In the admin review queue. You&apos;ll be notified when it goes live.</p>
      )}
      {d.status === "active" && d.listing_type === "auction" && (
        <p className="mt-2">
          {d.current_bid != null ? (
            <>
              High bid <span className="font-semibold text-white">{money(d.current_bid)}</span> · {d.bid_count} bid
              {d.bid_count === 1 ? "" : "s"}
            </>
          ) : (
            "No bids yet"
          )}
          {d.watcher_count != null && <span className="text-[#666]"> · {d.watcher_count} watching</span>}
          {d.reserve_price != null && (
            <span className="block text-xs text-[#888]">
              Reserve {money(d.reserve_price)} · {(d.current_bid ?? 0) >= d.reserve_price ? "met" : "not met yet"}
            </span>
          )}
        </p>
      )}
      {d.status === "active" && d.listing_type === "buy_it_now" && (
        <p className="mt-2">
          Live at <span className="font-semibold text-white">{money(d.asking_price)}</span>
          {d.watcher_count != null && <span className="text-[#666]"> · {d.watcher_count} watching</span>}
        </p>
      )}
      {d.status === "draft" && (
        <div className="mt-2">
          <p className="rounded-lg border border-[#3a2a00] bg-[#1a1300] px-3 py-2 text-xs text-[#ffb020]">
            Returned from review{d.rejection_reason ? `: ${d.rejection_reason}` : ""}
          </p>
          <p className="mt-2 text-xs text-[#888]">
            <span className="text-[#bbb]">What you can do:</span> editing and resubmitting isn&apos;t available yet.
            Withdraw this listing below, then{" "}
            <Link href="/sell/new" className="text-[#4a7aaa] hover:underline">
              list the item again
            </Link>{" "}
            with the fix — it takes a couple of minutes and goes straight back into review.
          </p>
        </div>
      )}
      {d.status === "sold" && <p className="mt-2">Sold{d.current_bid != null ? ` for ${money(d.current_bid)}` : ""}. Ship within 48 hours of the buyer&apos;s payment — you&apos;ll get the details by email.</p>}
      {d.status === "expired" && <p className="mt-2">The auction closed without a sale and there was no asking price to fall back to. You can list it again any time.</p>}
      {d.status === "delisted" && (
        <p className="mt-2">Withdrawn{d.delist_reason ? ` — ${DELIST_LABELS[d.delist_reason] ?? d.delist_reason}` : ""}.</p>
      )}
      {(d.status === "active" || d.status === "sold") && d.listing_type === "auction" && (
        <Link href={`/listing/${d.id}`} className="mt-3 inline-block text-xs text-[#4a7aaa] hover:underline">
          View the public page →
        </Link>
      )}
    </div>
  );
}

function WithdrawPanel({ d, token, onDone }: { d: Detail; token: string; onDone: (next: Detail) => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<DelistReason | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(chosen: DelistReason) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/seller/listings/${d.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ delist_reason: chosen }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string; block?: WithdrawBlock };
      if (res.ok && body.ok) {
        onDone({ ...d, status: "delisted", group: "withdrawn", delist_reason: chosen, can_withdraw: false, withdraw_block: "already_withdrawn" });
      } else if (body.error === "not_withdrawable" && body.block) {
        setErr(BLOCK_TEXT[body.block]);
      } else {
        setErr("Couldn't withdraw the listing. Try again.");
      }
    } catch {
      setErr("Couldn't reach the server — check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!d.can_withdraw) {
    return d.withdraw_block ? <p className="mt-4 text-xs text-[#666]">{BLOCK_TEXT[d.withdraw_block]}</p> : null;
  }
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm text-[#999] hover:border-[#5c1a1a] hover:text-[#ff6b6b]"
      >
        Withdraw this listing
      </button>
    );
  }
  return (
    <div className="mt-4 rounded-xl border border-[#3a1a1a] bg-[#1a0d0d] p-4">
      <p className="text-sm font-medium text-white">Was this sold through AVauction.com?</p>
      <div className="mt-2 grid gap-2">
        {(Object.keys(REASON_LABELS) as (keyof typeof REASON_LABELS)[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setReason(r)}
            className={`rounded-lg border px-3 py-2 text-left text-sm ${
              reason === r ? "border-[#22ee77] bg-[#0d2218] text-white" : "border-[#2a2a2a] text-[#999]"
            }`}
          >
            {REASON_LABELS[r]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-[#888]">Skipping the question is recorded as no answer.</p>
      {err && <p className="mt-2 text-xs text-[#ff6b6b]">{err}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!reason || busy}
          onClick={() => reason && submit(reason)}
          className="rounded-lg bg-[#ff4444] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Withdrawing…" : "Withdraw"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => submit("no_answer")}
          className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm text-[#999]"
        >
          Skip &amp; withdraw
        </button>
        <button type="button" disabled={busy} onClick={() => setOpen(false)} className="px-3 py-2 text-sm text-[#666]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function SellerListingDetail({ id, token }: { id: string; token: string }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [photoIndex, setPhotoIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/seller/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.status === 404) {
          if (!cancelled) setState({ status: "not_found" });
          return;
        }
        if (!res.ok) throw new Error(`status ${res.status}`);
        const detail = (await res.json()) as Detail;
        if (!cancelled) setState({ status: "ready", detail });
      } catch (e) {
        console.error("seller listing detail load failed:", e);
        if (!cancelled) setState({ status: "error" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, token]);

  if (state.status === "loading") return <p className="text-sm text-[#666]">Loading…</p>;
  if (state.status === "not_found") return <p className="text-sm text-[#999]">This listing isn&apos;t one of yours, or it doesn&apos;t exist.</p>;
  if (state.status === "error") return <p className="text-sm text-[#ff4444]">Couldn&apos;t load this listing. Refresh to try again.</p>;

  const d = state.detail;
  const photo = d.photos[photoIndex] ?? d.photos[0];

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#4a7aaa]">
            {d.equipment ? `${d.equipment.manufacturer} · ${CATEGORY_LABEL[d.equipment.category] ?? d.equipment.category}` : "Listing"}
          </p>
          <h1 className="text-xl font-semibold leading-tight text-white">{d.title}</h1>
          <p className="mt-1 text-xs text-[#888]">
            {TYPE_LABELS[d.listing_type] ?? d.listing_type}
            {d.quantity > 1 && ` · Qty ${d.quantity}`}
            {d.condition_grade && <> · Grade {d.condition_grade} {GRADE_NAMES[d.condition_grade as Grade] ?? ""}</>}
            {d.grade_override && <span className="text-[#c9a227]"> (adjusted from suggested)</span>}
          </p>
        </div>
        {d.condition_grade && <GradeBadge grade={d.condition_grade} />}
      </div>

      <div className="mt-4">
        <StatusPanel d={d} />
      </div>

      {/* Photos — exactly what buyers see */}
      <section className="mt-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#666]">
          Photos · {d.photos.length} · shown as buyers see them
        </h2>
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-[#181818] text-[56px] text-[#2a2a2a]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo.url} alt={typeLabel(photo.photo_type)} className="h-full w-full object-contain" />
          ) : (
            <span aria-hidden>▦</span>
          )}
        </div>
        {photo && (
          <p className="mt-1 text-xs text-[#888]">
            {typeLabel(photo.photo_type)}
            {photo.position === 0 && " · cover"}
            {photo.blur_region_count > 0 && ` · ${photo.blur_region_count} area${photo.blur_region_count === 1 ? "" : "s"} blurred`}
            {photo.moderation_status !== "approved" && d.status !== "pending_review" && d.status !== "draft" && ` · ${photo.moderation_status}`}
          </p>
        )}
        {d.photos.length > 1 && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {d.photos.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setPhotoIndex(i)}
                className={`h-14 w-[72px] shrink-0 overflow-hidden rounded-md border ${i === photoIndex ? "border-[#22ee77]" : "border-[#222]"}`}
                aria-label={`Photo ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Everything submitted */}
      <section className="mt-6 rounded-xl border border-[#222] bg-[#111] p-4 text-sm">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#666]">What you submitted</h2>
        <dl className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-x-3 gap-y-2 text-xs">
          <dt className="text-[#888]">Product</dt><dd className="text-white">{d.equipment ? `${d.equipment.manufacturer} ${d.equipment.model}` : "—"}</dd>
          <dt className="text-[#888]">Asking price</dt><dd className="text-white">{money(d.asking_price)}</dd>
          {d.listing_type === "auction" && (<><dt className="text-[#888]">Reserve</dt><dd className="text-white">{d.reserve_price != null ? money(d.reserve_price) : "None"}</dd></>)}
          <dt className="text-[#888]">Zip code</dt><dd className="text-white">{d.zip_code}</dd>
          <dt className="text-[#888]">Hours of use</dt><dd className="text-white">{d.hours_of_use ?? "—"}</dd>
          <dt className="text-[#888]">Year of manufacture</dt><dd className="text-white">{d.year_of_manufacture ?? "—"}</dd>
          <dt className="text-[#888]">Purchase year</dt><dd className="text-white">{d.purchase_year ?? "—"}</dd>
          <dt className="text-[#888]">Serial numbers</dt><dd className="text-white">{d.serial_numbers.length ? d.serial_numbers.join(", ") : "—"}</dd>
          <dt className="text-[#888]">Flight case</dt><dd className="text-white">{yesNo(d.flight_case_included)}</dd>
          <dt className="text-[#888]">Known issues</dt><dd className="text-white">{d.known_issues}</dd>
          <dt className="text-[#888]">Description</dt><dd className="whitespace-pre-wrap text-white">{d.description ?? "—"}</dd>
          <dt className="text-[#888]">Submitted</dt><dd className="text-white">{new Date(d.created_at).toLocaleString()}</dd>
        </dl>
      </section>

      {d.qc && (
        <section className="mt-4 rounded-xl border border-[#222] bg-[#111] p-4 text-sm">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#666]">Condition checklist</h2>
          <dl className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-x-3 gap-y-2 text-xs">
            <dt className="text-[#888]">Powers on, full output</dt><dd className="text-white">{yesNo(d.qc.powers_on)}</dd>
            <dt className="text-[#888]">All original components</dt><dd className="text-white">{yesNo(d.qc.all_components)}</dd>
            <dt className="text-[#888]">Flight / road case</dt><dd className="text-white">{yesNo(d.qc.flight_case)}</dd>
            <dt className="text-[#888]">Cosmetic damage</dt><dd className="text-white">{d.qc.cosmetic_damage}</dd>
            <dt className="text-[#888]">Known technical issues</dt><dd className="text-white">{yesNo(d.qc.known_issues)}{d.qc.known_issues_description ? ` — ${d.qc.known_issues_description}` : ""}</dd>
            <dt className="text-[#888]">Serviced or repaired</dt><dd className="text-white">{yesNo(d.qc.serviced)}{d.qc.service_description ? ` — ${d.qc.service_description}` : ""}</dd>
            <dt className="text-[#888]">Serial confirmed</dt><dd className="text-white">{yesNo(d.qc.serial_confirmed)}</dd>
            <dt className="text-[#888]">Suggested grade</dt><dd className="text-white">{d.qc.suggested_grade ?? "—"}{d.qc.seller_accepted_grade ? " (accepted)" : " (you adjusted)"}</dd>
          </dl>
        </section>
      )}

      <WithdrawPanel d={d} token={token} onDone={(next) => setState({ status: "ready", detail: next })} />
    </div>
  );
}
