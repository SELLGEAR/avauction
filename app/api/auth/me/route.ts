import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// GET /api/auth/me — profile + seller status for the app shell.
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  const { data: profile } = await supabase
    .from("users")
    .select("id, email, role, buyer_tier, created_at")
    .eq("id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "profile_not_found" }, { status: 404 });

  const { data: seller } = await supabase
    .from("sellers")
    .select(
      "id, account_type, verification_status, seller_tier, industry_verified, anonymous_username, display_location, stripe_account_id, stripe_transfers_active"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({
    user: profile,
    seller: seller
      ? {
          id: seller.id,
          account_type: seller.account_type,
          verification_status: seller.verification_status,
          seller_tier: seller.seller_tier,
          industry_verified: seller.industry_verified,
          anonymous_username: seller.anonymous_username,
          display_location: seller.display_location,
          stripe_onboarded: !!seller.stripe_account_id,
          stripe_transfers_active: seller.stripe_transfers_active,
        }
      : null,
  });
}
