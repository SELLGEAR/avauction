import { createServiceRoleClient } from "../supabase/server";
import { sendTransactional } from "./loops";

// Email trigger per CLAUDE.md: "Listing approved → notify seller it's
// live." Rejection notification added so sellers aren't left guessing.

async function sellerEmail(sellerId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("user_id, users(email)")
    .eq("id", sellerId)
    .single();
  return (seller?.users as { email?: string } | null)?.email ?? null;
}

export async function sendListingApproved(event: {
  sellerId: string;
  listingId: string;
  listingTitle: string;
}): Promise<void> {
  const email = await sellerEmail(event.sellerId);
  if (!email) {
    console.warn(`listing approved notification: no email for seller ${event.sellerId}`);
    return;
  }
  await sendTransactional("listing-approved", email, {
    listingTitle: event.listingTitle,
    listingUrl: `https://avauction.com/listings/${event.listingId}`,
  });
}

export async function sendListingRejected(event: {
  sellerId: string;
  listingId: string;
  listingTitle: string;
  reason: string;
}): Promise<void> {
  const email = await sellerEmail(event.sellerId);
  if (!email) {
    console.warn(`listing rejected notification: no email for seller ${event.sellerId}`);
    return;
  }
  await sendTransactional("listing-rejected", email, {
    listingTitle: event.listingTitle,
    reason: event.reason,
  });
}
