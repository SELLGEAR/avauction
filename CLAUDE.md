# AVauction.com — North Star

## The Winning Version

A trusted weekly auction and free listing platform for used professional AV gear that quietly builds the best resale pricing database in the industry.

## The Launch Promise

**For sellers:** "List your used AV gear for free. If you want faster action, move it into Friday's auction."

**For buyers:** "Every Friday, serious used pro AV gear closes in one place."

**For the business:** "Every listing and sale makes our pricing data stronger."

---

## 📁 Documentation Map — READ THIS FIRST

This is the **core build file** — it contains everything needed to build AVauction: the product vision, architecture, database schema, the complete auction model (format, countdown, banner, transaction types), the grading system, Tom's anonymity constraint, business rules, current state, and open loose ends. **For most build sessions, this file alone is enough.**

Deeper reference material lives in separate files in this repo. Read the relevant one **only when your task touches its area** — otherwise stay in this file:

| File | Contains | Read it when… |
|------|----------|---------------|
| **`pricing-engine.md`** | Pricing engine design — weighted-median model, confidence-weighting source classes, gauge governance, grade floor, LLM-in-pricing design note | Building or calibrating the pricing engine / gauge, or importing price data |
| **`data-sources.md`** | Data-source status ledger, per-source research (AVGear, Reverb, scrapers), clean-source checklist, scraping & re-seeding workflow | Building/evaluating any scraper or data source, or deciding if a source is usable |
| **`competitors.md`** | Competitor profiles, threat analysis, positioning, design/feature inspiration from other platforms | Working on positioning, marketing, or competitive features |
| **`revenue-strategy.md`** | Upsell funnel, premium services, freight/financing referral revenue, internal-data trading edge | Building monetization features or revenue triggers |
| **`legal-security.md`** | Platform security protections, attorney-question list, INFORM Act / non-circumvention compliance, policy findings | Anything touching security, contracts, compliance, or terms |

**Rule:** if a reference file conflicts with a decision in this core file, **this core file wins** — it's the live source of truth. The reference files hold research and detail that justify decisions summarized here.

**Compact spec stubs** for the split-out areas (pricing engine, data sources) appear inline below where their full sections used to be, so you can build from the core without opening a reference file unless you need the depth.

---

## How to Work with Claude Code

Three things. That's all.

---

**1. Start every session with this:**

> "Read CLAUDE.md completely. Then tell me the north star, the phase 1 scope, and the revenue model in your own words before we write any code."

If the summary is wrong, correct it before touching anything. This takes 2 minutes and prevents hours of rework.

---

**2. Before any change:**

> "Before you touch anything, list every file and component that could be affected by this change."

Don't let Claude Code write a single line until it has mapped what it's about to touch.

---

**3. After any change:**

> "Audit everything you just changed. List what you modified and confirm nothing else broke."

The list is what matters. If Claude Code can't produce a list it didn't actually audit.

---

That's it. These three prompts catch almost everything.

---

## The Only Three Things That Matter at Launch

1. Sellers trust the platform enough to list real gear
2. Buyers show up every Friday and bid
3. Every transaction feeds the pricing engine

## What Everything Else Is

The rest of this document — concierge, white glove, newsletter, trading desk, financing, freight, AI pricing, exit strategy — is context, future thinking, and strategic direction. It exists so the builder understands why decisions were made and where the platform is going.

None of it overrides the north star. When in doubt, ask: does this serve the weekly auction and free listing promise? If not, it does not belong in phase 1.

## The Dangerous Version (Do Not Build This)

Marketplace + auction + concierge + newsletter + subscription data + AI pricing + freight + financing + white glove + trading desk + exit strategy all at once. That is too much. Build the core. The rest follows when the core works.

---

# AVauction.com — Project Context

---

## The Four-Phase Vision

This is the full business arc. Every technical and product decision made in phase 1 should support all four phases. Build it clean from day one.

### Phase 1 — Build the database
**Timeline: Now through January public launch**

The goal of phase 1 is not revenue — it is database density and platform credibility.

- Free buy-it-now marketplace removes all seller friction
- Seller app makes listing fast enough that rental houses actually do it
- ✅ Master equipment database seeded — 268,048 products, done before launch as planned (original target was 2,000–5,000)
- Every transaction records clean data — manufacturer, model, condition, price, date
- Weekly auction generates commission revenue and creates urgency
- Concierge launches as a premium service
- Newsletter builds the industry audience
- Pricing engine pulls from own transactions + competitor scraping + eBay

Success metric: database growing, sellers onboarding, buyers returning weekly.

### Phase 2 — Monetize the platform
**Timeline: Year 1-2 post launch**

The platform is a real business. Revenue comes from multiple streams.

- Auction commission volume growing as more sellers upgrade from free buy-it-now
- Concierge scaling — churches, schools, corporate AV departments paying for system design
- Newsletter subscriber base large enough to matter to the industry
- Upsell funnel converting passive buy-it-now sellers into active auction participants
- Seller tiers generating recurring revenue — power seller monthly fee or reduced auction commission, featured listings, newsletter placements
- Platform is cash flow positive

Success metric: consistent monthly revenue, growing seller and buyer base, newsletter forwards and referrals.

### Phase 3 — Use the data
**Timeline: 24+ months of transaction history**

The database is now the most valuable AV gear pricing resource in the industry. Nobody else has this data. It stays dark — no public subscription product, no API access, no data licensing. Publishing the data destroys the moat.

- Proprietary trading desk — Sean and Tom quietly buying undervalued gear using pricing intelligence unavailable to the market
- The arbitrage is profitable because the information asymmetry is real and compounding
- Tom's newsletter commentary is informed by the data — directional signals, market observations — without ever publishing the underlying numbers
- The AVauction Price Index gauge continues to show buyers and sellers just enough to be useful without revealing the data behind it

Success metric: arbitrage returns, newsletter authority, data moat widening every week.

### Phase 4 — Exit
**Timeline: When the multiple is right**

Sell the company at a multiple of marketplace GMV and auction commission revenue.

- Negotiate data access rights or licensing arrangement post-sale
- Retain ability to continue arbitraging on own account using data access
- The new owner gets the platform and the brand
- Sean and Tom keep the information edge and continue compounding it independently

Success metric: exit price, terms of data retention, personal financial outcome for both partners.

---

### What this means for every decision in phase 1
Every line of code, every database field, every product decision should be evaluated against this question: does this make the data more valuable, more complete, and more defensible?

- Every transaction must record clean structured data — no exceptions
- The master equipment database must be authoritative — no duplicates, no junk
- The pricing engine must be built to improve over time — not a static formula
- The newsletter must build a real audience — not just a marketing list
- The seller app must be easy enough that large sellers use it — database density depends on it

The marketplace is the vehicle. The database is the destination.

## What This Is
AVauction.com is a B2B professional AV gear auction marketplace serving the live events, rental, and AV integration industry. It combines a weekly auction format with a permanent buy-it-now section, a concierge procurement service, and the largest inventory database of professional AV gear in the country. The platform targets rental houses, integrators, and production companies buying and selling professional audio, video, lighting, staging, and rigging equipment.

The closest reference point is Bring a Trailer (bringatrailer.com) — not the aesthetics, but the model: curated listings, editorial voice, auction-as-event energy, community trust, and a newsletter that makes the platform indispensable. The design should feel premium, dark, and technical — built for serious industry professionals, not consumers.

---

---

## The Database Is the Business
Everything else on this platform — the auction, the buy-it-now, the concierge service, the newsletter, the seller app — exists to fill and monetize the database. The database is the moat. It is the single most valuable asset being built.

### Why the database wins long-term
A competitor can build a marketplace that looks like AVauction.com in 6 months. They cannot replicate 3 years of transaction history, 50,000 clean product records with accurate specs and aliases, real sold prices across hundreds of models, and depreciation curves built from actual market data. That data only exists if you are the platform transactions flow through. It compounds over time in a way that a UI never does.

GearSource has been around 22 years and never built a clean structured product database. They have listings but no reference layer underneath. AVauction.com builds the reference layer from day one. Every seller who uses the app improves it. Every completed transaction enriches it.

### Two databases — keep them strictly separate

**1. Master Equipment Database — the reference library**
Clean, structured, authoritative. One record per product. Never duplicated.
- Manufacturer
- Category (led_video/audio/lighting/staging/rigging)
- Model name and number
- All known aliases and alternate names
- Full specs — dimensions, weight, power draw, pixel pitch for LED, etc
- Official product image
- Link to manufacturer spec sheet / manual
- Year introduced, year discontinued (if EOL)
- Original MSRP

This database gets seeded before launch with the top 200-300 models that move through AV rental houses regularly. Tom provides the list. ⚠️ **Three different list sizes appear in this document and they are three different lists — do not conflate them: (a) 200–300 models = the curated launch-priority set Tom names; (b) 100–200 models = the initial eBay scrape seed, a subset of (a); (c) ~10,000 models = the full actively-traded scrape target the eBay pass expands to over time.** Every new product submitted by a seller that gets approved by admin gets added here permanently. Over time this becomes the most comprehensive searchable AV equipment reference database in the industry.

⚠️ **KNOWN DATA QUALITY ISSUE — flagged Aug 12, 2026, category field.** Spot-checked while seeding demo auction listings for the browse page: the MA Lighting grandMA3 full-size console — a lighting product — is filed with `category = 'audio'` in the live `master_equipment` table. This is AV-iQ scraped-data noise, not a one-off manual typo, so it's likely not isolated to this single record. **Consequence:** anything that filters or groups by `category` will silently mis-bucket real products until this is audited — the browse page's category filter, and later the pricing gauge's category-based comparables and per-category depreciation curves, since category determines what gear gets compared against what. **Not yet fixed.** Suggested audit approach: derive category primarily from manufacturer (MA Lighting/Martin/Robe/ETC/Avolites → lighting; DiGiCo/Yamaha/Avid/Allen & Heath/Midas/SSL → audio; Barco/Christie/Panasonic/ROE/Brompton/NovaStar → led_video), flag mismatches against the existing `category` value for manual review rather than blind overwrite, and handle staging/rigging manufacturers separately since manufacturer→category isn't 1:1 there. Do this before category filtering or the pricing gauge ship depending on this field being trustworthy.

**2. Seller Inventory Database — gear actually for sale**
Every record links to a master equipment record. Never stores duplicate product specs — just the seller-specific details.
- Foreign key to master equipment record
- Seller ID
- Quantity
- Condition grade (A/B/C/D = Excellent/Very Good/Good/Fair; plus a separate Poor/For Parts state, off the gauge — see GRADING SYSTEM)
- QC checklist responses
- Photos
- Asking price
- Reserve price
- Location (zip code)
- Serial numbers
- Hours of use
- Flight cases included (yes/no)
- Availability status (available/pending/sold/delisted)
- Listing type (auction/buy_now/both)

### What the database becomes over time

**Pricing engine** — authoritative used values for every major AV product. When a seller lists a Brompton SX40, the platform shows them what comparable units sold for in the last 90 days. When a buyer bids, they know if the reserve is reasonable.

**Concierge brain** — when a church needs a sound system, the AI searches the inventory database filtered by budget, category, and condition to spec a complete system from available gear.

**Newsletter intelligence** — Tom identifies EOL products in the master database. Price movement alerts come from transaction history. Market commentary is informed by what's actually moving and what's sitting.

**Market price index (internal only)** — the pricing intelligence powers the gauge and the trading desk. No public subscription product. Data stays dark.

**Search layer** — buyers search by manufacturer and model, not by whatever a seller typed into a description field. Results are consistent, accurate, and fast because they come from a clean reference database not free-text listings.

### Database rules — enforce from day one
- No listing can go live without linking to a master equipment record
- No duplicate products in the master database — admin merges or rejects submissions that already exist
- Seller inventory records never store specs — they inherit everything from the master record
- Every completed transaction records manufacturer, model, condition, final price, date — no exceptions
- "Can't find it?" submissions go to admin review before being added to master database

### Seeding the Master Equipment Database — Before Launch
✅ **DONE — do not rebuild.** This section is retained as the record of how the catalog was built and why. The seeding job completed in July 2026 at 268,048 unique products. Do not re-run the seeding scrapers as though the database were empty; see Scheduled Scraping for the weekly re-seed cadence that keeps it current.

The original directive was: do not wait for sellers to populate the master database, seed it aggressively before the seller app launches using AI-assisted scraping from existing AV product directories and manufacturer sites. That was executed.

**Sources actually used — ✅ COMPLETE, all 7 scrapers finished their first full pass:**
1. **AV-iQ** (av-iq.com) — the most comprehensive professional AV product directory in existence. **239,661 records, 99.1% success.** Contributed the overwhelming majority of the catalog.
2. **GearSource** — `gearsource` scraper
3. **Gearsupply** — `gearsupply` scraper
4. **SoundBroker** — `soundbroker` scraper
5. **UsedAVGear** — `usedavgear` scraper
6. **Clair Used Gear** — `clair_used_gear` scraper
7. **AVGear** — `avgear` scraper

⚠️ **CORRECTED JULY 28, 2026.** Earlier drafts listed AVIXA directories, distributor sites (Markertek, Full Compass, BH Pro Audio, Sweetwater Pro), manufacturer websites, and spec-sheet archives as the seeding sources. **None of those were built or used.** The seven above are what actually ran. The unbuilt sources remain available as future catalog-enrichment options — particularly manufacturer spec sheets for filling gaps in specs, dimensions, power, and weight on records AV-iQ covers thinly — but they are enrichment, not seeding, and the seeding job is done.

**What AI scraping collects per product:**
- Manufacturer name and all known aliases
- Model number and all known variants
- Product category
- Short description
- Full technical specs
- Current or discontinued status
- Official product photos
- Links to manuals and spec sheets
- MSRP when publicly available

**Tom's role in seeding (historical):**
Tom provided strategic input on which manufacturers and categories matter most to the professional AV rental market. AI did the scraping. Admin review and approval remains the standing rule for any *new* product entering `master_equipment` from a seller submission — that gate stays on permanently.

**Target before launch:** ✅ **Exceeded by roughly 50x.** The original target was 2,000–5,000 clean product records. Actual seeded catalog is **268,048 unique products** across 7 sources, with AV-iQ alone contributing 239,661. When a seller opens the app on day one and searches for their gear, it is already there.

This is the moat. It is also the SEO asset — see SEO Structural Advantage.

---

### Seller Acquisition Strategy — Asset Recovery Framing
When approaching rental houses about selling gear, the conversation should be framed as asset recovery, not marketplace listing. This speaks to CFOs and operations directors, not just gear managers.

**The depreciation context:**
Most rental houses depreciate their equipment over 5-7 years using IRS MACRS schedules, OR take the full deduction in year one using Section 179 or bonus depreciation. Either way, gear purchased in 2017-2020 is likely fully or heavily depreciated on their books right now.

**Why this creates a selling window:**
- Fully depreciated gear sits at $0 book value but still has real market value
- It costs money every month in storage, insurance, and maintenance
- It generates no further tax benefit since it's already written off
- It's aging technology getting harder to rent competitively
- Newer gear needs the warehouse space

**The recapture tax reality:**
When a business sells fully depreciated gear, the IRS recaptures the depreciation — the sale price can be taxed as ordinary income rather than at the lower capital gains rate. For businesses that took Section 179 or bonus depreciation upfront, this can mean a significant tax bill on the sale. Many CFOs are aware of this and it can be a source of hesitation.

**How to handle the recapture objection:**
Don't try to solve their tax problem — that's their accountant's job. Acknowledge it and redirect: "That's a conversation worth having with your accountant. What we know is that this gear is costing you money every month and we can help you recover real cash value from it. What you do with the proceeds is up to you."

**The outreach framing that works:**
Lead with asset recovery and cash generation. Target companies with fleets in the 5-10 year age range. Reference specific gear categories relevant to their business type.





---

## Seller App — UX Principles and Onboarding Flow

### The Core Tension
The app needs to be dead simple to use AND maintain data quality, trust, and legal protection. The solution is smart UX — make required things feel easy rather than making them optional. Never sacrifice escrow, photos, QC, or the seller attestation. Just make them painless.

### Seller Onboarding Flow — Full Sequence
1. Open app in phone browser or home screen shortcut
2. Create account — business name, email, password
3. Sign seller agreement — one screen, scroll, single checkbox, done. Full legal terms live here covering 10% auction commission, non-circumvention, misrepresentation liability, platform rules.
4. Connect Stripe for payouts — guided 3 minute flow, bank account details
5. Start listing immediately — no waiting period, listings go to admin review before going live

### Listing Creation Flow — Step by Step
1. Search master equipment database — type manufacturer or model name
2. Select exact product from results — specs, photo, and description pre-populated from master database
3. "Can't find it?" — manual entry submission goes to admin review, gets added to master database if approved
4. Guided photo prompts — app prompts seller to photograph: front, back, both sides, close-up of any cosmetic damage, powered on and producing output, serial number label, flight case if included. Minimum 8 photos. All taken in-app with phone camera. No uploading from computer required.
5. QC checklist — 8 yes/no questions, fast tap-through:
   - Powers on and produces full output
   - All original components present
   - Flight case or road case included
   - Cosmetic damage (none/minor/significant)
   - Any known technical issues (yes triggers description field)
   - Serviced or repaired (yes triggers description field)
   - Hours of use (approximate number)
   - Serial number confirmed
6. Platform calculates suggested condition grade from checklist answers — seller confirms or adjusts. Overrides flagged for admin review.
7. Quantity and location — how many units, zip code of gear location
8. Pricing — platform shows suggested price range from pricing engine. Seller sets their own asking price.
9. Listing type — buy-it-now (no seller commission in phase 1), auction (10% commission on sale), or both
10. Seller attestation — single screen before submission: "By listing this item you confirm it is accurately described and in the condition stated. You stand behind this listing and accept responsibility if the buyer raises a legitimate dispute. Misrepresentation may result in account suspension." One checkbox. One tap.
11. Submit for admin review — seller notified when approved and live

### Anonymity — Automatic, No Configuration Required
- Platform-assigned username (e.g. VerifiedSeller_4471) used everywhere publicly
- Seller company name, contact details, and exact location never shown to buyers until escrow is funded
- All photos watermarked automatically with avauction.com
- Seller does nothing — anonymity is the default, not an option

### Escrow — Invisible to Seller
- Seller never needs to think about escrow mechanics
- When gear sells: seller gets notification to ship within 48hrs
- When buyer releases funds after inspection: seller gets paid automatically
- Dispute freeze: if buyer raises a dispute, payout pauses — seller notified via app and email
- Seller experience: list → sell → ship → get paid. Everything else happens in the background.

### Photo Requirements — Enforced but Guided
- Minimum 8 photos per listing — app will not allow submission with fewer
- App provides guided camera prompts for each required shot
- Photos taken in-app — no file uploads required
- Cloudinary handles compression, CDN delivery, and watermarking automatically
- Powered-on test photo required for all electronic gear
- Serial number label photo required

### Seller Attestation — Per Listing
Not a wall of legal text. One clear plain English statement per listing submission. The full legal terms are in the seller agreement signed at onboarding — the per-listing attestation is a reminder that they are accountable for accuracy on this specific item.

### Buy-it-Now Pricing — Free During Database Building Phase
Buy-it-now transactions carry no seller commission in phase 1. This is a founding seller launch benefit — not advertised as free forever. Seller receives their full asking price minus nothing. Buyer pays actual payment processing cost (2.9% + $0.30) at checkout. Strategic rationale: maximizing seller adoption and database density in phase 1 is worth more than buy-it-now commission revenue. Fee structure reviewed at phase 2.

Auction format: 10% commission on final sale price.
Concierge service: fee charged to buyer, custom quoted per request. Commission on gear sourced from platform inventory if applicable.

IMPORTANT: Concierge is a manual service in phase 1 — no software UI built. Revenue can start week 1 with a contact form and phone call. See Concierge Service section for full spec.

---

## Business Model
- **Auction commission:** 10% on final sale price, paid by seller
- **Buy-it-now commission:** Free for sellers during phase 1 (founding seller launch benefit — not advertised as free forever)
- **Buyer payment processing:** Buyer pays actual payment processing cost (2.9% + $0.30) on all transactions
- **Concierge fee:** Buyer-paid, custom quoted per request
- **White glove:** Optional paid service or higher commission tier — TBD
- **Buyer's premium:** TBD — decision pending
- **Reserve prices:** TBD — disclosed vs undisclosed, decision pending
- **Payment processor:** Stripe Connect — handles escrow, commission split, seller payouts
- **Escrow window:** 72 hours after confirmed delivery for buyer inspection

---

## Tiered Service Model
The platform has multiple revenue streams across sellers, buyers, and concierge services. Build the database schema to support all tiers from day one even if only tier 1 is active at launch.

### Seller Tiers
- **Standard** — lists gear, pays 10% commission, standard queue position, manual listing creation
- **Power Seller** — priority listing placement, faster admin approval, dedicated support, bulk pricing, first access to concierge buyer leads
- **Enterprise** — white glove onboarding, handled personally by platform team, dedicated newsletter feature placement

### Buyer Tiers
- **Standard** — browses, bids, buys, self-serve
- **Concierge Basic (Phase 2)** — AI-generated gear recommendations for a project, sourced from platform inventory
- **Concierge Pro (Phase 2)** — full system design with wiring diagrams, rack layouts, signal flow
- **Concierge Premium (Phase 2)** — all of the above plus labor — installation, setup, commissioning

### Newsletter Tiers (Phase 2)
- **Free** — weekly auction highlights, basic market intel
- **Pro subscriber** — deeper editorial commentary, EOL alerts, early access to new listings before public release

Note: Pro newsletter content is editorial — market observations and directional signals. It does not include raw pricing data, price history, trend lines, or transaction records. Those stay dark.

⚠️ **Published as AVauction. No byline, no personal voice, no author attribution anywhere in the email, the archive page, or the metadata.** See the anonymity constraint.

### Listing Promotions (Phase 2)
- **Featured listing** — seller pays to place listing at top of auction or in newsletter
- **Verified appraisal** — seller pays for certified condition assessment
- **Escrow extension** — buyer pays for extended inspection window on complex systems

---

## Auction Format

⚠️ **TIMING MODEL — REVISED Aug 16, 2026. Final. Supersedes every earlier version, including the old "Friday noon bidding opens" model still described in some downstream sections below (Auction Countdown Timer, Marketplace Banner, Platform Personality) — each of those carries its own revision note.**

- **Monday 12:00pm ET ("high noon"):** The drop. Lots go live, the drop email sends, and bidding opens — all simultaneously, for every lot at once. **There is no pre-bid or browse-only state anymore** — a lot is biddable the instant it's visible.
- **Monday noon ET → Friday noon ET:** Bidding runs all week. Each lot counts down toward its own staggered close — never a shared close time.
- **Friday 12:00pm ET ("high noon"):** Staggered closes **begin** — one lot every N minutes (tunable, default 5) in scheduled order. **High noon is when closing STARTS, not a shared end time.** There is still no fixed "auction closes at X" — the auction ends whenever the last lot closes, and auto-extend can push that later still. Each lot counts down to its own close, never a shared one.
- **Auto-extend:** Any bid in a lot's final N minutes extends *that lot's* close by N minutes (tunable, default **2** — changed from the original 5/5 on Aug 16, 2026).
- **Weekend:** Winners pay, sellers ship, escrow holds.
- **All of the above timing values are tunable settings, not hardcoded** — `pricing_engine_settings`: `auction_drop_weekday`, `auction_drop_hour_et`, `auction_close_weekday`, `auction_close_hour_et`, `auction_stagger_minutes`, `auction_auto_extend_minutes` (migration `0030_auction_schedule_settings.sql`). The bidding engine already read `auction_auto_extend_minutes` live before this revision (see `0015_bidding_engine.sql`) — only the stored value changed, not the engine. `lib/time/auctionSchedule.ts` mirrors these constants client-side for the between-auctions countdown; the database is authoritative.
- **Planned, not built:** whale early-access preview bidding the week before the public drop; a max-extensions ceiling per lot; a tighter stagger interval for high-lot-count auctions. Noted here as future scope only — do not build any of these now.

The weekly cadence is the brand. Monday drop → Friday high-noon showdown → repeat forever.

**Tagline (decided Aug 11, 2026): "New drops every Monday · Auctions on Friday."** Use as the identity line on the main auction page header. "Drops" is deliberate — sneaker-drop cadence energy, and it teaches the whole model in five words.

**Main auction (browse/grid) page — REVISED Aug 16, 2026 (supersedes the Aug 11, 2026 pre-bid-week reference mock, `design/auction-browse.html`, which needs a redraw before anyone builds off it):**
- Header: the tagline as the eyebrow, "This week · N lots" as the headline. **No shared countdown while lots are live** — bidding opened the instant the lots dropped, so there's nothing to count down to. The three-cell countdown (`CountdownCells`) appears here only during the gap between auctions (see below), retargeted to the next Monday-noon drop instant.
- Grid of lot cards. Each card: photo, grade badge (single letter + color: A green / B green / C amber / D red), manufacturer + lot #, title, current bid (or "No bids yet"), a compact live countdown to that lot's own close (`LotCloseCountdown`, compact size), and watcher count. Every card is in this live state from the moment it drops, all week — there is no separate pre-bid card variant anymore.
- Sort options: ending soonest, most watched, closest to me (proximity matters for heavy gear pickup), price.
- Buy-it-now does NOT appear on this page — it's a separate section with its own accent color.
- **Between-auctions state** (after the last Friday lot closes, until the next Monday-noon drop): grid is empty, copy reads "No lots match this week — check back Monday for the next drop," and the header shows `CountdownCells` retargeted to the next Monday-noon-ET drop instant, captioned "Next drop in."

---

## Two Transaction Types
1. **Weekly Auction** — competitive bidding, time pressure, curated by admin
2. **Buy-it-Now** — fixed price, permanent section, always available

These two sections have **different accent colors** — auction gets one, buy-it-now gets another. Both sit within the same dark premium design language.

⚠️ **A listing is ONE type — auction OR buy-it-now, never both on the same item.** The seller picks at listing time (see Seller Listing Lifecycle). Do not render a buy-it-now block on an auction listing or vice versa. (Confirmed Aug 11, 2026 — an early mock wrongly showed both on one listing.)

⚠️ **The auction listing page is STATUS-DRIVEN — one component, multiple states, not a static page.** REVISED Aug 16, 2026 — the pre-bid state is gone; bidding is live the instant a lot drops. `design/auction-detail.html` (reference mock, Aug 11, 2026) still shows the old two-state Pre-bid/Live split and needs a redraw before anyone builds off it. Current states:
- **Live (Monday-noon drop → that lot's staggered close):** bidding open from the moment the lot is visible. Panel shows current bid, the proxy max-bid field ("your max bid — we bid up to this for you"), and the countdown to *this lot's* close (tightening to red minutes/seconds in the final N minutes — tunable, default 2 — with the auto-extend notice). Status badge: Live auction → Closing soon → Auction closed. There is no more "Upcoming" badge.
- **Closed:** lot has closed; shows final price and outcome.
- **Future element (do NOT build at launch — pricing engine/`market_prices` is empty):** an estimated price range ("based on recent sales") on the listing page. Documented placeholder only; wire it once pricing data flows.
- **Future element (design later with Tom):** the "WE'LL DO IT LIVE" moment — now tied to Friday high noon, when staggered closes begin, not the Monday drop. See Platform Personality.
- **Future feature, not built:** whale early-access preview bidding the week before the public drop.

---

## Phase 2 — Concierge Service (Do Not Build in Phase 1 — Schema Only)
A concierge procurement service for end buyers like churches, schools, and corporate AV departments who need help specifying and sourcing a complete AV system.

**How it works:**
- Client submits a project brief — budget, room size, use case, existing gear
- AI generates a full system recommendation sourced from platform inventory
- Tom reviews and quality checks the recommendation
- Client pays a fee for the service — tiered by complexity
- Platform earns commission on any gear purchased through the recommendation

**Tiers:**
- Basic — AI gear list with links to platform listings
- Pro — full system design with wiring diagrams, rack layouts, signal flow documentation
- Premium — Pro plus labor, installation, and commissioning (subcontracted)

**Phase 1:** Do not build concierge UI, buyer tiers, or the projects table. Concierge is a manual service in phase 1 — contact form, phone call, paid proposal. No software. Schema added in phase 2 when manual volume justifies it.

---

## Gear Entry Form (Build in Phase 1 — Primary Listing Creation Tool)
The gear entry form is the primary way sellers add inventory. It is a guided, mobile-friendly form that walks sellers through one piece of gear at a time. The AI does the heavy lifting so the seller just answers questions. It should feel like a native mobile app — one field or step at a time, large tap targets, camera integration. A rental house tech should be able to walk through their warehouse and enter gear on their phone in real time.

### Barcode / UPC Scanning
- Seller scans the barcode or serial number label on the gear using their phone camera
- Platform hits a product database API (Barcodelookup, UPCitemdb, or similar) to pull manufacturer, model, specs, and stock photo
- Seller confirms the match and continues — most fields pre-populated automatically
- If no barcode match found, seller enters manufacturer and model manually — AI still generates description and category from that input

### Fields
- Manufacturer + model (pre-filled from scan if available)
- Category (auto-suggested by AI from model)
- Serial number
- Year of manufacture / purchase year
- Hours of use (approximate)
- Zip code of gear location — displayed on listing so buyers can estimate freight
- Quantity (if listing multiple identical units)
- Photos — minimum 8, mobile camera upload
- Known issues — required free text field, cannot be left blank

### QC Checklist + Self-Grading
Walk the seller through a checklist instead of asking them to assign a grade directly. The platform calculates a suggested grade from their answers. Seller can accept or adjust — overrides flagged for admin review.

Checklist items:
- Powers on and produces full output — yes/no
- All original components present — yes/no
- Road case or flight case included — yes/no
- Cosmetic damage — none / minor / significant
- Any known technical issues — yes/no, describe if yes
- Has the gear been serviced or repaired — yes/no, describe if yes

### AI-Assisted Pricing Suggestion
After the gear is entered, the platform suggests a price range. See Pricing Intelligence section below.

**AI description generation must handle both photo input AND text/spec input** — build it to accept either so it works for all entry methods.

---

## Pricing Engine & Data Sources — COMPACT SPEC (full detail in reference files)

> The full pricing-engine design is in **`pricing-engine.md`**; the data-source ledger and scraper research are in **`data-sources.md`**. This stub carries the build-critical decisions so you can work from the core file. Open the reference files only for deep detail or when adding/evaluating a source.

**The gauge:** a KBB-style Price Index shown on product pages. Its value is a **weighted median** of graded comps for that model — never an LLM-invented number.

**Confidence weighting** — `weight = base_weight(source_class) × confidence_multiplier(grade_confidence)`. Six source classes:
- `own_transaction` — 1.00 (AVauction's own sales; the gold standard, grows post-launch)
- `marketplace_sold` — 0.60 (Reverb sold data — the clean sold-price source, 658 rows pulled, staged)
- `auction_sold_retail` — 0.50
- `auction_sold_liquidation` — 0.25 (liquidation format; **excluded from median**, floor signal only)
- `dealer_asking` — 0.15 (AVGear, dealer scrapers)
- `private_asking` — 0.10

**Gauge display governance:** `gauge_min_sold_count` and `gauge_min_source_diversity` gate whether the needle shows. `gauge_grade_floor = good` — only A/B/C grades feed the median. Output labeled with its basis ("12 verified sales" vs "47 asking prices"). At launch with no verified sold sources, the needle is suppressed — **do not build the estimated-range UI element yet; `market_prices` is empty.**

**Clean-source rule (before building ANY scraper):** a source must pass THREE gates — (1) robots.txt allows the paths, (2) terms don't forbid commercial reuse, (3) prefer a sanctioned API over scraping around one. Reverb & AVGear are CLEAN. GearSource, Joseph Finn, SoldTiger are BLOCKED (terms/copyright). Full ledger in `data-sources.md`.

**Phase B staging workflow:** all pricing scrapers write to `market_prices_staging`; promotion to `market_prices` is **manual, never automatic**.

**LLM in the pricing engine:** the LLM does product-matching, labeled no-data fallback estimates, and explanation — it NEVER invents the gauge number. Full design note in `pricing-engine.md`.

---

## Tech Stack
- **Framework:** Next.js (TypeScript)
- **Database:** Supabase (auth + database + realtime)
- **Payments:** Stripe Connect (marketplace mode — escrow, commission split, seller payouts)
- **Email:** Loops.so (transactional emails + weekly newsletter)
- **Photo storage:** Cloudinary (upload, resize, CDN, watermarking)
- **AI features:** Claude API claude-sonnet-4-20250514 (listing description generation from photos and text, Q&A contact scanning, pricing suggestions, concierge system design in phase 2)
- **Barcode lookup:** Barcodelookup API or UPCitemdb (gear entry form scanning)
- **Hosting:** Vercel
- **CSS:** Tailwind CSS
- **Code editor:** Cursor + VS Code
- **Component generation:** V0 by Vercel (v0.dev)

---

## Design Direction
- **Background:** Deep dark — #0D0D0D or similar
- **Typography:** Clean, modern, confident — not consumer, not corporate
- **Auction accent color:** TBD — Sean and Tom to decide from 3 variants
- **Buy-it-now accent color:** TBD — different from auction, same session
- **Photo treatment:** Large, beautiful, editorial — gear photos treated like art
- **No stock photos of people** — real gear only
- **Mobile first** — buyers will bid from phones during Friday close, sellers will enter gear on phones in warehouse

The design should make a rental house operator think "this was built by people who know this industry" — not "this looks like a startup template."

---

## Database Schema

### users
- id, email, role (buyer/seller/admin), buyer_tier (standard/concierge_basic/concierge_pro/concierge_premium), created_at

### sellers
- id, user_id, business_name, ein, business_type (rental_house/integrator/production_company/dealer/other), website, phone, years_in_business, verification_status (provisional/verified/trusted), seller_tier (standard/power/enterprise), stripe_account_id, created_at

### listings
- id, seller_id, title, description, manufacturer, model, condition_grade (A/B/C/D), category (led_video/audio/lighting/staging/rigging/other), pixel_pitch, hours_of_use, serial_number, year_of_manufacture, purchase_year, zip_code, asking_price, reserve_price, listing_type (auction/buy_now/auction_with_buy_now), auction_start, auction_end, status (draft/pending_review/active/sold/expired), featured (boolean), priority (integer), entry_method (manual/barcode_scan/form), grade_override (boolean — flagged if seller overrode suggested grade), created_at

### bids
- id, listing_id, buyer_id, amount, created_at

### transactions
- id, listing_id, buyer_id, seller_id, manufacturer, model, condition_grade, final_price, commission_amount, listing_type, zip_code, stripe_payment_intent_id, escrow_status (held/released/disputed), inspection_deadline, created_at

### disputes
- id, transaction_id, filed_by, reason, status (open/resolved), resolution, created_at

### qa_messages
- id, listing_id, buyer_id, question, answer, is_public (boolean), flagged (boolean — AI contact scan), created_at

### subscriptions
- id, user_id, plan (standard/power/enterprise), stripe_subscription_id, status (active/cancelled/past_due), created_at — power seller plans added in phase 2

### projects (Phase 2 — concierge jobs)
- id, buyer_id, title, budget, room_description, use_case, existing_gear_notes, tier (basic/pro/premium), status (submitted/in_review/recommendation_sent/approved/ordered/installed), assigned_to, created_at

### market_prices (pricing intelligence)
- id, source (avauction/gearsource/gearsupply/soundbroker/ebay), manufacturer, model, condition, asking_price, sold_price, listing_url, scraped_at

### qc_responses (gear entry checklist)
- id, listing_id, powers_on (boolean), all_components (boolean), flight_case (boolean), cosmetic_damage (none/minor/significant), known_issues (boolean), known_issues_description, serviced (boolean), service_description, suggested_grade, seller_accepted_grade (boolean), created_at

---

## Condition Grading System

## GRADING SYSTEM — DECIDED July 28, 2026. This is final. Build to it.

⚠️ **This supersedes every earlier grading note in this document, including the "Tour Ready / Rental Ready / Parts" labels that appeared in prior drafts and in the current gauge component.** Those labels were invented in an earlier build session, were never real trade vocabulary, and are being removed. **Sean owns grade definitions — NOT Tom. Do not route this to Tom.** (Earlier drafts assigned it to him; that was wrong and is corrected here.)

**The scale — five tiers, four priced, one not.** Modeled on Kelley Blue Book and Reverb, the two standards in adjacent used-gear markets. Both use Excellent / Very Good / Good / Fair and refuse to put a value on anything below Fair. We do the same.

| Letter | Name | On the gauge? | Feeds the median? |
|---|---|---|---|
| **A** | Excellent | ✅ needle at top | ✅ yes |
| **B** | Very Good | ✅ | ✅ yes |
| **C** | Good | ✅ | ✅ yes |
| **D** | Fair | ✅ needle at bottom, still a real price | ⚠️ stored, LOW weight — see below |
| **—** | Poor / For Parts | ❌ **NO gauge, NO needle, NO range** | ❌ never |

**Poor is NOT "Grade E."** It is a separate listing state, outside the A–D scale, that suppresses the gauge entirely. The listing shows "Sold as-is — no price estimate," the reasoning being that Poor/parts condition varies too widely to price meaningfully. This matches KBB, which won't value a vehicle below Fair. The gauge component renders Poor with no needle and no range — see the corrected gauge spec.

**Buyer-facing definitions (market-standard language — do not reword into invented terms):**
- **A — Excellent:** Looks and performs like new. Tested to full manufacturer spec, only minor signs of use. Ready for high-profile touring and broadcast.
- **B — Very Good:** Fully functional, minor cosmetic marks such as light scuffs or rack rash. No effect on performance.
- **C — Good:** Works properly with visible cosmetic wear from regular professional use. Everything essential is intact.
- **D — Fair:** Functional but with noticeable wear or minor known issues, disclosed in the listing. Priced accordingly.
- **Poor / For Parts:** Not fully operational, or sold for parts, repair, or salvage. Sold strictly as-is, no returns. Inspect before bidding.

**⚠️ GAUGE GRADE FLOOR — a settings rule, store it in `pricing_engine_settings` alongside the two existing gauge thresholds.** Add `gauge_grade_floor = good`. The gauge median feeds ONLY on grades A/B/C (Excellent/Very Good/Good). This mirrors Reverb's Price Guide, which averages good-or-better and excludes fair/poor/non-functioning. Grade D (Fair) is stored and shown, but weighted low and excluded from the median that positions the needle; Poor never enters at all. **Consequence: this raises the bar for the gauge to display — with zero verified sold data today, the empty-gauge state is even more likely at launch, which is further support for the noindex-product-pages decision in SEO Structural Advantage.**

**Two-axis note (AVGear reference, NOT our model).** AVGear grades on two separate axes — Functionality F1–F5 and Cosmetic C1–C5 — verified on their live product pages July 28. A two-axis scale is genuinely better than a single letter (it separates "works but ugly" from "pretty but broken"). **We considered it and chose single-scale A–D anyway,** because the five-word scale is what sellers already know from Reverb and KBB, and because there is working four-grade gauge code to build on. The QC checklist still captures functional and cosmetic observations separately, so the second axis can be surfaced later without a migration if ever wanted. This is a deliberate decision, not an oversight.

**Their operation, for the competitive record:** 30,000 sq ft warehouse, 40+ years combined Pro AV experience, multi-level QA on every inbound item, 14-day Pre-Owned Guarantee, Make an Offer flow, trade-in funnel, resale + consignment + auctions under one brand. **Grading is NOT our differentiator against AVGear** — they grade more granularly, inspect in a real warehouse, and back it with returns. **Our gap is price discovery, not quality assurance:** they tell a buyer the condition of the one unit they're selling at the price they set; nobody tells anyone what a thing is WORTH. We are a marketplace with competing sellers and proxy bidding that discovers a clearing price. Sharper claim, harder claim — it depends on Phase B working.

---

## Key Features to Build

### Seller Side
- Seller application form (business verification)
- Gear entry form — mobile-first, barcode scanning, QC checklist, AI description generation, pricing suggestion
- Listing management dashboard
- Payout history and Stripe Connect bank account management
- Private Q&A — seller chooses public or private per answer

### Buyer Side
- Search with filters — category, manufacturer, condition grade, price range, zip code / distance, listing type
- Watchlist and saved searches with email alerts
- Real-time bidding with countdown timer
- Buy-it-now instant purchase
- Inspection window with escrow release button
- Buyer dashboard — active bids, won auctions, purchase history

### Admin (Sean)
- Listing approval queue — review before going live, flag grade overrides
- Seller tier management
- Escrow controls — hold, release, freeze for disputes
- Transaction monitoring
- Newsletter management via Loops.so
- Market price scraper monitoring

### Platform
- Photo watermarking — auto-stamp avauction.com on every uploaded photo
- Weekly auction schedule automation
- Auto-extend logic — 5 min extension on late bids
- Staggered lot endings — one lot every 5 minutes on Friday
- Realtime bid updates via Supabase
- Featured listing placement
- Background market price scraping service

---

## Email Triggers (Loops.so)
- Bid placed → notify seller
- Outbid → notify previous high bidder
- Auction won → notify winning bidder + payment instructions
- Listing approved → notify seller it's live
- Payment received → notify seller to ship within 48hrs
- Escrow released → notify seller payout coming
- Q&A submitted → notify seller
- Q&A answered → notify buyer
- Seller onboarding confirmation
- Inspection window reminder — 24hrs before close
- Saved search alert — matching listing goes live

All emails should sound human and professional — not legal, not robotic.

---

## SEO Keywords to Target
- used LED wall for sale
- buy used Brompton processor
- used pro AV gear auction
- AV asset recovery
- used professional lighting equipment
- used audio console for sale
- used LED panels rental house
- used d&b speakers for sale
- used L-Acoustics for sale
- professional AV equipment liquidation
- used ROE panels for sale
- buy used Disguise media server
- used professional video wall
- AV rental house liquidation
- professional AV gear price guide
- used AV equipment value

---

## Business Rules
- **Non-circumvention:** Sellers and buyers cannot transact directly outside the platform for 24 months
- **Seller anonymity:** Platform-assigned usernames until escrow funded
- **Photo requirements:** Minimum 8 photos per listing. Powered-on test required for LED panels.
- **Known issues disclosure:** Required field — cannot be left blank
- **Shipping requirement:** Hard cases or proper crating for items over $10K
- **Pre-ship photos:** Required before shipping label issued
- **Admin approval:** Every listing reviewed before going live
- **No public comments:** Private Q&A only
- **AI contact scanning:** Every Q&A message and listing description scanned by Claude API for identifying information before posting. Includes subtle attempts like "Google us" or "find me on LinkedIn." Flagged messages blocked and logged, sender receives clear error message.

---

## Partners
- **Sean** — Port St. Joe, FL. Web and graphic design background. Building the platform. Public face of the company.
- **Tom** — Nashville, TN. AV industry insider. 50/50 partnership. Marketing, seller relationships, newsletter intelligence, concierge quality check. **⚠️ PUBLICLY ANONYMOUS — see the constraint below. This is not optional.**

---

## ⚠️ TOM'S ANONYMITY — HARD CONSTRAINT, READ BEFORE BUILDING ANY PUBLIC-FACING FEATURE

**Tom's employer must not learn he has an ownership stake in AVauction.com. If they do, he loses his job.** Professional AV is a small industry — the people who read this site, subscribe to the newsletter, and sell gear here are the same people who work with and around his employer. Exposure is not theoretical.

**"Silent" means invisible, not inactive.** Tom does the work — business development, seller relationships, newsletter intelligence, grading language, industry judgment. The constraint is purely on visibility.

**Absolute rules — no exceptions until Sean says the constraint has lifted:**
- Tom's name appears NOWHERE public. No About page, no team page, no founder bio, no footer, no press release, no social profile, no `<meta author>`, no code comments that ship to the client.
- No bylines. Newsletter and all editorial publish as AVauction, never under a personal name or a recognizable personal voice.
- No named quotes or testimonials attributed to him.
- No signing public-facing contracts, partnership agreements, or vendor deals in his own name. Sean signs.
- No in-person representation of AVauction to customers, vendors, or at industry events under the AVauction banner.
- No photographs.
- Do not generate placeholder team/about content that includes a second founder — leave it as Sean only.

**Design principle:** every feature that draws on Tom's industry credibility must attach that credibility to the **AVauction brand**, never to a named individual. Published criteria and process, not "our guy vouches for it."

**When it lifts:** once the company is established enough that Tom can leave his employer. Sean decides and will say so explicitly. Until then, assume the constraint is active.

---


---

## Account Types and Trust System

### Two Account Types

**Individual Account**
- Personal name, personal email
- No business verification required
- Can buy freely
- Can sell but starts at lowest trust tier
- Maximum 5 active listings at a time
- No access to power seller features
- Suitable for freelancers, small operators, one-off sellers

**Business Account**
- Business name and EIN required
- Physical warehouse or business address verified
- Business type — rental house, integrator, production company, dealer
- Years in business, website
- Starts at higher base trust tier than individual
- Higher listing limits
- Access to power seller features and concierge sourcing
- Eligible for verified and trusted tier promotions
- Optional general location display — "Nashville, TN rental house" — without revealing company name. Sellers who display location get a small trust boost.

Business accounts get more trust by default. A verified LLC with an EIN and a physical address has legal accountability. Buyers bidding $50,000 on a line array need to know who they're dealing with.

### Trust Tiers

**Individual tiers:**
- Unverified individual — lowest trust, limited listings, buy-it-now only until first successful transaction
- Verified individual — ID verified, can access auction after first clean transaction

**Business tiers:**
- Provisional business — EIN submitted, pending admin verification
- Verified business — EIN confirmed, address verified, full platform access
- Trusted business — verified plus clean transaction history and positive reviews
- Power seller — trusted plus volume threshold, priority placement, reduced commission
- Enterprise — largest sellers, managed personally by platform team

### Seller Rating and Fulfillment Strike System

Every seller starts with a clean record. Violations are logged and affect trust tier, search placement, and platform access.

**What counts as a violation:**
- Item sold privately without updating platform listing
- Item listed as available, seller cannot fulfill when buyer pays
- Condition significantly different from what was listed
- Serial number does not match listing
- Gear not at listed zip code location

**Strike system:**
- Strike 1 — warning, notification sent, listing pulled, seller required to audit inventory
- Strike 2 — 30 day restriction from new listings, rating badge shows fulfillment issue
- Strike 3 — permanent suspension from selling, flagged for admin review

**Private sale detection:**
When a seller delists gear, platform asks: "Was this sold through AVauction.com?" No answer logs a private sale flag. Too many private sale flags triggers non-circumvention review.

### Review System

After every completed transaction both buyer and seller are prompted to leave a review.

**Buyers review sellers on:**
- Accuracy — was gear as described?
- Condition — matched the grade?
- Communication — responsive through Q&A?
- Shipping — packed well, shipped on time?
- Overall star rating 1-5

**Sellers review buyers on:**
- Payment — paid promptly?
- Communication — reasonable and professional?
- Overall star rating 1-5

**Review moderation:**
Admin can flag and remove reviews that violate policy. If a buyer opens a dispute and loses, their review on that transaction is flagged and weighted lower. Reviews cannot be used as weapons after losing a dispute.

**Combined trust score:**
Fulfillment record plus review average equals the seller's trust rating. One number that tells the whole story. Visible to buyers on every listing before they bid.

### Trust Incentive Stack for Sellers
- Higher trust → better sort position in search results
- Higher trust → concierge sourcing eligibility
- Higher trust → featured in newsletter
- Higher trust → lower commission at volume
- Higher trust → access to power seller and enterprise tiers
- Higher trust → financing partner referrals prioritized

---

## Listing Flow — Single Path Rule

Gear can only be in one place at a time — auction OR buy-it-now. Never both simultaneously. This protects auction integrity and prevents buy-it-now sales from pulling hot lots out from under active bidders.

**Seller chooses one path at submission:**
- **Auction** — enters next available Friday close, sets reserve price, 10% commission on sale. Stays in auction only until it closes.
- **Buy-it-now** — permanent marketplace listing, free, no auction.

**If auction fails to meet reserve:**
Automatically bumps to buy-it-now at seller's pre-set asking price. No action required from seller. Seller notified via app: "Your [Model] didn't meet reserve at auction. It's now listed in buy-it-now at $X. You can adjust the price anytime."

**Moving from buy-it-now to auction:**
Seller requests through app. Gear pulled from buy-it-now immediately when it enters auction queue. Goes into next available Friday.

---

## Zip Code and Proximity

Every listing requires a zip code at submission — where the gear physically is located. This drives freight estimation, buyer filtering, and concierge sourcing logic.

**Buyer sorting and filtering:**
- Filter by distance — show gear within X miles
- Sort by closest — proximity as a sort option alongside price, trust rating, ending soonest, most watched
- Estimated freight indicator on each listing — approximate miles from buyer, rough freight cost range based on gear weight category and distance

**Concierge proximity sourcing:**
When building a system recommendation the AI factors in this priority order:
1. Trust rating — highest trust first
2. Proximity — closest gear to buyer's zip code
3. Availability — in stock, ready to ship
4. Condition grade — matches project requirements
5. Price — within buyer's budget

Local and regional sourcing prioritized. Distant sellers only pulled in if local inventory doesn't meet requirements.

**Pricing engine regional data:**
Zip code on every transaction enables regional price variation analysis in phase 3 — used internally by the trading desk.

---

## Industry Verified Badge

The highest trust designation on the platform. Invitation only. Cannot be applied for. Granted by AVauction based on direct industry knowledge and a verified relationship with the company.

⚠️ **Never describe this publicly as any individual's personal endorsement.** The credibility attaches to AVauction. Publish the verification criteria and the process; do not publish or imply who performs it. See the anonymity constraint.

**What it signals:**
Not just that a business has a verified EIN and address — any legitimate business can get that. The Industry Verified badge signals that a senior person at AVauction.com knows this company personally, has confirmed their reputation in the industry, and is putting their credibility behind this seller. At the level of $200,000+ transactions buyers want human judgment behind the trust signal, not just an algorithm.

**Who qualifies:**
- The largest, most recognizable rental houses in the industry
- National integrators with established track records
- Production companies that work major tours and events
- Companies with established reputations in the professional AV industry that can be verified through industry channels

**How it's granted:**
Outreach happens through AVauction. The conversation confirms the company is who they say they are, their inventory is real, and their operation is legitimate. No application process — invitation only.

⚠️ Tom drives this using his industry knowledge, but does so **without identifying himself as a principal of AVauction.** Any facility visit or in-person representation is Sean's, not Tom's. Correspondence goes out under AVauction, not a personal name.

**The full trust tier ladder:**
1. Unverified individual
2. Verified individual
3. Provisional business
4. Verified business
5. Trusted business
6. Power seller
7. Enterprise
8. **Industry Verified** — top tier, invitation only, AVauction verification (see anonymity constraint — never framed as an individual's endorsement)

**What the badge unlocks:**
- Prominent badge displayed on every listing and seller profile
- Priority placement above all other trust tiers in search results
- First consideration for white glove listing service
- Featured placement in newsletter
- Best available commission rate
- Dedicated account management from AVauction
- First access to concierge buyer leads

**The business development angle:**
The Industry Verified conversation is also where white glove service, volume discounts, and enterprise account management get pitched. A relationship-building moment dressed as a trust feature. Industry credibility opens the door — the badge formalizes the relationship on the platform. ⚠️ All of it under the AVauction name.

**Scarcity is the point:**
Industry Verified should never be common. If every seller has it, it means nothing. Tom keeps the list small and selective. The exclusivity is what makes buyers trust it.

---


---

## Auction Countdown Timer

⚠️ **REVISED Aug 16, 2026 — supersedes the "Friday noon bidding opens" model throughout this section.** Bidding now opens Monday noon ET at the drop, for every lot simultaneously, and runs all week — there is no pre-bid state. Bidding **closes** per lot, staggered starting Friday noon ET one every N minutes (tunable, default 5), and auto-extend can push any individual lot later — so there is still no fixed, shared close time for the auction as a whole. Because bidding is open the moment a lot is visible, the lot-close countdown (`LotCloseCountdown`) is now the primary countdown in the product — every lot is live and counting toward its own close from Monday onward. The three-cell "opens in" countdown (`CountdownCells`) survives only for the gap between auctions, counting to the next Monday-noon drop. The countdown timer is a core part of the auction experience — it creates urgency and brings buyers back as each lot's own close approaches.

### Design — REVISED Aug 16, 2026 (supersedes the Aug 11, 2026 pre-bid-state version, which itself superseded an earlier four-color/four-cell spec)
- **Precision scales with proximity — show only the units that matter:**
  - **Between-auctions state (after the last Friday close, until the next Monday-noon drop):** three cells — Days / Hours / Minutes, counting down to the next Monday-noon-ET drop. No seconds. Neutral styling — no colored bars. This is the *only* context `CountdownCells` still appears in — there is no more pre-bid browse state.
  - **Live, early in the stagger:** Hours / Minutes (Days too if a lot is far down the queue), counting down to *that lot's own* close — never a shared auction-wide close time. Still neutral. This is the default state for every lot, all week, from the Monday-noon drop onward.
  - **Live, final N minutes of a lot (tunable, default 2 — changed from 5 on Aug 16, 2026):** Minutes / Seconds, rendered **red** — seconds now carry genuine urgency, and red *means* "closing now" rather than decorating a cell. This is also when the auto-extend notice shows and the window the server actually watches for auto-extend — the visual threshold and the real trigger must stay in sync if the tunable changes.
- **Color is a signal, not decoration.** Neutral until the final-minutes urgency state, then red. Do not reintroduce per-unit colors.
- Large tabular-numeric font for the numbers — easy to read at a glance.
- Progress bar below the countdown fills as the auction week progresses (optional; keep subtle).
- Social proof row — lot count, total bids, watchers — updates in real time via Supabase.
- Auto-extend notice appears when under N minutes remaining (tunable, default 2) — "A bid in the final N minutes extends this lot N more minutes."
- Status badge: **Live auction → Closing soon → Auction closed.** There is no more "Upcoming" status — every lot is live from the moment it's visible.

### Behavior
- The main auction page shows no countdown while lots are live — bidding opened the instant the lots dropped, so there's nothing left to count toward. It only shows a countdown (to the next Monday-noon drop) during the gap between auctions, when there are zero lots.
- Bidding opens for every lot simultaneously at the Monday-noon drop — the one fixed, shared clock in the system.
- Once bidding is open, there is no shared "auction closes at X" countdown anywhere. Starting Friday noon, lots close one every N minutes (tunable, default 5) in sequence, and auto-extend can push any given lot's close later still. The main auction page never shows a close countdown — only individual lots do.
- Individual lot pages show the countdown for that specific lot's own close time, live from the Monday-noon drop onward — the only close countdown that exists in the system.
- Auto-extend logic — if a bid lands in the last N minutes (tunable, default 2), that lot's timer extends N minutes and the auto-extend notice appears.
- When a lot closes, its own status badge updates to Auction closed and its timer stops. Other lots keep counting down independently on their own schedule.

### Where it appears
- Main auction page — no countdown while lots are live; shows a countdown to the next Monday-noon drop only during the gap between auctions
- Individual listing page — counts to that specific lot's own close time, live from the Monday drop
- Seller dashboard — seller sees countdown for their active auction lots, each counting to its own close
- Buyer dashboard — buyer sees countdown for lots they are bidding on, each counting to its own close

### Real-time updates
- Bid count and watcher count update via Supabase real-time subscriptions — no page refresh
- Timer itself is client-side JavaScript — no server calls needed for the countdown
- Auto-extend fires via a server-side webhook when a late bid is detected — updates the close time in the database, client picks up the new time on next tick

---


---

## Platform Personality + Easter Eggs

AVauction.com has a personality. It was built by people who work in live events and understand the chaos, humor, and culture of the industry. The platform should feel alive — not a sterile transactional website like GearSource, but something that makes production people feel at home.

The closest reference point is Bring a Trailer's editorial voice. BaT feels like it was written by people who actually love cars. AVauction.com should feel like it was built by people who've actually loaded trucks at 3am and watched LED walls go dark five minutes before doors.

### The philosophy
- Personality lives in the moments, not the chrome. The listings page is clean and professional. The individual moments of delight are what give it character.
- Industry insiders will get the references. People outside the industry won't notice them. That's the target.
- These moments get screenshotted and shared in AV Facebook groups and Slack channels. That's free marketing.
- The platform's cultural intelligence comes from genuine industry knowledge — what lands with rental house operators, tour techs, and production managers. Tom contributes this from his experience in the industry.

### The Bill O'Reilly moment — Friday high noon, when closes start firing
⚠️ **REVISED Aug 16, 2026.** Bidding now opens at the Monday-noon drop, not Friday noon — see Auction Format. The O'Reilly moment moves with the timing model, but NOT to Monday: it now marks **Friday high noon**, the instant staggered closes begin. When the clock hits Friday noon and the first lots start counting down to their close, the auction page shows a brief "WE'LL DO IT LIVE" moment. A flash, an animation, a sound clip option — something that acknowledges the chaos of going live. Production people will love it. People who don't get it will just see the closes starting normally. This is the flagship Easter egg — the one that gets shared.

### Other moments to build — specific implementation TBD with Tom
The following are trigger points where something delightful should happen. Specific references, memes, animations, and sounds to be determined by Sean and Tom as they build — they know the industry culture better than any spec document. The point is that these moments exist and are built intentionally.

**Public-facing moments — buyers and sellers see these:**
- Friday high noon, staggered closes start firing — the WE'LL DO IT LIVE moment (corrected Aug 16, 2026 — previously mis-attached to bidding opening, and to the wrong weekday; see Auction Format)
- Auto-extend fires in a lot's final N minutes (tunable, default 2) — something acknowledges the chaos of a late bid
- The week's last lot closes — a variable, staggered moment marking the true end of the week, distinct from the Friday-noon O'Reilly moment above, which marks closes *starting*, not the week ending
- First bid on a new listing — something welcomes the first bidder
- Reserve met — a subtle acknowledgment that the seller is getting paid
- Buyer wins an auction — the win confirmation has personality, not just "congratulations"

**Internal moments — Sean and Tom only:**
- First record ever scraped into market_prices table — one-time moment
- First listing ever submitted — one-time moment
- First bid ever placed on the platform — one-time moment
- First transaction ever completes — confetti in admin panel, one time only, never again
- First payout ever sent to a seller — one-time moment
- Industry Verified badge granted — something marks the moment the platform personally vouches for a seller
- Newsletter hits subscriber milestones — internal acknowledgment
- Scraper hits 10,000 market_prices records — internal milestone

### Build approach
Do not prescribe specific memes or cultural references in code — those come from Sean and Tom as they build. Build the trigger points and the infrastructure for moments to happen. Leave placeholders with comments like: `// TODO: Sean and Tom decide what goes here — this is where the WE'LL DO IT LIVE moment fires`. The specific content gets filled in during build sessions when the right reference surfaces naturally.

The platform should feel like it was made by people who are having fun building it. Because it was.

---


---

## Bundle Listings

Sellers can list multiple pieces of gear as a single bundle that must be purchased together. This is common for complete touring rigs, installed systems, and fleet liquidations where the seller wants one transaction, one buyer, one truck.

### Three listing types
Every listing starts with the seller choosing one of three types:
1. **Single item** — one piece of gear, links to one master equipment record
2. **Bundle** — multiple pieces sold together as one lot, one price, one transaction, cannot be purchased individually
3. **Auction lot** — single item or bundle entered into the weekly Friday auction

### Bundle listing flow in the seller app
- Seller taps "Create bundle" — gives the bundle a name (e.g. "Complete d&b V-Series PA System — Nashville")
- Adds items one by one — each searched and matched to master equipment database
- Sets quantity per item — "12x d&b V8, 6x d&b V-SUB, 4x d&b D80 amplifier"
- Adds photos — hero shot of the full system together plus individual item photos
- Completes one QC checklist covering the overall system condition
- Adds known issues field — must disclose any issues with any component
- Sets one asking price for the entire bundle
- Sets zip code — where the full system is located
- Submits for admin review

### What the bundle listing looks like to buyers
- Single listing page with system name and hero photo of the full rig
- Component breakdown table — every piece listed with specs pulled from master equipment database, quantity, and condition
- One price — no individual component pricing shown
- Clear messaging: "This system is available as a complete package only — components cannot be purchased separately"
- One buy-it-now button or one bid — entire bundle transacts as one
- Freight note — bundle listings should include estimated freight or note that buyer arranges freight for full system pickup

### AVauction Price Index gauge for bundles
Instead of pulling a single model's market range, the gauge adds up the individual market values of each component from the market_prices table and shows a combined estimated range. "Based on current market data, the individual components in this system have a combined value of $X — $Y. Bundle pricing is typically 10-20% below individual component values." Seller uses this as a reference for pricing.

### Breaking up a bundle
If a bundle listing doesn't sell, the seller can choose to break it up and list components individually through the seller dashboard. Admin converts the bundle into individual listings. The platform never forces this — it is always the seller's choice. Each component inherits photos and details from the bundle listing to make the conversion fast.

### Database value of bundle listings
Bundle listings capture real system configurations — what gear actually gets deployed together in real-world applications. This is valuable intelligence for the concierge AI when building system recommendations. "Churches in the 1,500-seat range typically run this combination of amplifiers, speakers, and processing." Over time the bundle listing history becomes a library of real-world system configurations.

### Concierge connection
A seller with a complete system to sell is a natural concierge opportunity. Rather than listing the bundle publicly and waiting, the platform can match it directly to a buyer who needs that exact system through the concierge service. The bundle listing feeds the concierge inventory — when a buyer requests a complete PA system, the concierge AI searches bundle listings first before trying to assemble individual components.

---


---

## Marketplace Banner — Three States

A persistent banner sits at the top of every buyer-facing marketplace page. It evolves automatically through three states based on where the platform is in its build and where the weekly auction cycle is. No manual switching — the platform knows what state it's in and shows the right banner.

### State 1 — Auction coming soon (feature flag — buy-it-now live, auction not yet built)
**Color:** Purple
**Message:** "Weekly auctions coming soon — every Friday, professional AV gear, competitive bidding, verified sellers"
**CTA:** "Join waitlist" — captures email, adds to Loops.so newsletter list
**Purpose:** Every buy-it-now buyer becomes an auction prospect. Builds the audience before the auction exists. The waitlist email goes out the moment bidding opens.

### State 2 — This week's auction (Monday-noon ET drop through the last lot closing Friday onward — variable)
**Color:** Green
⚠️ **REVISED Aug 16, 2026 — no more pre-bid/live split.** Bidding opens at the drop, so State 2 is live for its entire span, start to finish:
- **Message:** "[X] lots live — bidding open now." **No shared countdown** — lots are already biddable from the moment they dropped, each closing on its own staggered clock starting Friday noon, and auto-extend can push any individual lot later. The banner does not tick down to anything; it links straight into the auction, where each lot shows its own close countdown. **CTA:** "View auction →" — takes buyer directly to the auction listings page.
- **Friday high noon ET — the showdown moment:** this is where the "WE'LL DO IT LIVE" easter egg fires (see Platform Personality), marking the instant staggered closes begin. The banner message can shift to acknowledge it (e.g. "WE'RE DOING IT LIVE. Closes are starting.") — exact copy TBD with Tom.
**Purpose:** Creates urgency for buy-it-now browsers throughout the week and drives auction participation from the buy-it-now audience.

### State 3 — Between auctions (after the last lot closes Friday, until the next Monday-noon ET drop)
**Color:** Amber
**Message:** "Next drop lands Monday at noon. [X] lots incoming." **Countdown:** `CountdownCells` (Days/Hours/Min, neutral), retargeted to the next Monday-noon-ET drop instant — the same component and instance the browse page's between-auctions state uses.
**CTA:** ⚠️ **REVISED Aug 16, 2026** — previously "Browse lots →" to "upcoming lots that are visible but not yet open for bidding." That no longer applies: lots don't exist publicly until the Monday-noon drop itself (reveal and bidding-open now happen at the same instant), so there is nothing to browse during this gap. New CTA needed — likely a waitlist/notify-me action reusing the State 1 mechanism — exact copy and behavior TBD with Tom.
**Purpose:** Keeps auction momentum visible over the weekend. Monday noon the banner automatically switches back to State 2.
**Note:** the State 2 → State 3 transition is triggered by the last lot's status actually flipping to closed, not by a clock time — see Technical implementation.

### Technical implementation
- ⚠️ **REVISED Aug 16, 2026:** State 2 no longer has an internal pre-bid/live split — it's live for its entire span, so there's nothing left to switch between within State 2 itself.
- The State 3 → State 2 switch is **time-based**: the fixed Monday-noon-ET drop instant — the same clock that opens bidding for every lot simultaneously.
- The State 2 → State 3 switch remains **event-based, not time-based**: it fires when the last lot's status flips to closed, not at a fixed clock time. Staggered closes plus auto-extend make the real end time variable, so this transition cannot be driven off "current time ET" the way the State 3 → State 2 switch can.
- State 1 is a feature flag — set to true until the auction layer is built, then flipped to false permanently
- Countdown in State 3 is the `CountdownCells` component, retargeted to the next Monday-noon drop — State 2 shows no countdown at all, per the countdown timer section
- Waitlist email capture in State 1 connects to Loops.so — same list as the newsletter waitlist
- Banner appears on: homepage, listings page, individual listing pages, buyer dashboard
- Drop/close schedule is a tunable setting, not hardcoded — see `pricing_engine_settings` (`auction_drop_weekday`, `auction_drop_hour_et`, etc., migration `0030_auction_schedule_settings.sql`), the same values the browse page and listing countdowns read from

---


---

## Photo Content Moderation

Every photo uploaded to the platform passes through multiple layers of moderation before it is stored, displayed, or included in a listing. This is automatic and invisible to legitimate sellers — it only activates when something inappropriate is detected.

### Layer 1 — Cloudinary moderation pipeline (primary)
Cloudinary — already in the stack for photo storage, compression, CDN, and watermarking — has a built-in moderation pipeline that runs on every upload before the image is stored.

Configure Cloudinary to run AWS Rekognition moderation on every upload:
- If confidence score for explicit or suggestive content exceeds threshold → image rejected, never stored
- Seller receives immediate error: "This image was rejected. Please upload appropriate photos of your gear only."
- Rejected images are logged with seller account ID for admin review
- Three rejections from the same account flags the seller for admin review

This is a single Cloudinary configuration setting — no extra code required beyond the initial setup.

### Layer 2 — AWS Rekognition or Google Cloud Vision SafeSearch
Either service can be used as the moderation engine behind the Cloudinary pipeline:
- **AWS Rekognition** — detects explicit, suggestive, violence, and visually disturbing content. Returns confidence scores per category. Fast and cheap at scale.
- **Google Cloud Vision SafeSearch** — detects adult, spoof, medical, violence, and racy content. Same confidence score approach.

Threshold configuration:
- Explicit content — reject at any confidence level above 50%
- Suggestive content — reject above 80% confidence
- Violence — reject above 70% confidence
- Log borderline cases (40-threshold%) for admin review without blocking upload

### Layer 3 — Admin review before listing goes live
Every listing requires admin approval before it goes live regardless of photo moderation outcome. Sean reviews all photos as part of the standard approval process. This is the human backstop for anything the AI missed or flagged as borderline. Admin sees the moderation confidence scores alongside each photo in the review queue.

### Layer 4 — Seller agreement
The seller agreement includes explicit language that uploading inappropriate, offensive, or non-gear-related content results in immediate permanent account suspension with no appeal. This is the legal backstop.

### Layer 5 — Buyer report button
Every listing has a report flag visible to buyers. If a photo is reported:
- Listing is immediately hidden from public view pending admin review
- Admin notified immediately
- If confirmed violation — listing removed, seller account suspended, strike logged
- If false report — listing restored, no action against seller

### Implementation in the build
Add photo moderation to the gear entry form build in week 4. Cloudinary moderation pipeline is a configuration change — enable it when setting up Cloudinary in the project. AWS Rekognition or Google Vision credentials added to environment variables. The moderation check happens server-side before the upload confirmation is returned to the seller app — from the seller's perspective it either uploads successfully or shows an error. No visible moderation UI needed.

---


---

## Domain and Hosting
- **Domain:** avauction.com (Porkbun, DNS → Vercel)
- **Hosting:** Vercel (landing page live)
- **GitHub:** github.com/SELLGEAR/avauction
- **Deployment:** Push to main → auto-deploys

---

## Open Loose Ends — Aug 17, 2026

Short-list from the Aug 16, 2026 auction-timing-model session. Not full spec, just the things that must not get forgotten.

1. ✅ **RESOLVED Aug 18, 2026 — migrations 0029 and 0030 are both applied** (via the Supabase SQL editor, the standing workflow — there is no linked CLI project). Verified live: `auction_auto_extend_minutes` now returns 2 through the listing endpoint, and `search_listings()` has the `most_watched` sort. Note from applying: the repo has exactly ONE Supabase project (`kcvalrtjghrldrekzqug`) — a separate production project doesn't exist yet; decide dev/prod split before soft launch.
2. ✅ **RESOLVED Aug 18, 2026 — `.reverb-token` and the scraper JSON dumps (`avgear-*.json`, `reverb-*.json`) added to `.gitignore`.** Verified none were ever committed on any branch — no history scrub needed.
3. ✅ **RESOLVED Aug 18, 2026 — the 36-line change in `lib/auction/types.ts` was browse-page code, kept and committed.** It adds `SearchListingResult`/`SearchListingsResponse`/`AuctionSort`/`ConditionGrade`, mirroring `search_listings()` from migration 0024 and used by `SortChips`, `useAuctionLots`, `LotCard`, and `app/auction/page.tsx`. Committed with the browse-page components and migration 0029.
4. ✅ **BUILT Aug 18, 2026 — listing detail page + `GET /api/listings/[id]`.** Route is `/listing/[id]` (serves auction now; buy-it-now gets its own accent later). States: Live (bid panel wired to `POST /api/bids`, per-lot `LotCloseCountdown`, auto-extend notice in the final N min) and Closed/SOLD — no pre-bid state, per the Aug 16 model. Reserve-not-met lots render as a "now in buy-it-now" note. Stops at SOLD — no checkout UI. Live updates are **polling** (10s, 3s in the urgent window) — Supabase realtime is a future upgrade. `design/auction-detail.html` still shows the dropped pre-bid state; the built page is authoritative. Remaining gaps: watchlist toggle button (no API for it yet) and auth UI (see #6).
5. ✅ **DECIDED Aug 19, 2026 — NO early-browse window. The Monday high-noon drop IS the reveal, by design.** Buyers get no advance notice of what's coming before lots are biddable — intentional, to preserve the drop moment. No early-look mechanism will be added (the whale early-access preview remains separate future scope — see Auction Format). Do not rebuild any pre-reveal/browse-only state.
6. **Auth UI does not exist — the bid flow is not end-to-end browser-testable until it does (added Aug 18, 2026).** `POST /api/bids` requires a Supabase Bearer token, but no page in the app can produce a session — there is no sign-up/sign-in UI anywhere. The listing detail page's BidPanel renders a disabled "Sign in to bid" placeholder and already listens via `onAuthStateChange`, so it lights up the moment auth ships with no changes needed. **Auth UI is the next slice after the listing detail page.** Until then, bidding can only be exercised with seeded tokens (see `scripts/seed-auction-demo.mjs`). **Ship WITH the auth slice (from the Aug 18 ultrareview, deferred deliberately):** `useListing` doesn't subscribe to `onAuthStateChange`, so after a mid-page sign-in `listing.viewer` stays null until the next poll — the "You're the high bidder" pill won't show for an incumbent, and `applyBidResult`'s `prev.viewer ? … : prev.viewer` short-circuit can't promote viewer from null on a first bid. Fix both when login exists: refetch on SIGNED_IN/SIGNED_OUT, and let `applyBidResult` populate viewer from null using the server's `is_high_bidder`.
7. **Vercel env: set `NEXT_PUBLIC_SUPABASE_URL` before the app deploys (added Aug 19, 2026).** Local `.env.local` was missing it, which made every listing detail page fail client-side with "supabaseUrl is required" thrown before the fetch — invisible to tsc/build/curl, browser-only. Fixed locally, but `.env.local` is gitignored so the fix doesn't travel: check the Vercel project's env vars have `NEXT_PUBLIC_SUPABASE_URL` (and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) before deploying the app, or production listing pages hit the same failure — degraded now to anonymous fetches by commit `dacdf34`'s hardening, but signed-in features would silently break.
8. **Minor bug: "Closest to me" sort doesn't clear its error / re-sort after entering a zip (noted Aug 19, 2026).** On the `/auction` browse page, entering a zip should clear any prior sort error state and re-run the nearest sort; currently it sticks. Fix in `app/auction/page.tsx` / `SortChips` / `useAuctionLots` wiring next time someone is in the browse page.
9. **Auction operations admin dashboard — not built, not needed before launch.** Schedule or skip weeks, assign approved lots to a week's drop, monitor the live Friday auction, pull a lot mid-auction. Needed before *regular weekly operation*, but early auctions can be run manually: "skip a week" simply means not assigning lots to that Monday's drop, and timing settings are adjusted directly in `pricing_engine_settings` (see Auction Format). Build the dashboard once manual operation becomes the bottleneck, not before.

---

## Current State — Updated July 28, 2026

**Landing page live at avauction.com. Backend core is BUILT. Frontend is the remaining work.**

### Backend — complete and verified
Built in the Week 2 Claude Code sessions (Fable 5). 13 commits, migrations 0001–0028, 280+ empirical verification checks passed.

- All 23 tables created with Row Level Security
- Proxy bidding engine (21/21 checks)
- Auction close logic (24/24)
- 12-state transaction machine
- Stripe Connect escrow — separate charges and transfers pattern, verified against real Stripe sandbox money movement (20/20)
- pg_trgm fuzzy match system (22/22)
- Pricing engine — weighted median, IQR, time decay, bootstrap confidence (21/21)
- Buy-it-now flow (19/19)
- Seller listing submission with QC grading and quality scores (27/27)
- Search and browse API with haversine distance sorting (24/24)
- Auth flows, including a privilege-escalation fix proven with live JWTs (20/20)
- Admin panel APIs with audit trail (25/25)
- 37-check empirical security audit — see Security section for the two critical RLS failures it caught

### What remains

⚠️ **REPRIORITISED JULY 28, 2026.** `market_prices` verified empty (0 rows). Phase B moves up — it is the blocker for the pricing engine, the gauge, and product-page SEO, all of which are currently inert. SSR product pages drop OFF the pre-launch list entirely; they cannot do anything useful until Phase B has run. See SEO Structural Advantage.

**Migration prerequisite before Phase B writes its first row:** add `source_class` to `market_prices` (spec'd in the confidence weighting model, never migrated). The table is empty, so this is free now and expensive later.

⚠️⚠️ **NEXT-SESSION TASK #1 — the highest-value thing waiting (staged July 28, 2026):**
**Import the Reverb sold data.** `reverb-sold.json` on Sean's machine holds **658 real, condition-graded sold prices** across 53 priority models — the first realized-price data the project has ever had, and the answer to the empty-`market_prices` problem. It is staged, reviewed-ready, and blocked only on the migration. Sequence:
1. Migration: add `source_class` (enum incl. `marketplace_sold`), and confirm `inferred_grade`/`grade_confidence`/`sold_price` columns accept the Reverb rows. Table is empty → free migration.
2. Review `reverb-sold.json` — especially the A-grade over-representation (Brand New maps to A; decide whether to add an `is_new_in_box` flag so new dealer stock isn't counted as a used-Excellent comp).
3. Load into `market_prices_staging`, manual-promote per the Staging-and-Review Workflow.
4. Then extend: the puller (`pull-reverb-sold.mjs`) covers 60 seed models; widen the model list for fuller coverage, and schedule it. Reverb endpoint: `/api/listings/all?query=MODEL&state=sold`, token in `.reverb-token`, `public` scope.
This is what makes the gauge work. Do it first, do it fresh, do it carefully.

1. Phase B pricing scrapers — ⚠️ **source availability must be verified first; see the Data Source Status Table and the sold_verified definition.** ⚠️ **Reverb is now VERIFIED as the primary sold-price source (658 graded rows staged) — it is no longer "unverified" as older lines in this doc say.** ⚠️ **This is larger than "run the existing scrapers." The 7 seeding scrapers are seeding-proven, not price-writing — extending them to capture and store prices on a schedule is new work. See the Active / asking price sources table.** **Start with `avgear.com/products.json` — it is live, public, structured, and needs no scraping.** Then eBay Browse (asking only), Reverb (unverified), SoundBroker sold archive (PAYWALLED — attorney question). Must write to `market_prices_staging` with manual promotion — see Staging-and-Review Workflow. **eBay prereq: account-deletion notification endpoint, or the keyset stays disabled.**
2. INFORM Consumers Act compliance module — REQUIRED BEFORE LAUNCH
3. Wire the 7 seeding scrapers into `scraper_logs`
4. ALL frontend — seller gear entry form, public listing pages, auction UI, admin panel, dashboards
5. Email notifications (Loops.so) and newsletter template
6. Mobile optimization + SEO — ⚠️ **SSR product pages are NOT a pre-launch item.** `noindex` them at launch; index listing and category pages only. See SEO Structural Advantage for the decision and the gate that reopens it.
7. Legal pages
8. Testing with founding sellers

### Schedule constraint
Sean departs for Korea August 27. Target is code-complete before departure, with the Aug 24–26 window held as buffer. Soft launch after return. January public launch target.

**Dated dependency: the AVGear auction opens Aug 13 (Day 1 closes Aug 19, Day 2 Aug 20).** It is the only realized-price event in our exact categories with a hard date. ⚠️ **However — ingesting its prices is blocked pending attorney Q#10** (Finn's terms forbid commercial reuse; the bidding platform blocks scraping). Watching it live for market awareness is fine and worth doing; building it into the product is not, until legal clears it. Softer deadline than earlier drafts implied.

**Do not rebuild anything in the completed list above. Read the migrations before assuming something is missing.**

**⚠️ THE FEED IS NOT THE SITE — established empirically July 28, 2026.** AVGear's `products.json` shows no condition data at all; their live product pages show a per-item `Condition:` line plus a two-axis grading rubric. Three separate wrong conclusions were reached that night by reasoning from the feed alone: first "they don't grade," then "they grade only what has a number," then finally the truth, found only by fetching an actual page. **Apply this to every source: before concluding a field does not exist, open the page.** A structured endpoint is a convenience, not an inventory of what a site publishes.

**And the converse, which cost us a wrong decision on July 28: do not assume something EXISTS because this document describes it.** `source_class` is specified in detail here and is not a column. `market_prices` is described as the pricing engine's foundation and is empty. **When this document and the database disagree, the database wins. Query it — `information_schema.columns` for schema, `count(*)` for data — before planning around anything either one asserts.**

### Original build order (historical — items 1–9 are done or in progress)

Build order:
1. Market price scraping service — START THIS FIRST, before anything else. eBay API scraper + competitor scrapers running on day one. Every week it runs makes the pricing engine more valuable. Costs almost nothing to run in the background while everything else is being built.
2. Project foundation + full database schema (all tier fields, phase 2 tables, market_prices, qc_responses)
3. Seller onboarding flow
4. Gear entry form — barcode scanning, QC checklist, AI description, pricing suggestion
5. Auction engine + public listings pages
6. Stripe Connect + escrow
7. Buy-it-now flow
8. Seller Q&A + AI contact scanning
9. Admin panel
10. Seller and buyer dashboards
11. Email notifications (Loops.so)
12. Newsletter template
13. Mobile optimization + SEO
14. Legal pages
15. Testing with founding sellers
16. January public launch

*(Retained for reference. See the status block above for what is actually complete.)*

---


---

## Week 2 Session 1 — Schema Decisions (Pre-Build Notes)

These decisions were locked in before the database schema session. Claude Code must implement these exactly.

---

### Listings Table — Single Table for Auction and Buy-It-Now

One listings table handles all listing types. No separate auction_lots table.

```
listing_type field: 'auction' | 'buy_it_now' | 'flash_listing'
```

---

### Transaction States — Complete State Machine

```
pending_payment       — buyer won or clicked buy, payment not captured yet
payment_captured      — Stripe captured payment, funds in escrow
awaiting_shipment     — seller notified, pre-ship photos required
shipped               — tracking number entered, in transit
delivered             — carrier marks delivered
inspection_open       — 72-hour window started
inspection_closed     — window closed, funds ready to release
released              — funds released to seller
disputed              — buyer opened dispute, funds frozen
dispute_resolved      — dispute closed (buyer or seller favor)
refunded              — buyer refunded
cancelled             — cancelled before payment
```

The 72-hour inspection window duration is stored in `pricing_engine_settings` as `inspection_window_hours` (default: 72). Adjustable from admin panel. Once set and real transactions are running, change carefully — it's in the seller agreement.

---

### Proxy Bidding — Confirmed Standard

Proxy bidding is the industry standard for professional AV auctions. SoldTiger and AVGear both use it. Buyers set a maximum bid and the system bids automatically on their behalf up to that ceiling.

```
bids table:
  id
  listing_id
  bidder_id
  bid_amount            — the actual bid placed at this moment
  max_bid_encrypted     — the proxy ceiling, encrypted at rest, never visible to anyone
  is_proxy_bid          — true if system placed this bid automatically
  created_at
```

Auto-extend duration stored in `pricing_engine_settings` as `auction_auto_extend_minutes` (default: 2 — changed from 5 on Aug 16, 2026, see Auction Format). Adjustable from admin panel.

---

### Auction UX — Making It Exciting Without an Auctioneer

**Sound:**
- Subtle bid sound effect every time a new bid comes in
- Escalating urgency sounds at 60 seconds, 30 seconds, 10 seconds remaining
- Distinct sound when auto-extend triggers

**Visual urgency:**
- Countdown timer changes color: green at 5+ minutes, yellow at 2 minutes, red at 60 seconds, flashing red at 30 seconds
- Current bid number animates when it changes — flips like an airport departure board
- "EXTENDED" flashes on screen when auto-extend triggers
- Win animation when a lot closes

**Social proof:**
- Watcher count hidden below minimum threshold — stored in `pricing_engine_settings` as `min_watchers_to_display` (default: 10). Below threshold nothing shows. Above threshold shows "X people watching."
- Bid history scrolling in real time — shows all bids including proxy bids as they resolve
- "Y bids in the last 5 minutes" activity indicator
- Running total: "14 of 32 lots closed"

**Outbid notifications:**
- Big red banner on screen: "YOU'VE BEEN OUTBID — $9,200" with one-click rebid button
- Push notification on mobile
- Email within 30 seconds

**Lot closing:**
- "SOLD — $9,200 to Bidder_447" with gavel animation
- Immediately shows next lot closing time
- Usernames only — never real names

---

### Watchlists Table

```
watchlists table:
  id
  buyer_id
  listing_id            — null if watching a model generally
  master_equipment_id   — null if watching a specific listing
  created_at
```

Trading desk dashboard queries watchlists grouped by master_equipment_id to show demand intelligence. No separate demand table needed.

---

### Cliff Events Table — Manual Entry Only

Admin logs cliff events manually. Tom flags them, admin enters them. Nothing auto-populates. Phase 3 may add anomaly detection.

```
cliff_events table:
  id
  manufacturer
  model_affected        — null means entire manufacturer line
  event_type            — 'eol' | 'new_product' | 'fcc_reallocation' | 'firmware_eol' | 'parts_discontinued'
  event_date
  price_impact_pct      — admin estimates % price drop
  source_url
  notes
  created_at
```

---

### Concierge Requests Table

The Find It For Me form. Required fields get them in the door. Optional fields let serious buyers give Tom everything he needs without follow-up emails. The form should feel like talking to a knowledgeable broker, not filling out a government form.

**Required fields on the form:** name, company, email, phone, gear description (big open text area — "Tell us everything"), quantity needed, need by date, budget.

**Project type — select one:**
- Touring / Live events
- Permanent installation
- Broadcast / Studio
- House of worship
- Corporate AV
- Other

**Optional fields:**
- Venue or location
- Event or project name
- Condition preference (any / A / B / C)
- Open to multiple sellers
- Accessories required (cases, cables, software licenses)
- Firmware version required
- Power requirements (120V / 240V / either)
- Rack mounting required
- Preferred manufacturers
- Additional notes (open text)

```
concierge_requests table:
  id
  buyer_id                  — null if no account
  name
  email
  phone
  company
  gear_description          — long text
  quantity_needed
  budget
  need_by_date
  project_type              — 'touring' | 'permanent_install' | 'broadcast' | 'house_of_worship' | 'corporate' | 'other'
  venue_or_location
  project_name
  condition_preference      — 'any' | 'a' | 'b' | 'c'
  open_to_multiple_sellers  — boolean
  accessories_required      — text
  firmware_version          — text
  power_requirements        — '120v' | '240v' | 'either'
  rack_mounting_required    — boolean
  preferred_manufacturers   — text
  additional_notes          — long text
  status                    — 'new' | 'in_progress' | 'fulfilled' | 'closed'
  assigned_to               — sean or tom
  internal_notes            — long text, never visible to buyer
  created_at
  updated_at
```


---

