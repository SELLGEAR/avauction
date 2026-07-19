import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

// POST /api/auth/upgrade-to-seller — the seller onboarding trigger.
// Atomically creates the sellers row (provisional, platform-assigned
// anonymous username) and flips the user's role to seller.
// Body: { account_type: 'individual' | 'business', business_name?, ein?,
//         business_type?, website?, phone?, years_in_business?,
//         display_location? }
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`upgrade:${user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const accountType = body.account_type;
  if (accountType !== "individual" && accountType !== "business") {
    return NextResponse.json({ error: "invalid_account_type" }, { status: 400 });
  }
  if (
    accountType === "business" &&
    (typeof body.business_name !== "string" || body.business_name.trim() === "" ||
      typeof body.ein !== "string" || body.ein.trim() === "")
  ) {
    return NextResponse.json({ error: "business_name_and_ein_required" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("create_seller", {
    p_user_id: user.id,
    p: {
      account_type: accountType,
      business_name: body.business_name ?? null,
      ein: body.ein ?? null,
      business_type: body.business_type ?? null,
      website: body.website ?? null,
      phone: body.phone ?? null,
      years_in_business: body.years_in_business ?? null,
      display_location: body.display_location ?? null,
    },
  });

  if (error) {
    console.error("create_seller failed:", error.message);
    return NextResponse.json({ error: "upgrade_failed" }, { status: 500 });
  }

  const result = data as { ok: boolean; error?: string };
  if (!result.ok) {
    const status = result.error === "already_seller" ? 409 : 422;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
