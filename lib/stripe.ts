import Stripe from "stripe";

let client: Stripe | undefined;

// Test mode until launch: STRIPE_SECRET_KEY should be a test-mode
// restricted key (rk_test_...). API version pinned by the SDK.
export function getStripe(): Stripe {
  if (!client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
    client = new Stripe(key);
  }
  return client;
}
