// Auction schedule constants and math. REVISED Aug 16, 2026 — bidding no
// longer opens Friday noon; it opens at the Monday-noon drop and runs all
// week. See CLAUDE.md, Auction Format / Auction Countdown Timer.
//
// These constants mirror pricing_engine_settings (auction_drop_weekday,
// auction_drop_hour_et, auction_close_weekday, auction_close_hour_et,
// auction_stagger_minutes, auction_auto_extend_minutes) — the database is
// authoritative. This is a client-side mirror for schedule math and UI
// copy until a public settings read path exists (same pattern as
// lib/auction/increments.ts's DEFAULT_INCREMENT_TIERS). If the admin panel
// changes these, fetch live rather than relying on these defaults.
//
// Monday noon ET ("high noon"): lots drop and bidding opens simultaneously
// for every lot at once, and runs all week — there is no pre-bid /
// browse-only state. Friday noon ET ("high noon") is when staggered closes
// BEGIN, not a shared end time; the auction ends whenever the last lot
// closes, and auto-extend can push that later still. Each lot counts down
// to its own close, never a shared one.
export const AUCTION_DROP_WEEKDAY = 1; // Monday (0 = Sunday .. 6 = Saturday)
export const AUCTION_DROP_HOUR_ET = 12; // high noon
export const AUCTION_CLOSE_WEEKDAY = 5; // Friday
export const AUCTION_CLOSE_HOUR_ET = 12; // high noon — closes START here, not end
export const AUCTION_STAGGER_MINUTES = 5; // minutes between each lot's scheduled close
// Final-N-minutes trigger window and extension amount — always equal.
// Changed from 5 to 2 (Aug 16, 2026): high-noon showdown moves faster.
export const AUCTION_AUTO_EXTEND_MINUTES = 2;

const EASTERN_TZ = "America/New_York";

// Offset (in minutes) of `timeZone` from UTC at the instant `date`
// represents, via the "format as wall-clock, diff against UTC" trick —
// correct across DST without a timezone library.
function timeZoneOffsetMinutes(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

// The real UTC instant at which it is `hour`:00:00 on `year-month-day` in
// `timeZone`.
function zonedHourToUtc(year: number, month: number, day: number, hour: number, timeZone: string): Date {
  const guess = new Date(Date.UTC(year, month - 1, day, hour, 0, 0));
  const offsetMinutes = timeZoneOffsetMinutes(guess, timeZone);
  return new Date(guess.getTime() - offsetMinutes * 60_000);
}

// The next instant, strictly after `from`, at which it is `hour`:00:00 ET
// on the given ISO weekday (0 = Sunday .. 6 = Saturday). If `from` falls on
// the target weekday before `hour` ET, that same day is the answer;
// otherwise it's the next occurrence a week out.
function nextWeekdayHourET(weekday: number, hour: number, from: Date): Date {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TZ,
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(from)
      .map((p) => [p.type, p.value])
  );

  const weekdayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const currentWeekday = weekdayIndex[parts.weekday];
  const currentHour = Number(parts.hour);

  let daysUntil = (weekday - currentWeekday + 7) % 7;
  if (daysUntil === 0 && currentHour >= hour) {
    daysUntil = 7;
  }

  const probe = new Date(from.getTime() + daysUntil * 86_400_000);
  const targetParts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: EASTERN_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(probe)
      .map((p) => [p.type, p.value])
  );

  return zonedHourToUtc(
    Number(targetParts.year),
    Number(targetParts.month),
    Number(targetParts.day),
    hour,
    EASTERN_TZ
  );
}

// The next Monday-noon-ET drop instant strictly after `from`. This is the
// one fixed, shared clock in the auction format — every lot drops and
// becomes biddable at the same moment. Used only for the between-auctions
// countdown (browse page + marketplace banner State 3, both via
// CountdownCells) — once lots are live there is nothing left to count down
// to on this clock, since bidding opened the instant they dropped.
export function nextAuctionDropET(from: Date = new Date()): Date {
  return nextWeekdayHourET(AUCTION_DROP_WEEKDAY, AUCTION_DROP_HOUR_ET, from);
}
