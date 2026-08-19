"use client";

import { useEffect, useState } from "react";

export interface CountdownBreakdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isPast: boolean;
}

function breakdown(target: Date): CountdownBreakdown {
  const totalSeconds = Math.max(0, Math.floor((target.getTime() - Date.now()) / 1000));
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalSeconds,
    isPast: target.getTime() <= Date.now(),
  };
}

// Ticks once per second toward `target`. Client-side only — the server
// supplies just the target timestamp (auction_end, bidding_opens_at).
// Auto-extend changes to that timestamp arrive on the next fetch of the
// underlying listing data; this hook only re-renders the tick, it does
// not poll for a moved target itself.
export function useCountdown(target: string | Date): CountdownBreakdown {
  const targetMs = (typeof target === "string" ? new Date(target) : target).getTime();
  const [state, setState] = useState<CountdownBreakdown>(() => breakdown(new Date(targetMs)));

  useEffect(() => {
    setState(breakdown(new Date(targetMs)));
    const id = setInterval(() => setState(breakdown(new Date(targetMs))), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  return state;
}
