# AVauction.com — Building for Exit

A plain-English guide to what we need to do from day one to make this company attractive and valuable when it's time to sell.

---

## The Goal

Build a platform that a strategic buyer — a media company, a large AV dealer, a private equity firm, or a competitor — would pay a meaningful multiple to acquire. The pricing database and the weekly auction habit are the two things that make AVauction.com uniquely valuable. Everything below is about protecting and documenting those assets.

---

## The Two-Entity Structure

We operate as two separate companies from the beginning.

**AVauction LLC — the marketplace**
The platform, the brand, the codebase, the newsletter, the seller and buyer relationships, the master equipment database, and the domain. This is what we eventually sell.

**[Trading Desk LLC] — the intelligence operation**
A separate LLC owned by Sean and Tom personally. Buys and sells gear using pricing intelligence licensed from AVauction LLC. Has its own bank account, its own P&L, its own tax return. Never owned by AVauction LLC.

**Why two entities:**
- The marketplace is a commission business with no inventory risk
- The trading desk holds inventory and has capital at risk
- Different risk profiles, different tax treatment, different exit paths
- When AVauction LLC is sold, the trading desk continues independently
- A buyer can't accidentally acquire the trading desk as part of the marketplace deal

**The data licensing relationship:**
The trading desk LLC pays AVauction LLC a documented annual licensing fee for access to the market_prices pricing database. This creates a clean, arm's-length commercial relationship between the two entities.

When AVauction LLC is sold, the data license agreement survives the sale. The new owner gets the platform. Sean and Tom keep the intelligence access through the trading desk LLC.

The licensing fee also shows up as a revenue line on AVauction LLC's P&L — which tells any acquirer that the pricing database has real standalone commercial value. That improves the valuation without revealing what the trading desk does with the data.

**Attorney tasks:**
- Set up both LLCs before week 10
- Draft the data licensing agreement between the two entities
- Ensure the license survives a sale of AVauction LLC contractually
- Advise on tax structure for the two-entity setup

---

## What Buyers and Investors Look At

When a buyer evaluates AVauction.com they will look at ten things. All of them need to be tracked from day one.

**1. GMV — Gross Merchandise Value**
The total dollar value of all gear bought and sold through the platform. Not our revenue — the full value of transactions. A buyer who sees $8M in GMV in year two understands the market we're serving. Every transaction is tracked permanently. Nothing is ever deleted.

**2. Revenue and Growth Rate**
Our actual take — auction commissions, white glove fees, concierge fees. Growth rate matters more than the absolute number. Consistent 20% month-over-month growth on a small base is more compelling than flat revenue on a larger one.

**3. Cohort Retention**
Do buyers come back? A buyer who bid in January, won something, bid again in March, and again in June is a retained cohort. This is one of the most important metrics for any marketplace. It proves the platform has genuine value, not just first-time curiosity. We track every buyer's first transaction date from the beginning and never change it.

**4. Auction Sell-Through Rate**
What percentage of lots entered into Friday's auction actually sell. 80%+ is strong. This proves the auction format works and that buyers and sellers are pricing realistically. Tracked every week from the first auction.

**5. Average Order Value**
The average transaction size. Professional AV gear should produce high AOV — $10,000 to $50,000 average. High AOV with modest transaction count is still a compelling business because the revenue per transaction is meaningful.

**6. Take Rate**
Our revenue as a percentage of GMV. The 10% auction commission is the take rate on auction transactions. This shows an acquirer that the business model is sustainable.

**7. Database Size**
The number of records in the market_prices table. The depth of the transaction history. Years of coverage by category. A buyer acquiring AVauction.com is also acquiring this database. Its size and depth is a direct input to the valuation. We surface this number prominently in any acquisition conversation.

**8. Newsletter Metrics**
Subscriber count, growth rate, open rate. A newsletter with 5,000 professional AV subscribers at 45% open rate is a meaningful owned audience that no competitor can replicate quickly. It demonstrates market authority independent of transaction volume.

**9. Net Promoter Score**
After every transaction, buyers and sellers receive one question: "On a scale of 0-10, how likely are you to recommend AVauction.com to a colleague?" Two years of NPS data shows whether the platform generates genuine loyalty.

**10. Seller and Buyer Counts**
Active sellers. Active buyers. Monthly new adds. Total historical. These are the market participants — the network effect that makes the platform valuable.

---

## What We Track From Day One

**The weekly metrics email**
Every Monday morning, before the drop email goes out, an automated email goes to Sean and Tom with the previous week's numbers. Same format every week. No narrative — just numbers.

```
AVauction.com — Week of [date]

GMV this week:            $[X]        YTD: $[X]
Revenue this week:        $[X]        YTD: $[X]
New sellers:              [X]         Total active: [X]
New buyers:               [X]         Total active: [X]
Auction lots entered:     [X]         Sold: [X]   ([X]% sell-through)
Average order value:      $[X]
Newsletter subscribers:   [X]         Open rate: [X]%
market_prices records:    [X]
NPS this week:            [X]/10
```

Two years of this email in an acquisition conversation is worth more than any pitch deck. It shows the trajectory of the business with zero spin.

**Transaction records — permanent**
Every bid, every sale, every payout. Permanent. Never deleted. This is the financial history and the data moat simultaneously. No transaction record is ever deleted from the database.

**Cohort fields on every account**
Every buyer and seller account has a `first_transaction_date` field that is set once on their first transaction and never changed. This single field generates all cohort retention analysis at any point in the future.

---

## Clean Financial Separation

**Platform revenue vs seller payouts**
Stripe Connect keeps these separate automatically. Platform commission stays in the platform Stripe account. Seller payouts go to seller accounts. Never commingled. The platform P&L shows only commission revenue.

**Trading desk completely separate**
Separate LLC. Separate bank account. Separate accounting. Never appears on AVauction LLC's P&L except as a licensing fee income line.

**Expenses tracked from day one**
Infrastructure, tools, legal, seller acquisition costs — all categorized consistently. Clean expense records from the beginning mean a clean P&L when due diligence starts.

---

## The Exit Negotiation

When the time comes to sell, the most important negotiating points are:

**What the buyer gets:**
The platform, the brand, the codebase, the domain, the newsletter list, the master equipment database, the seller and buyer relationships.

**What Sean and Tom keep:**
The market_prices transaction database access, the trading desk LLC, the ongoing pricing intelligence operation.

**The data license:**
The data licensing agreement between AVauction LLC and the trading desk LLC survives the sale. Sean and Tom continue accessing the pricing database through the trading desk LLC after the marketplace is sold. This is negotiated into the sale agreement, not assumed.

**Non-compete scope:**
A non-compete on operating a competing AV marketplace is reasonable. A non-compete on operating the trading desk using proprietary pricing data should be resisted — the trading desk is a separate entity with a separate purpose.

**These terms go into the LLC operating agreement from the beginning.** Both partners aligned on exit terms before any acquisition conversation starts means no disagreement when it matters most.

---

## The Due Diligence Data Room

When a buyer is serious they will request a data room. The following needs to be ready:

- Monthly P&L going back to first transaction
- GMV by month going back to first transaction
- Seller and buyer cohort retention charts
- Auction sell-through rate history by week
- Newsletter subscriber growth and engagement history
- market_prices table record count history by month
- NPS score history
- All legal agreements — seller agreement, buyer terms, platform terms, data license
- LLC operating agreement
- Stripe Connect financial records
- Attorney correspondence

Most of this is generated automatically by the weekly metrics system. The rest is standard documentation that gets maintained continuously.

---

## Summary — What To Do Right Now

1. File AVauction LLC and [Trading Desk LLC] before week 10
2. Draft the data licensing agreement between them
3. Build the weekly metrics email into the platform from the first auction
4. Never delete a transaction record — ever
5. Set `first_transaction_date` on every buyer and seller account at signup
6. Keep Stripe revenue and seller payouts permanently separated
7. Track expenses consistently from day one
8. Get exit terms into the operating agreement before either partner needs them

The platform that gets built is the platform that gets sold. Build it like someone is going to pay a multiple for it — because they will.

---

*Prepared for Tom — AVauction.com internal document*

---

## The Agentic AI Opportunity

As AI agents become capable of autonomous procurement — searching platforms, comparing prices, and executing purchases on behalf of buyers — AVauction.com is positioned as infrastructure, not a target.

An AI agent buying professional AV gear needs three things:

1. **Reliable pricing data** — what is a Yamaha CL5 Grade B actually worth right now?
2. **Trusted transaction infrastructure** — escrow, condition verification, inspection window
3. **Inventory access** — where is the gear and who is selling it?

AVauction.com answers all three. The pricing engine is the data layer any serious procurement agent would need to operate in this market. The platform doesn't compete with agentic AI — it becomes the data source agentic AI plugs into.

**The exit implication:**

A company building AI procurement tools for live events, touring production, or broadcast would want to acquire AVauction.com specifically for:
- The market_prices database — years of real professional AV transaction data
- The master_equipment reference database — the most comprehensive professional AV product catalog assembled
- The AVauction Price Index — a trusted, market-validated pricing layer
- The seller and buyer network — real professional AV rental houses and production companies already transacting

This expands the potential acquirer pool beyond traditional marketplace buyers to include AI companies, procurement software companies, and enterprise SaaS companies serving the live events industry.

Document this positioning in any acquisition conversation. The pricing database is not just a marketplace asset — it is AI training data and inference infrastructure for the professional AV procurement market.

