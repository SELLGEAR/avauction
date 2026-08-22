"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe } from "@/components/auth/useMe";
import { OnboardingForm } from "@/components/seller/OnboardingForm";

// /sell — the seller entry point, routed by account state:
//   signed out            -> /auth?next=/sell
//   signed in, not seller -> onboarding form (account type, agreement)
//   seller                -> seller home (list gear, payouts)

export default function SellPage() {
  const router = useRouter();
  const state = useMe();
  // Set the moment onboarding succeeds so the success panel (with the
  // assigned username) shows instead of flashing straight to seller home.
  const [justUpgraded, setJustUpgraded] = useState<{ username: string | null } | null>(null);

  useEffect(() => {
    if (state.status === "signed_out") router.replace("/auth?next=%2Fsell");
  }, [state.status, router]);

  if (state.status === "loading" || state.status === "signed_out") {
    return (
      <main className="mx-auto max-w-[440px] p-[22px]">
        <p className="text-sm text-[#666]">Loading…</p>
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-[440px] p-[22px]">
        <p className="text-sm text-[#ff4444]">
          Couldn&apos;t load your account. Refresh the page to try again.
        </p>
      </main>
    );
  }

  const { me, token, refresh } = state;

  if (justUpgraded) {
    return (
      <main className="mx-auto max-w-[440px] p-[22px]">
        <h1 className="mb-1 text-xl font-semibold text-white">You&apos;re set up to sell</h1>
        <div className="mt-4 rounded-xl border border-[#1a5c38] bg-[#0d2218] p-4">
          {justUpgraded.username && (
            <p className="text-sm text-[#bbb]">
              Buyers will know you as{" "}
              <span className="font-semibold text-[#22ee77]">{justUpgraded.username}</span>. Your
              company name and location stay private until a sale is funded.
            </p>
          )}
          <p className="mt-2 text-xs text-[#888]">
            Your account starts as provisional — listings you submit go through admin review before
            going live.
          </p>
        </div>
        <div className="mt-4 grid gap-2">
          <Link
            href="/seller/payouts"
            className="rounded-lg bg-[#22ee77] px-5 py-2.5 text-center text-sm font-semibold text-[#0a0a0a]"
          >
            Connect payouts (Stripe)
          </Link>
          <button
            type="button"
            onClick={() => {
              setJustUpgraded(null);
              refresh();
            }}
            className="rounded-lg border border-[#2a2a2a] px-5 py-2.5 text-sm font-medium text-[#999] hover:border-[#3a3a3a] hover:text-white"
          >
            Go to your seller home
          </button>
        </div>
      </main>
    );
  }

  if (!me.seller) {
    return (
      <main className="mx-auto max-w-[440px] p-[22px]">
        <Link href="/auction" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
          ← This week&apos;s auction
        </Link>
        <h1 className="mb-1 text-xl font-semibold text-white">Sell on AVauction</h1>
        <p className="mb-6 text-[13px] text-[#666]">
          List your used AV gear for free. If you want faster action, move it into Friday&apos;s
          auction.
        </p>
        <OnboardingForm
          token={token}
          onUpgraded={(username) => {
            if (username) {
              setJustUpgraded({ username });
            } else {
              refresh();
            }
          }}
        />
      </main>
    );
  }

  // Seller home
  const s = me.seller;
  return (
    <main className="mx-auto max-w-[440px] p-[22px]">
      <Link href="/auction" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
        ← This week&apos;s auction
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-white">Seller home</h1>
      <p className="mb-6 text-[13px] text-[#666]">
        Selling as <span className="text-[#999]">{s.anonymous_username ?? "—"}</span>
        {" · "}
        {s.verification_status}
        {s.account_type === "business" ? " business" : " individual"}
      </p>

      <div className="grid gap-2">
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <h2 className="text-sm font-semibold text-white">List gear</h2>
          <p className="mt-1 text-xs text-[#888]">
            The gear entry form is on its way — next build slice. Listings go through admin review
            before going live.
          </p>
        </div>

        <Link
          href="/seller/payouts"
          className="rounded-xl border border-[#222] bg-[#111] p-4 transition-colors hover:border-[#3a3a3a]"
        >
          <h2 className="text-sm font-semibold text-white">Payouts</h2>
          <p className="mt-1 text-xs text-[#888]">
            {s.stripe_transfers_active
              ? "Stripe connected — payouts active."
              : s.stripe_onboarded
                ? "Stripe onboarding started — finish connecting your bank account."
                : "Connect your bank account through Stripe to get paid when gear sells."}
          </p>
        </Link>
      </div>
    </main>
  );
}
