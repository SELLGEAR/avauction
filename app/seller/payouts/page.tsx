"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useMe } from "@/components/auth/useMe";

// /seller/payouts — Stripe Connect onboarding. The onboard API creates the
// recipient account on first call and returns a hosted onboarding link;
// calling again resumes an incomplete onboarding. Stripe's return_url and
// refresh_url point back here with ?complete=1 / ?refresh=1.

function PayoutsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const returnedComplete = params.get("complete") === "1";
  const returnedRefresh = params.get("refresh") === "1";
  const state = useMe();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "signed_out") router.replace("/auth?next=%2Fseller%2Fpayouts");
  }, [state.status, router]);

  if (state.status === "loading" || state.status === "signed_out") {
    return <p className="text-sm text-[#666]">Loading…</p>;
  }
  if (state.status === "error") {
    return (
      <p className="text-sm text-[#ff4444]">
        Couldn&apos;t load your account. Refresh the page to try again.
      </p>
    );
  }

  const { me, token } = state;
  if (!me.seller) {
    return (
      <div className="rounded-xl border border-[#222] bg-[#111] p-4">
        <p className="text-sm text-[#bbb]">Payouts are for seller accounts.</p>
        <Link href="/sell" className="mt-2 inline-block text-xs text-[#4a7aaa] hover:underline">
          Set up selling →
        </Link>
      </div>
    );
  }

  const s = me.seller;

  async function startOnboarding() {
    if (starting) return;
    setError(null);
    setStarting(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
      const result = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !result.url) {
        setError("Couldn't start Stripe onboarding. Try again in a moment.");
        return;
      }
      window.location.href = result.url;
    } catch (e) {
      console.error("stripe onboard failed:", e);
      setError("Couldn't start Stripe onboarding. Try again in a moment.");
      setStarting(false);
    }
    // No finally-reset on success: the page is navigating away to Stripe
  }

  return (
    <>
      {returnedComplete && !s.stripe_transfers_active && (
        <div className="mb-4 rounded-lg border border-[#1a5c38] bg-[#0d2218] px-3 py-2 text-xs text-[#22ee77]">
          Thanks — Stripe is finishing verification. Payouts activate automatically once it clears.
        </div>
      )}
      {returnedRefresh && (
        <div className="mb-4 rounded-lg border border-[#3a2a00] bg-[#1a1300] px-3 py-2 text-xs text-[#ffb020]">
          That onboarding link expired — start again below to pick up where you left off.
        </div>
      )}

      <div className="rounded-xl border border-[#222] bg-[#111] p-4">
        {s.stripe_transfers_active ? (
          <>
            <h2 className="text-sm font-semibold text-[#22ee77]">Payouts active</h2>
            <p className="mt-1 text-xs text-[#888]">
              Your bank account is connected. When gear sells and the buyer&apos;s inspection window
              closes, funds transfer automatically.
            </p>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-white">
              {s.stripe_onboarded ? "Finish connecting your bank account" : "Connect your bank account"}
            </h2>
            <p className="mt-1 text-xs text-[#888]">
              Payouts run through Stripe. It takes about 3 minutes — you&apos;ll be sent to a secure
              Stripe page and returned here when you&apos;re done.
            </p>
            <button
              type="button"
              onClick={startOnboarding}
              disabled={starting}
              className="mt-3 w-full rounded-lg bg-[#22ee77] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {starting
                ? "Opening Stripe…"
                : s.stripe_onboarded
                  ? "Resume Stripe onboarding"
                  : "Connect with Stripe"}
            </button>
            {error && (
              <div
                role="alert"
                className="mt-3 rounded-lg border border-[#6a1515] bg-[#2a0a0a] px-3 py-2 text-xs text-[#ff4444]"
              >
                {error}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function PayoutsPage() {
  return (
    <main className="mx-auto max-w-[440px] p-[22px]">
      <Link href="/sell" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
        ← Seller home
      </Link>
      <h1 className="mb-4 text-xl font-semibold text-white">Payouts</h1>
      <Suspense>
        <PayoutsInner />
      </Suspense>
    </main>
  );
}
