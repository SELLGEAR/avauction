import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/search — public marketplace browse. No auth required; an
// authenticated buyer additionally gets is_watched per result.
//
// Query params: q, category, grades (comma-separated A-D), price_min,
// price_max, type (auction|buy_it_now), zip, within (miles), sort
// (best_match|ending_soonest|newly_listed|price_low|price_high|nearest),
// page, per_page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`search:${ip}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const g = (k: string) => url.searchParams.get(k);
  const payload: Record<string, unknown> = {
    q: g("q") ?? undefined,
    category: g("category") ?? undefined,
    condition_grades: g("grades") ? g("grades")!.split(",").map((s) => s.trim()) : undefined,
    price_min: g("price_min") ? Number(g("price_min")) : undefined,
    price_max: g("price_max") ? Number(g("price_max")) : undefined,
    listing_type: g("type") ?? undefined,
    buyer_zip: g("zip") ?? undefined,
    within_miles: g("within") ? Number(g("within")) : undefined,
    sort: g("sort") ?? undefined,
    page: g("page") ? Number(g("page")) : undefined,
    per_page: g("per_page") ? Number(g("per_page")) : undefined,
  };
  for (const k of Object.keys(payload)) if (payload[k] === undefined) delete payload[k];

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("search_listings", { p: payload });
  if (error) {
    console.error("search_listings failed:", error.message);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }

  const result = data as {
    error?: string;
    results?: { id: string; is_watched?: boolean }[];
  };
  if (result.error) return NextResponse.json(result, { status: 400 });

  // Watchlist integration: flag results the authed buyer already watches
  const user = await getUserFromRequest(req);
  if (user && result.results && result.results.length > 0) {
    const ids = result.results.map((r) => r.id);
    const { data: watched } = await supabase
      .from("watchlists")
      .select("listing_id")
      .eq("buyer_id", user.id)
      .in("listing_id", ids);
    const watchedSet = new Set((watched ?? []).map((w) => w.listing_id));
    for (const r of result.results) r.is_watched = watchedSet.has(r.id);
  }

  return NextResponse.json(result);
}
