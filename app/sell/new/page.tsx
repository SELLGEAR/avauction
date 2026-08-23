"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe } from "@/components/auth/useMe";
import {
  EquipmentTypeahead,
  type EquipmentSelection,
} from "@/components/seller/EquipmentTypeahead";

// /sell/new — the gear entry form. Sellers only:
//   signed out -> /auth?next=/sell/new
//   not seller -> /sell (onboarding)
//
// Checkpoint 1 state: step 1 (equipment selection) only. The QC checklist,
// grade, details, pricing, and attestation steps land in the next slice —
// this page becomes the host for the full multi-step GearEntryForm.

export default function NewListingPage() {
  const router = useRouter();
  const state = useMe();
  const [selection, setSelection] = useState<EquipmentSelection | null>(null);

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
        Start by finding your gear in the equipment database.
      </p>

      <EquipmentTypeahead token={state.token} selection={selection} onSelect={setSelection} />

      {selection && (
        <p className="mt-4 text-xs text-[#666]">
          Condition checklist, details, and pricing — coming in the next step of this build.
        </p>
      )}
    </main>
  );
}
