"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/components/auth/useMe";
import { SellerListingsList } from "@/components/seller/SellerListingsList";

// /seller/listings — the seller's own listings grouped by review status.
// Gated like /seller/payouts: signed-out → /auth, non-seller → onboarding.

function ListingsInner() {
  const router = useRouter();
  const state = useMe();

  useEffect(() => {
    if (state.status === "signed_out") router.replace("/auth?next=%2Fseller%2Flistings");
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

  const { me } = state;
  if (!me.seller) {
    return (
      <div className="rounded-xl border border-[#222] bg-[#111] p-4">
        <p className="text-sm text-[#bbb]">Listings are for seller accounts.</p>
        <Link href="/sell" className="mt-2 inline-block text-xs text-[#4a7aaa] hover:underline">
          Set up selling →
        </Link>
      </div>
    );
  }

  return <SellerListingsList sellerId={me.seller.id} />;
}

export default function SellerListingsPage() {
  return (
    <main className="mx-auto max-w-[440px] p-[22px]">
      <Link href="/sell" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
        ← Seller home
      </Link>
      <div className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-white">Your listings</h1>
        <Link href="/sell/new" className="text-xs text-[#4a7aaa] hover:underline">
          List gear →
        </Link>
      </div>
      <ListingsInner />
    </main>
  );
}
