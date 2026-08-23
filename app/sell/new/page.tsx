"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/components/auth/useMe";
import { GearEntryForm } from "@/components/seller/GearEntryForm";

// /sell/new — the gear entry form. Sellers only:
//   signed out -> /auth?next=/sell/new
//   not seller -> /sell (onboarding)

export default function NewListingPage() {
  const router = useRouter();
  const state = useMe();

  useEffect(() => {
    if (state.status === "signed_out") router.replace("/auth?next=%2Fsell%2Fnew");
    if (state.status === "ready" && !state.me.seller) router.replace("/sell");
  }, [state, router]);

  if (state.status !== "ready" || !state.me.seller) {
    return (
      <main className="mx-auto max-w-[440px] p-[22px]">
        <p className="text-sm text-[#666]">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[440px] p-[22px]">
      <Link href="/sell" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
        ← Seller home
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-white">List gear</h1>
      <p className="mb-6 text-[13px] text-[#666]">
        One item at a time — find it, grade it, price it, done.
      </p>

      <GearEntryForm token={state.token} />
    </main>
  );
}
