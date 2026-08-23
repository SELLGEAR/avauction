import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { suggestPrice } from "@/lib/pricing/suggestPrice";

export const dynamic = "force-dynamic";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/equipment/[id]/price-suggestion?grade=A|B|C|D — the gear entry
// form's pricing step. MOAT RULE (see lib/pricing/suggestPrice.ts): ranges
// and confidence ONLY — never raw records, record counts, or source
// breakdowns. With market_prices empty today this returns has_data: false;
// the form renders that as the honest empty state.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`pricesuggest:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const gradeParam = new URL(req.url).searchParams.get("grade") ?? "B";
  const grade = (["A", "B", "C", "D"].includes(gradeParam) ? gradeParam : "B") as
    | "A" | "B" | "C" | "D";

  try {
    const s = await suggestPrice(id, grade);
    return NextResponse.json({
      has_data: s.has_data,
      suggested_low: s.has_data ? s.suggested_low : undefined,
      suggested_high: s.has_data ? s.suggested_high : undefined,
      confidence: s.confidence,
    });
  } catch (err) {
    console.error("price suggestion failed:", (err as Error).message);
    return NextResponse.json({ error: "suggestion_failed" }, { status: 500 });
  }
}
