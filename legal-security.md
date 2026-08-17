# Security, Legal & Compliance

> **Part of the AVauction.com CLAUDE.md documentation system.** Core build context — product, architecture, auction model, schema, current state — lives in `CLAUDE.md`. This file holds platform security protections, the attorney-question list, INFORM Act / non-circumvention compliance, and competitive research policy findings. Read it when your task touches this area; otherwise the core file is enough. If anything here conflicts with a decision in `CLAUDE.md`, the core file wins.

---

## Security — Platform Protections

Nothing is unhackable but AVauction.com can be made very hard and unrewarding to attack. The risks below are specific to this platform and must be addressed before launch.

---

### The Keys — Most Critical

**Service role key** — bypasses Supabase RLS entirely. Lives only in `.env.local` on the development machine. Never committed to GitHub. Never gets a `NEXT_PUBLIC_` prefix. Never touches client-side code. If this key is ever exposed, rotate it immediately in Supabase dashboard.

**Stripe secret key** — same rules. Backend only. Never client-side. Never committed.

**Cloudinary API secret** — backend only. Upload presets handle client-side uploads — the secret never touches the browser.

---

### ⚠️ RLS Lessons from the July 2026 Security Audit — READ BEFORE TOUCHING POLICIES

The 37-check empirical security audit caught two failures that a policy review alone would have missed. Both are now fixed, and both are standing rules.

**1. RLS policies can be entirely inert without base table grants (fixed in migration 0026).**
Policies existed, looked correct, and reviewed clean — but the underlying tables had no grants, so the policies never evaluated. The configuration appeared right and enforced nothing.

**2. Seller-own policies broke the public marketplace (fixed in migration 0027).**
Policies scoped to "seller can see their own rows" were not correctly scoped for the anonymous case, so every anonymous visitor got permission errors across the entire public marketplace. The site was, functionally, down for logged-out users while looking fine to anyone logged in.

**The rule:** never accept a policy review as proof of security. Run empirical checks — actually query as anonymous, as a logged-in buyer, as a seller, as an admin, and confirm each role sees exactly what it should and nothing more. Test the anonymous path specifically on every public-facing table.

### Supabase Row Level Security (RLS)

RLS must be enabled and policies written for every table before launch. Without RLS, the anon key gives read/write access to everything.

Required RLS policies per table:
- `master_equipment` — public read for approved records only; no public write
- `market_prices` — no public access; internal only
- `listings` — public read for active listings; seller write only for their own listings
- `transactions` — buyer and seller read their own transactions only; no public access
- `master_equipment_scrape_log` — no public access; service role only
- `weekly_metrics` — no public access; admin only
- `stolen_gear_registry` — public read (serial number check); no public write; admin write only
- `pricing_engine_settings` — no public access; admin only
- `scraper_logs` — no public access; admin only

Claude Code must write RLS policies before any table goes live. No table launches without RLS enabled and tested.

---

### Admin Panel

The admin panel is never a publicly accessible URL. Requirements:
- Separate subdomain: `admin.avauction.com`
- Behind authentication — admin accounts only, no shared passwords
- Rate limited — failed login attempts trigger lockout
- Never indexed by search engines (noindex header)
- Audit log on every admin action — who changed what and when

The scraper health dashboard, trading desk, fuzzy match screen, and pricing engine settings are all admin-only. None of these are accessible from the public-facing platform.

---

### API Route Protection

Every Next.js API route must:
- Validate the request origin
- Rate limit by IP — prevent scraping of the platform's own data
- Require authentication for any non-public endpoint
- Validate and sanitize all inputs — no raw user input goes to the database

The AVauction Price Index gauge data must be rate limited aggressively. If someone can call it thousands of times with different model/grade combinations they can reconstruct the underlying market_prices database. Rate limit the gauge API to 60 requests per minute per IP.

---

### The Pricing Database — Protect the Moat

The market_prices table is the most valuable asset on the platform. Protections:
- No public API endpoint that returns raw market_prices records
- No bulk export feature
- The gauge shows ranges and confidence levels only — never raw transaction prices, never transaction counts, never source breakdown
- Admin access to market_prices requires a separate admin authentication layer beyond the standard admin login
- The trading desk has read access to market_prices through the separate Trading Desk LLC infrastructure — not through the platform's own admin panel

---

### The Trading Desk — Keep it Completely Separate

The trading desk is a separate LLC with separate infrastructure. It must never share:
- User accounts with the marketplace
- Database access credentials
- Server infrastructure
- Code repositories

Any connection between the trading desk and the marketplace platform is through the documented **internal** data licensing agreement only — an arm's-length agreement between two entities Sean and Tom own, executed for corporate separation and clean accounting. ⚠️ **This is not external data licensing.** Phase 3 states plainly: no public subscription product, no API access, no data licensing to third parties. The two statements are not in conflict; this one describes an internal instrument, and the wording is now explicit so it cannot be read as a licensing business. If the marketplace platform is ever compromised, the trading desk must not be exposed.

---

### GitHub Repository

- `.env.local` is gitignored — confirmed in `.gitignore`
- No secrets ever committed — scan commits before pushing
- Repository is private — SELLGEAR/avauction must remain private
- Service role key, Stripe secret, Cloudinary secret never appear in any commit history

If a secret is ever accidentally committed: rotate the key immediately, then remove it from git history using `git filter-branch` or BFG Repo Cleaner. Rotating is more important than cleaning history.

---


---

### robots.txt

A robots.txt file must be in place before launch at avauction.com/robots.txt.

```
User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /market-prices/
Disallow: /trading-desk/

User-agent: Googlebot
Disallow: /admin/
Disallow: /api/
Disallow: /market-prices/
Disallow: /trading-desk/
Allow: /listings/
Allow: /equipment/

User-agent: Bingbot
Disallow: /admin/
Disallow: /api/
Disallow: /market-prices/
Disallow: /trading-desk/
Allow: /listings/
Allow: /equipment/
```

⚠️ **The Disallow lines MUST be repeated inside each named user-agent group.** Per the robots.txt spec, a crawler obeys only the most specific group that matches it and ignores every other group, including `User-agent: *`. An earlier version of this file gave Googlebot a group containing nothing but `Allow: /`, which explicitly permitted Google to crawl `/admin/`, `/api/`, `/market-prices/`, and `/trading-desk/` — the exact opposite of the intent. Do not "simplify" this back.

This blocks automated scrapers from the admin panel, API routes, and pricing data pages, while leaving product and listing pages open so they index for SEO.

Important: robots.txt is a courtesy convention, not enforcement. Determined scrapers ignore it. The real protection for pricing data is authentication requirements and rate limiting — not robots.txt. Do not rely on robots.txt as a security measure.

### Before Launch Checklist

- [ ] RLS enabled and policies written for every table
- [ ] Service role key confirmed not in any commit
- [ ] Admin panel behind authentication and on separate subdomain
- [ ] All API routes rate limited
- [ ] Gauge API rate limited to 60 requests/minute/IP
- [ ] Stripe webhook signature verification enabled
- [ ] Input validation on all forms
- [ ] SSL/HTTPS enforced on all routes (Vercel handles this automatically)
- [ ] Security headers set (CSP, X-Frame-Options, HSTS)
- [ ] robots.txt in place at avauction.com/robots.txt
- [ ] Gauge API rate limits implemented (5/min, 25/day, authenticated only)
- [ ] Supabase audit logging enabled


---

## Competitive Research Findings — Build & Policy Additions (July 2026)

Full research in AVauction_Competitor_Research.md. These are the items that change the build.

---

### ⚠️ INFORM Consumers Act Compliance — REQUIRED BEFORE LAUNCH

Federal law (in effect June 2023) applying to online marketplaces. Penalties up to $53,088 per violation. Was not in prior planning — discovered in competitive/legal research.

**Trigger:** A seller becomes a "high-volume third party seller" at 200+ discrete transactions AND $5,000+ gross revenue in any rolling 12-month period within the prior 24 months.

**Platform obligations once a seller qualifies:**
1. Collect within 10 days: bank account info, contact info, tax ID (EIN/SSN), working email + phone; for businesses a government-issued record with business name and physical address
2. Verify within 10 days of receipt; re-certify annually
3. Disclose identifying info for qualifying sellers in listings or order confirmations
4. Suspend sellers who don't comply until they do
5. Provide consumer reporting mechanism — both electronic AND telephonic
6. Protect the collected data

**Build requirements (backend session, ~1-2 hrs):**
- Rolling 12-month transaction count + gross revenue tracking per seller with automated threshold detection and admin alert
- Collection/verification workflow triggered at threshold (most data already collected at seller signup — EIN, business info; gap is government-issued record capture and formal verification step)
- Annual re-certification email flow (Loops template + cron)
- Automated suspension for non-compliance (extends existing seller suspension machinery)
- Disclosure fields surfaced on listings/order confirmations for qualifying sellers
- General "report suspicious activity" mechanism: form + displayed phone number (extends stolen gear framework)

**⚠️ CRITICAL ATTORNEY QUESTION — #7 on the master list (Sean owns; see What to flag for the attorney):** The INFORM Act disclosure requirement conflicts with our anonymity-until-escrow model for high-volume sellers. How do we reconcile seller anonymity with mandatory identity disclosure for qualifying sellers? Does disclosure at order confirmation (post-purchase) satisfy the Act while preserving pre-purchase anonymity?

**Attorney question #8** (master list): Under separate-charges-and-transfers, confirm whether 1099-K filing obligation sits with Stripe or the platform.

---

### Buyer Default Policy (from Bring a Trailer's playbook)

BaT charges winning bidders who refuse to complete their purchase the full buyer fee (up to $5,000) and bans them. We need an equivalent:

- Winning bidder who fails to pay within the payment window: penalty fee (amount = attorney decision — #9 on the master attorney list), strike recorded, ban after repeated defaults
- Schema: extend the strike system to buyers (buyer_strikes or generalize seller_strikes to user_strikes)
- The auction close already creates the transaction at pending_payment — add a payment deadline and a default sweep to the escrow cron
- Relist flow for defaulted lots: offer to next-highest bidder or auto-bump to buy-it-now

**Auction-house reference model — Joseph Finn Co. terms (studied July 28, 2026, NOT for copying).** A 50-year auctioneer's terms are a checklist of every failure mode in the auction business. Useful mechanics to bring to the attorney, NOT clauses to lift verbatim (copyrighted, drafted for MA/NV, and for a one-sided auction, not a two-sided escrow marketplace):
- **Liquidated damages on payment default:** lesser of 20% of invoice OR resale shortfall + re-marketing costs. A concrete competitor number for attorney Q#6 and Q#9.
- **Card-on-file consent at registration** authorizing the house to charge damages later — worth asking whether our Stripe setup can capture equivalent consent cleanly.
- **25% deposit by end of sale day, balance next business day** — their cash-flow model. Our 72-hour Stripe escrow is gentler on buyers; positioning point.
- **Buyer pays all rigging/removal/shipping; house does zero logistics** — the opposite of AVGear's "we pack and ship." A live signal about what buyers value.
- **"As-is/where-is, no warranty"** — every auction house leans on this. ⚠️ It is the OPPOSITE of our trust-and-QC differentiator. Study it as what NOT to adopt wholesale.

⚠️ **The primary contract models for OUR clauses are not auction houses — they are escrow marketplaces.** Finn isn't two-sided and barely touches non-circumvention, escrow triggers, or chargeback allocation, which are our actual hard questions. Pull **Reverb's** and **StockX's** terms of service as the reference models for the escrow-marketplace clauses (the Reverb off-platform-fee note below is one such borrowing).

---

### Off-Platform Fee Recovery (from Reverb's terms)

Reverb reserves the right to charge its fee on any transaction initiated on-platform and completed off-platform, including on evidence of intent to move off-platform. This is the enforcement teeth for our non-circumvention clause. Attorney drafting item — pairs with existing attorney question on non-circumvention penalties.

---

### Failed Payout Pass-Through Fee

GearSource charges $50 per failed payout (PSP pass-through). Our terms should mirror whatever Stripe charges us for failed transfers. Terms language item.

---

### Competitive Positioning — Marketing Copy Ammunition

- vs SoldTiger/Tiger auctions: "No 18% buyer's premium. No as-is gambles. No renting a forklift to pick up your gear." (Tiger charges 18% buyer premium, all sales final as-is where-is, buyer handles removal)
- vs SoundBroker: "No memberships. No hidden markups. See the real market price before you bid." (SoundBroker adds undisclosed percentage on top of seller's net price, refuses to provide pricing guidance, charges membership fees)
- vs Gearsupply: "The only weekly auction event in pro AV" + superior escrow/inspection protection
- Universal: The Price Index. Nobody else tells buyers what gear is actually worth.

---

### ⚠️ Competitive Threat Watch: Gearsupply

Most serious competitor. Founded 2020, Cincinnati. ~5.9% flat fee. As of May 2025:
- L-Acoustics Certified Pre-Owned partnership (manufacturer-backed refurb + warranty, fulfilled via Gearsupply)
- Building "intelligent features that integrate with vendors' inventory systems — automatically identifying when gear is underutilised or has reached its optimal resale window" — they are building lifecycle/pricing intelligence
- Gearsupply Direct (formerly Soundsupply) buys gear in bulk over $50K — their trading desk equivalent, operating openly

They are 2-3 strategic moves from our position. Speed to launch matters. Our defensible differences: the weekly auction habit (they have nothing), richer buyer protection, and the dark data strategy (theirs is public-facing, ours compounds silently).

Phase 2+ opportunity validated by their playbook: manufacturer CPO partnerships with L-Acoustics competitors (d&b audiotechnik, Meyer Sound, Christie) once we have transaction volume.

---

### SEO Structural Advantage

268,048 master_equipment records = 268,048 *potentially* indexable product pages. No competitor has anything close. (Confirmed count as of July 2026, not an estimate.)

⚠️⚠️ **DECIDED JULY 28, 2026 — DO NOT INDEX PRODUCT PAGES AT LAUNCH.**

`market_prices` is empty (0 rows, verified). The gauge needs sold data; there is none. The fallback content layer — dealer asking ranges — needs asking data; there is none of that either. A product page today can show manufacturer, model, and specs, and nothing else.

**Publishing 268,048 near-identical spec pages with no pricing content is thin content at a scale that can suppress ranking domain-wide, not just on those URLs.** That is a self-inflicted wound on a brand-new domain with no authority to spare.

**At launch, index:** listing pages and category landing pages only. **`noindex` all product pages** until they carry real content.

**⚠️ COMPETITIVE INTELLIGENCE — AVGear sets `meta-robots: noindex,nofollow` on their product pages.** Verified directly on two live pages July 28, 2026. Our closest competitor has voluntarily removed ~23,000 product pages from Google. Combined with SoundBroker refusing to guide pricing, **product-page SEO in pro AV is an open field.** This does NOT change the launch decision below — thin content is still thin content, and a competitor's absence is no reason to publish empty pages — but it raises the value of getting the gate passed and makes the eventual Option A more valuable than earlier drafts assumed.

**The gate to reopen this:** a product page earns indexing when it has **≥ 3 asking prices from ≥ 2 distinct sources, scraped within 90 days.** Implement as a per-page check, not a global flag — a page cannot get indexed without passing it, so the system fails safe. Re-run the count after Phase B, index the qualifying set, leave the rest dark.

Three options were weighed. A = index only qualifying pages. B = index nothing but listings and categories. **C = index all 268k with a suppressed gauge — rejected outright, and must stay rejected.** B is correct today only because the qualifying set is currently zero; **A is where this lands once Phase B runs, and the gate above is what turns B into A automatically.**

**Requirements (frontend sessions — apply once the gate is passing, NOT at launch):**
- Product pages server-side rendered with schema.org Product markup (Next.js SSR already in place)
- Page title pattern: "[Manufacturer] [Model] — Used Price Range, Specs, Listings | AVauction.com"
- Category landing pages targeting "used [category]" head terms (used LED wall, used line array, used moving heads, used lighting console, used digital console)
- Price Index gauge on every product page = unique content no competitor shows (SoundBroker explicitly refuses to guide pricing). ⚠️ **This is the eventual state, not the launch state.** The gauge also obeys `gauge_min_sold_count` and `gauge_min_source_diversity` — below either threshold it shows a range with no needle, and with zero sold sources it shows nothing at all. **Before the gauge works, the content that carries a product page is the dealer asking range** ("N dealers currently asking $X–$Y, median $Z"), which is itself unique and which no competitor publishes either. Build the asking-range module first; the gauge slots into the same pages later, by which time the URLs have age.
- Brand+model long-tail is where AVLAuction and 10K Used compete — our database depth wins this automatically

---

### Phase 2 Ideas Validated by Competitor Research

- Volume seller tier agreements (GearSource negotiates fees at 50+ listings / $250K+ annual sales) — maps to power seller tier
- Success-fee-only featured listings (Reverb Bump: bid a % of price, pay only if the boosted listing sells) — better than flat featured fees
- Longer inspection window option for six-figure purchases (Reverb gives 7 days; 72 hours is tight for a $200K LED wall requiring assembly to test) — attorney + Tom decision, settings-driven so it's a config change
