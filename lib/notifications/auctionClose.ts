import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendTransactional } from "./loops";

// Email triggers per CLAUDE.md: "Auction won → notify winning bidder +
// payment instructions" and the reserve-not-met bump notification
// ("Your [Model] didn't meet reserve at auction. It's now listed in
// buy-it-now at $X.").

export async function sendAuctionWon(event: {
  winnerUserId: string;
  listingId: string;
  listingTitle: string;
  finalPrice: number;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", event.winnerUserId)
    .single();
  if (!user?.email) {
    console.warn(`auction won notification: no email for user ${event.winnerUserId}`);
    return;
  }
  await sendTransactional("auction-won", user.email, {
    listingTitle: event.listingTitle,
    finalPrice: event.finalPrice,
    paymentUrl: `https://avauction.com/purchases/${event.listingId}`,
  });
}

export async function sendReserveNotMet(event: {
  sellerId: string;
  listingId: string;
  listingTitle: string;
  askingPrice: number;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("user_id, users(email)")
    .eq("id", event.sellerId)
    .single();
  const email = (seller?.users as { email?: string } | null)?.email;
  if (!email) {
    console.warn(`reserve not met notification: no email for seller ${event.sellerId}`);
    return;
  }
  await sendTransactional("reserve-not-met", email, {
    listingTitle: event.listingTitle,
    askingPrice: event.askingPrice,
    listingUrl: `https://avauction.com/listings/${event.listingId}`,
  });
}

export async function sendAuctionExpired(event: {
  sellerId: string;
  listingId: string;
  listingTitle: string;
}): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("user_id, users(email)")
    .eq("id", event.sellerId)
    .single();
  const email = (seller?.users as { email?: string } | null)?.email;
  if (!email) {
    console.warn(`auction expired notification: no email for seller ${event.sellerId}`);
    return;
  }
  await sendTransactional("auction-expired", email, {
    listingTitle: event.listingTitle,
    listingUrl: `https://avauction.com/listings/${event.listingId}`,
  });
}
