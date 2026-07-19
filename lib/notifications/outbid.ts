import { createServiceRoleClient } from "@/lib/supabase/server";
import { sendTransactional } from "./loops";

interface OutbidEvent {
  outbidUserId: string;
  listingId: string;
  listingTitle: string;
  newBid: number;
}

// Outbid notification per CLAUDE.md: email within 30 seconds via Loops.so.
// The 'outbid' transactional template must be created in the Loops
// dashboard (data vars: listingTitle, newBid, listingUrl).
export async function sendOutbidNotification(event: OutbidEvent): Promise<void> {
  const supabase = createServiceRoleClient();
  const { data: user } = await supabase
    .from("users")
    .select("email")
    .eq("id", event.outbidUserId)
    .single();

  if (!user?.email) {
    console.warn(`outbid notification: no email for user ${event.outbidUserId}`);
    return;
  }

  await sendTransactional("outbid", user.email, {
    listingTitle: event.listingTitle,
    newBid: event.newBid,
    listingUrl: `https://avauction.com/listings/${event.listingId}`,
  });
}
