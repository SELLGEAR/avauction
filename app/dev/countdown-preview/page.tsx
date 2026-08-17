import { CountdownCells } from "@/components/countdown/CountdownCells";
import { LotCloseCountdown } from "@/components/countdown/LotCloseCountdown";

function fromNow(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

// Noon Eastern, explicit offset so it reads as the same instant for every
// viewer regardless of local timezone. A Monday — the drop instant.
const NEXT_DROP = "2026-08-17T12:00:00-04:00";

// Temporary visual QA route for the countdown components — not linked
// from any nav. Safe to delete once the browse/detail pages land and
// exercise these components in place.
//
// REVISED Aug 16, 2026: bidding now opens at the Monday-noon drop and runs
// all week, so CountdownCells only ever appears as the between-auctions
// "next drop" countdown — there is no more pre-bid listing panel. Auto-
// extend's urgent window is now 2 minutes (was 5), so the urgent demo
// below uses a sub-2-minute target.
export default function CountdownPreview() {
  return (
    <main className="min-h-screen space-y-10 bg-[#0a0a0a] p-8">
      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-[#4a7aaa]">
          CountdownCells — default size (between-auctions state)
        </h2>
        <div className="max-w-sm">
          <CountdownCells target={NEXT_DROP} caption="Next drop lands Monday at noon ET" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-[#4a7aaa]">
          CountdownCells — compact size (browse page header / banner State 3)
        </h2>
        <div className="max-w-xs">
          <CountdownCells target={NEXT_DROP} caption="Next drop in" size="compact" />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-[#4a7aaa]">
          LotCloseCountdown — neutral (58 minutes out)
        </h2>
        <div className="max-w-xs rounded-2xl border border-[#1a3060] bg-gradient-to-br from-[#0f1a2e] to-[#0a1020] p-4 text-right">
          <LotCloseCountdown target={fromNow(58 * 60)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-[#4a7aaa]">
          LotCloseCountdown — urgent, final 2 min (red)
        </h2>
        <div className="max-w-xs rounded-2xl border border-[#1a3060] bg-gradient-to-br from-[#0f1a2e] to-[#0a1020] p-4 text-right">
          <LotCloseCountdown target={fromNow(1 * 60 + 41)} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-xs uppercase tracking-wider text-[#4a7aaa]">
          LotCloseCountdown — compact (browse grid card)
        </h2>
        <div className="flex max-w-xs items-center justify-between rounded-xl border border-[#222] bg-[#111] px-[13px] py-3">
          <span className="text-xs font-medium text-[#4a7aaa]">$1,240</span>
          <LotCloseCountdown target={fromNow(58 * 60)} size="compact" />
        </div>
      </section>
    </main>
  );
}
