"use client";

import { useEffect } from "react";
import { useCountdown } from "./useCountdown";
import { AUCTION_AUTO_EXTEND_MINUTES } from "@/lib/time/auctionSchedule";

interface LotCloseCountdownProps {
  target: string | Date;
  label?: string;
  size?: "default" | "compact";
  onUrgentChange?: (isUrgent: boolean) => void;
  className?: string;
}

// Final N minutes (tunable — see AUCTION_AUTO_EXTEND_MINUTES): seconds
// appear, the value turns red, and this is also the window in which a bid
// triggers auto-extend on the server. Keep this derived from the same
// constant the server-side window uses, not a separate magic number — the
// visual urgency threshold and the actual auto-extend trigger must agree.
const URGENT_THRESHOLD_SECONDS = AUCTION_AUTO_EXTEND_MINUTES * 60;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Precision scales with proximity; color is a signal, not decoration.
// Neutral days/hours or hours/minutes while a lot is live earlier in the
// week or earlier in the Friday stagger queue; switches to minutes:seconds
// in red only for the final N minutes of that lot's close. This is the
// primary countdown in the product — every lot is live and counting toward
// its own close from the Monday-noon drop onward, so this is the only
// countdown a buyer sees once an auction week is underway (see
// CountdownCells for the between-auctions "next drop" countdown, which is
// the only other context a countdown appears in).
//
// `size="compact"` drops the label line for tight contexts like a browse
// grid card; the value and urgency logic are unchanged.
//
// Design reference: design/countdown-reference.html ("Live lot" panel) —
// predates the Aug 16, 2026 all-week-live revision, see CLAUDE.md.
export function LotCloseCountdown({
  target,
  label = "Lot closes in",
  size = "default",
  onUrgentChange,
  className,
}: LotCloseCountdownProps) {
  const { days, hours, minutes, seconds, totalSeconds, isPast } = useCountdown(target);
  const isUrgent = !isPast && totalSeconds <= URGENT_THRESHOLD_SECONDS;

  useEffect(() => {
    onUrgentChange?.(isUrgent);
  }, [isUrgent, onUrgentChange]);

  let value: string;
  if (isPast) {
    value = "Closed";
  } else if (isUrgent) {
    value = `${minutes}:${pad(seconds)}`;
  } else if (days > 0) {
    value = `${days}d ${hours}h`;
  } else if (hours > 0) {
    value = `${hours}h ${minutes}m`;
  } else {
    value = `${minutes}m`;
  }

  if (size === "compact") {
    return (
      <span
        className={
          isUrgent
            ? `text-xs font-semibold tabular-nums text-[#ff4444] ${className ?? ""}`
            : `text-xs tabular-nums text-[#888] ${className ?? ""}`
        }
      >
        {value}
        {!isPast && " left"}
      </span>
    );
  }

  return (
    <div className={className}>
      <div className="mb-[3px] text-[11px] uppercase tracking-wider text-[#888]">{label}</div>
      <div
        className={
          isUrgent
            ? "text-[26px] font-semibold leading-none tabular-nums text-[#ff4444]"
            : "text-[26px] font-semibold leading-none tabular-nums text-white"
        }
      >
        {value}
      </div>
    </div>
  );
}
