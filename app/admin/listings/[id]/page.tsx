"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useMe } from "@/components/auth/useMe";
import type { ReviewPhoto } from "@/lib/admin/listings";

// /admin/listings/[id] — photo review for one listing: the CLEAN original
// (signed, admin-only) beside exactly what buyers will see (blur regions
// + watermark). Functional-but-plain, like the rest of the admin surface.
// Admins only: everyone else is bounced. The role gate that matters is
// requireAdmin() on the API route; this page just avoids a blank screen.

interface ReviewResponse {
  listing: { id: string; title: string; status: string };
  photos: ReviewPhoto[];
}

const TYPE_LABEL: Record<string, string> = {
  front: "Front", back: "Back", left_side: "Left side", right_side: "Right side",
  powered_on: "Powered on", serial_label: "Serial label", damage_closeup: "Damage close-up",
  flight_case: "Flight case", packaging_preship: "Pre-ship packaging", other: "Other",
};

export default function AdminListingPhotosPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const state = useMe();
  const [data, setData] = useState<ReviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.status === "signed_out") router.replace(`/auth?next=${encodeURIComponent(`/admin/listings/${params.id}`)}`);
    if (state.status === "ready" && state.me.user.role !== "admin") router.replace("/");
  }, [state, router, params.id]);

  useEffect(() => {
    if (state.status !== "ready" || state.me.user.role !== "admin") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/listings/${params.id}/photos`, {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        if (!res.ok) throw new Error(res.status === 404 ? "Listing not found." : `Failed (${res.status}).`);
        const body = (await res.json()) as ReviewResponse;
        if (!cancelled) setData(body);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [state, params.id]);

  if (state.status !== "ready" || state.me.user.role !== "admin") {
    return (
      <main className="mx-auto max-w-[1100px] p-[22px]">
        <p className="text-sm text-[#666]">Loading…</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1100px] p-[22px]">
      <Link href="/seller/listings" className="mb-6 inline-block text-xs text-[#666] hover:text-[#999]">
        ← Back
      </Link>
      {error && <p className="text-sm text-[#ff4444]">{error}</p>}
      {data && (
        <>
          <h1 className="mb-1 text-xl font-semibold text-white">{data.listing.title}</h1>
          <p className="mb-6 text-[13px] text-[#666]">
            Photo review · {data.listing.status} · {data.photos.length} photos. Left: clean original
            (admin only). Right: what buyers see.
          </p>
          <ul className="grid gap-6">
            {data.photos.map((p) => (
              <li key={p.id} className="rounded-xl border border-[#222] bg-[#111] p-3">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#999]">
                  <span className="font-semibold text-white">
                    #{p.position + 1} · {TYPE_LABEL[p.photo_type] ?? p.photo_type}
                  </span>
                  {p.position === 0 && <span className="rounded bg-[#22ee77] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#0a0a0a]">Cover</span>}
                  <span>moderation: {p.moderation_status}</span>
                  <span>
                    blur boxes: {p.blur_regions.length}
                    {p.detection.status === "done" && ` (scan suggested ${p.detection.suggested.length})`}
                    {p.detection.status !== "done" && ` (scan ${p.detection.status}${p.detection.note ? `: ${p.detection.note}` : ""})`}
                  </span>
                  {p.width && p.height && <span>{p.width}×{p.height}</span>}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <figure>
                    <figcaption className="mb-1 text-[11px] uppercase tracking-wider text-[#c9a227]">Original — admin only</figcaption>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-[#181818]">
                      {p.original_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.original_url} alt="" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-[#666]">Legacy photo — no Cloudinary original</div>
                      )}
                      {p.blur_regions.map((r, i) => (
                        <div
                          key={i}
                          style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                          className="pointer-events-none absolute border-2 border-[#22ee77]"
                          title={r.label ?? ""}
                        />
                      ))}
                    </div>
                  </figure>
                  <figure>
                    <figcaption className="mb-1 text-[11px] uppercase tracking-wider text-[#22ee77]">Buyer view — blurred + watermarked</figcaption>
                    <div className="aspect-[4/3] overflow-hidden rounded-lg bg-[#181818]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.buyer_url} alt="" className="h-full w-full object-contain" />
                    </div>
                  </figure>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
