"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useMe } from "@/components/auth/useMe";
import { SellerListingDetail } from "@/components/seller/SellerListingDetail";

// /seller/listings/[id] — the seller's view of one of their listings.
// Gated like /seller/listings: signed-out → /auth, non-seller → onboarding.

export default function SellerListingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const state = useMe();

  useEffect(() => {
    if (state.status === "signed_out") {
      router.replace(`/auth?next=${encodeURIComponent(`/seller/listings/${params.id}`)}`);
    }
    if (state.status === "ready" && !state.me.seller) router.replace("/sell");
  }, [state, router, params.id]);

  return (
    <main className="mx-auto max-w-[520px] p-[22px]">
      <Link href="/seller/listings" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
        ← Your listings
      </Link>
      {state.status === "ready" && state.me.seller ? (
        <SellerListingDetail id={params.id} token={state.token} />
      ) : state.status === "error" ? (
        <p className="text-sm text-[#ff4444]">Couldn&apos;t load your account. Refresh the page to try again.</p>
      ) : (
        <p className="text-sm text-[#666]">Loading…</p>
      )}
    </main>
  );
}
