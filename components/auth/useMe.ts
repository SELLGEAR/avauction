"use client";

import { useCallback, useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase/client";

// Profile + seller status from GET /api/auth/me, for pages that route by
// account state (/sell, /seller/*). Guarded like AuthStatus: a Supabase
// client that can't init renders signed-out, never crashes the page.

export interface Me {
  user: {
    id: string;
    email: string;
    role: "buyer" | "seller" | "admin";
    buyer_tier: string;
    created_at: string;
  };
  seller: {
    id: string;
    account_type: "individual" | "business";
    verification_status: string;
    seller_tier: string;
    industry_verified: boolean;
    anonymous_username: string | null;
    display_location: string | null;
    stripe_onboarded: boolean;
    stripe_transfers_active: boolean;
  } | null;
}

export type MeState =
  | { status: "loading" }
  | { status: "signed_out" }
  | { status: "error" }
  | { status: "ready"; me: Me; token: string };

export function useMe(): MeState & { refresh: () => void } {
  const [state, setState] = useState<MeState>({ status: "loading" });
  const [tick, setTick] = useState(0);
  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;

    let supabase: ReturnType<typeof createBrowserClient>;
    try {
      supabase = createBrowserClient();
    } catch (e) {
      console.error("supabase client unavailable, rendering signed-out:", e);
      setState({ status: "signed_out" });
      return;
    }

    async function load(client: typeof supabase) {
      const { data } = await client.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (!cancelled) setState({ status: "signed_out" });
        return;
      }
      try {
        const res = await fetch("/api/auth/me", {
          headers: { authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          if (!cancelled) setState({ status: "signed_out" });
          return;
        }
        if (!res.ok) throw new Error(`me failed: ${res.status}`);
        const me = (await res.json()) as Me;
        if (!cancelled) setState({ status: "ready", me, token });
      } catch (e) {
        console.error("useMe load failed:", e);
        if (!cancelled) setState({ status: "error" });
      }
    }

    void load(supabase);
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load(supabase);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [tick]);

  return { ...state, refresh };
}
