import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

// POST /api/stripe/connect/onboard — seller payout onboarding.
// Creates the v2 recipient account on first call (marketplace pattern:
// express dashboard, platform collects fees and owns losses, recipient
// configuration requesting stripe_transfers only — no merchant config, so
// onboarding stays short), then returns a hosted onboarding link. Safe to
// call again to resume incomplete onboarding.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id, stripe_account_id, business_name")
    .eq("user_id", user.id)
    .single();
  if (!seller) return NextResponse.json({ error: "not_a_seller" }, { status: 403 });

  const stripe = getStripe();
  let accountId = seller.stripe_account_id;

  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      contact_email: user.email,
      display_name: seller.business_name ?? undefined,
      dashboard: "express",
      identity: { country: "us" },
      defaults: {
        responsibilities: {
          fees_collector: "application",
          losses_collector: "application",
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: { stripe_transfers: { requested: true } },
          },
        },
      },
      include: ["configuration.recipient"],
    });
    accountId = account.id;
    await supabase
      .from("sellers")
      .update({ stripe_account_id: accountId })
      .eq("id", seller.id);
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    refresh_url: `${site}/seller/payouts?refresh=1`,
    return_url: `${site}/seller/payouts?complete=1`,
  });

  return NextResponse.json({ url: link.url });
}
