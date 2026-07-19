import { createServiceRoleClient } from "@/lib/supabase/server";

interface OutbidEvent {
  outbidUserId: string;
  listingId: string;
  listingTitle: string;
  newBid: number;
}

// Outbid notification per CLAUDE.md: email within 30 seconds via Loops.so.
// Stubbed until LOOPS_API_KEY exists — when the key lands in the
// environment this sends for real with no code change. The 'outbid'
// transactional template must be created in the Loops dashboard first
// (template data vars: listingTitle, newBid, listingUrl).
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

  const apiKey = process.env.LOOPS_API_KEY;
  const payload = {
    transactionalId: "outbid",
    email: user.email,
    dataVariables: {
      listingTitle: event.listingTitle,
      newBid: event.newBid,
      listingUrl: `https://avauction.com/listings/${event.listingId}`,
    },
  };

  if (!apiKey) {
    console.log("[outbid stub — LOOPS_API_KEY not set]", JSON.stringify(payload));
    return;
  }

  const res = await fetch("https://app.loops.so/api/v1/transactional", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`Loops outbid send failed (${res.status}): ${await res.text()}`);
  }
}
