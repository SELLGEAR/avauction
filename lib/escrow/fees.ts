// All money math in integer cents — never float dollars.

export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function centsToDollars(cents: number): number {
  return cents / 100;
}

// Buyer pays actual payment processing cost (2.9% + $0.30) at checkout,
// charged on top of the price so the seller side is untouched by it.
export function buyerFeeCents(priceCents: number, pct: number, fixedCents: number): number {
  return Math.round((priceCents * pct) / 100) + fixedCents;
}

// Seller receives final price minus platform commission. Commission was
// computed and stored at auction close; this converts the stored dollar
// amounts to the transfer amount.
export function sellerPayoutCents(finalPriceDollars: number, commissionDollars: number): number {
  return dollarsToCents(finalPriceDollars) - dollarsToCents(commissionDollars);
}
