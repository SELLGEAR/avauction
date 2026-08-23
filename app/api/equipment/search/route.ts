import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/equipment/search?q= — master-catalog typeahead for the gear
// entry form. Signed-in only: the 268k-record catalog is a platform asset,
// not an anonymous API. Identity fields only, capped at 10 results.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`eqsearch:${user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("search_equipment", {
    p_q: q,
    p_limit: 10,
  });
  if (error) {
    console.error("search_equipment failed:", error.message);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }

  return NextResponse.json({ results: data ?? [] });
}
