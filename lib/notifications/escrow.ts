import { createServiceRoleClient } from "../supabase/server";
import { sendTransactional } from "./loops";

// Email triggers per CLAUDE.md: "Payment received → notify seller to ship
// within 48hrs" and "Escrow released → notify seller payout coming".

async function sellerEmail(sellerId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("user_id, users(email)")
    .eq("id", sellerId)
    .single();
  return (seller?.users as { email?: string } | null)?.email ?? null;
}

export async function sendPaymentReceived(event: {
  sellerId: string;
  transactionId: string;
  listingTitle: string;
  finalPrice: number;
}): Promise<void> {
  const email = await sellerEmail(event.sellerId);
  if (!email) {
    console.warn(`payment received notification: no email for seller ${event.sellerId}`);
    return;
  }
  await sendTransactional("payment-received-ship-now", email, {
    listingTitle: event.listingTitle,
    finalPrice: event.finalPrice,
    shipDeadlineHours: 48,
    transactionUrl: `https://avauction.com/sales/${event.transactionId}`,
  });
}

export async function sendEscrowReleased(event: {
  sellerId: string;
  transactionId: string;
  listingTitle: string;
  payoutAmount: number;
}): Promise<void> {
  const email = await sellerEmail(event.sellerId);
  if (!email) {
    console.warn(`escrow released notification: no email for seller ${event.sellerId}`);
    return;
  }
  await sendTransactional("escrow-released", email, {
    listingTitle: event.listingTitle,
    payoutAmount: event.payoutAmount,
    transactionUrl: `https://avauction.com/sales/${event.transactionId}`,
  });
}
