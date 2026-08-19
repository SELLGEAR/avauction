import Link from "next/link";
import { GradeBadge } from "./GradeBadge";
import { LotCloseCountdown } from "@/components/countdown/LotCloseCountdown";
import type { SearchListingResult } from "@/lib/auction/types";

const CATEGORY_LABEL: Record<string, string> = {
  led_video: "LED/Video",
  audio: "Audio",
  lighting: "Lighting",
  staging: "Staging",
  rigging: "Rigging",
  other: "Other",
};

interface LotCardProps {
  lot: SearchListingResult;
}

// REVISED Aug 16, 2026: every lot is live from the Monday-noon drop, all
// week — there is no more pre-bid state, so this is the only card variant.
// Shows current bid (or "No bids yet") and a compact countdown to that
// lot's own close. design/auction-browse.html predates this revision and
// still shows the old pre-bid-only card — needs a redraw.
export function LotCard({ lot }: LotCardProps) {
  const category = CATEGORY_LABEL[lot.category] ?? lot.category;

  return (
    <Link
      href={`/listing/${lot.id}`}
      className="block overflow-hidden rounded-xl border border-[#222] bg-[#111] transition-colors hover:border-[#333]"
    >
      <div className="relative flex aspect-[4/3] items-center justify-center bg-[#181818] text-[40px] text-[#2a2a2a]">
        {lot.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lot.photo_url} alt={lot.title} className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden>▦</span>
        )}
        <GradeBadge grade={lot.condition_grade} className="absolute left-2 top-2" />
      </div>
      <div className="px-[13px] py-3">
        <div className="mb-[3px] text-[10px] uppercase tracking-wide text-[#666]">
          {lot.manufacturer} · {category}
        </div>
        <div className="mb-2.5 line-clamp-2 h-9 text-sm font-medium leading-tight text-white">
          {lot.title}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-[#4a7aaa]">
            {lot.current_bid != null ? `$${lot.current_bid.toLocaleString()}` : "No bids yet"}
          </span>
          <div className="flex items-center gap-2">
            {lot.auction_end && <LotCloseCountdown target={lot.auction_end} size="compact" />}
            {lot.watcher_count != null && (
              <span className="text-xs text-[#666]">👁 {lot.watcher_count}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
