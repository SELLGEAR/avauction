"use client";

import { useCountdown } from "./useCountdown";

interface CountdownCellsProps {
  target: string | Date;
  caption: string;
  size?: "default" | "compact";
}

// Neutral 3-cell Days/Hours/Min display. REVISED Aug 16, 2026: bidding now
// opens at the Monday-noon drop for every lot simultaneously, so there is
// no more pre-bid state to count down to on the browse or listing pages.
// The only remaining context for this component is the between-auctions
// "next drop" countdown — the browse page header and marketplace banner
// State 3, both retargeted to nextAuctionDropET() (lib/time/auctionSchedule).
// Never turns red and never shows seconds. See LotCloseCountdown for the
// lot-closing countdown, now the primary countdown in the product, which
// does carry urgency treatment.
//
// Design reference: design/countdown-reference.html ("Pre-bid" panel) —
// predates this revision; the panel it describes no longer exists as a
// listing-page state, but the same 3-cell visual applies to the
// between-auctions countdown.
export function CountdownCells({ target, caption, size = "default" }: CountdownCellsProps) {
  const { days, hours, minutes } = useCountdown(target);

  const cells = [
    { value: days, label: "Days" },
    { value: hours, label: size === "compact" ? "Hrs" : "Hours" },
    { value: minutes, label: "Min" },
  ];

  if (size === "compact") {
    return (
      <div className="rounded-xl border border-[#1a3060] bg-[#0d1420] px-4 py-3">
        <div className="mb-2 text-center text-[10px] font-bold uppercase tracking-wider text-[#888]">
          {caption}
        </div>
        <div className="flex gap-1.5">
          {cells.map((c) => (
            <div key={c.label} className="min-w-[48px] rounded-md bg-[#0a0a0a] px-3 py-2 text-center">
              <div className="text-[22px] font-semibold leading-none tabular-nums text-white">
                {c.value}
              </div>
              <div className="mt-1 text-[9px] uppercase tracking-wide text-[#666]">{c.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1a3060] bg-[#0d1420] px-[18px] py-4">
      <div className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-[#888]">
        {caption}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="rounded-lg bg-[#0a0a0a] py-3.5 text-center">
            <div className="text-[30px] font-semibold leading-none tabular-nums text-white">
              {c.value}
            </div>
            <div className="mt-[7px] text-[10px] uppercase tracking-wide text-[#666]">{c.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
