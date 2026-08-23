import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";

// POST /api/auth/upgrade-to-seller — the seller onboarding trigger.
// Atomically creates the sellers row (provisional, platform-assigned
// anonymous username) and flips the user's role to seller.
// Body: { account_type: 'individual' | 'business', agreement_accepted: true,
//         contact_name, contact_email, phone, address_line1, city, state,
//         postal_code,                     — required for ALL sellers (0032)
//         address_line2?, country?, business_name?, ein?, business_type?,
//         website?, years_in_business?, display_location? }
// Contact fields are private: sellers RLS is own-row/admin only, and the
// post-escrow reveal is a future checkout-slice piece (loose end #12).

const REQUIRED_CONTACT_FIELDS = [
  "contact_name",
  "contact_email",
  "phone",
  "address_line1",
  "city",
  "state",
  "postal_code",
] as const;
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
  // The seller agreement checkbox is a required onboarding step, and
  // create_seller() rejects without it — fail fast with the same code
  if (body.agreement_accepted !== true) {
    return NextResponse.json({ error: "agreement_required" }, { status: 400 });
  }
  // Full contact set required for all sellers — same code + missing list
  // create_seller() returns, so the form points at the absent fields
  const missing = REQUIRED_CONTACT_FIELDS.filter(
    (f) => typeof body[f] !== "string" || (body[f] as string).trim() === ""
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "contact_details_required", missing },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("create_seller", {
    p_user_id: user.id,
    p: {
      account_type: accountType,
      agreement_accepted: true,
      contact_name: body.contact_name,
      contact_email: body.contact_email,
      phone: body.phone,
      address_line1: body.address_line1,
      address_line2: body.address_line2 ?? null,
      city: body.city,
      state: body.state,
      postal_code: body.postal_code,
      country: body.country ?? null,
      business_name: body.business_name ?? null,
      ein: body.ein ?? null,
      business_type: body.business_type ?? null,
      website: body.website ?? null,
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
