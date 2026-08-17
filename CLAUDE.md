# AVauction.com — North Star

## The Winning Version

A trusted weekly auction and free listing platform for used professional AV gear that quietly builds the best resale pricing database in the industry.

## The Launch Promise

**For sellers:** "List your used AV gear for free. If you want faster action, move it into Friday's auction."

**For buyers:** "Every Friday, serious used pro AV gear closes in one place."

**For the business:** "Every listing and sale makes our pricing data stronger."

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

## Pricing Intelligence

### Phase 1 — Data Capture (Build Now)
Every completed transaction must record: manufacturer, model, condition_grade, final_price, sale_date, zip_code, listing_type (auction/buy_now). This transaction history is the data asset everything else is built on. Do not skip any of these fields.

### Phase 1 — AI Pricing Suggestion (Build Now)
When a seller enters a manufacturer and model during listing creation, suggest a price range based on:
- Comparable listings currently active on AVauction.com
- Recent sold prices from AVauction.com transaction history
- Asking prices scraped from GearSource, Gearsupply, SoundBroker, and eBay active listings via Browse API (background service). ⚠️ NOT eBay completed listings — those are not accessible.
- Condition grade applied to depreciation curve for that gear category

Example output: "Based on current market data, a Grade B [Manufacturer Model] typically sells between $8,500 and $11,000. Recent comparable sales on AVauction.com averaged $9,200."

Seller sets their own asking price and reserve — the suggestion is a guide, not a requirement.

### Phase 2 — AVauction Price Index (Gauge Only — No Public Data Product)
Over time AVauction.com becomes the authoritative source for AV gear resale values — the KBB of professional AV. Every transaction feeds the PriceEngine. What is shown publicly:
- AVauction Price Index gauge — free, public-facing range shown to all sellers and buyers
- Confidence needle — no data / low / medium / high based on data density
- No single estimated value — range only

What stays dark — internal use only, never published:
- Price history per model over time
- Depreciation curves per category
- EOL impact data
- Transaction records
- Trend lines or regional data

The moat is the data staying dark. Publishing it destroys the information asymmetry that makes the trading desk profitable. No competitor has the pricing intelligence AVauction.com is building. GearSource has been around 22 years and never built it. Do not give it away.

### Market Data Scraping Service (Phase B — pricing scrapers)

⚠️ **STATUS UPDATE JULY 28, 2026.** This section was originally headed "Build First — Week 1" and opened with "start the scraper before anything else is built." **That sequencing is complete and no longer applies.** The backend core is built (13 commits, migrations 0001–0028, 280+ verification checks) and the 7 seeding scrapers have finished. This is now **Phase B**, and it runs alongside frontend work rather than ahead of it. Do not reorder a build session around the old directive.

The original rationale still holds and is why Phase B should not slip: every week the scrapers run adds to the dataset, so by launch the pricing engine has real market data behind it instead of starting from zero. **Phase B writes to `market_prices_staging` with manual promotion — never directly to `market_prices`.** See the Staging-and-Review Workflow.

**Run on Vercel cron jobs — costs pennies per month.**

**eBay API — ⚠️ REVISED JULY 2026. ASKING PRICES ONLY. READ THIS BEFORE BUILDING THE SCRAPER.**

Earlier versions of this document said the Finding API or Browse API would provide completed and sold listings. **That is no longer true and any plan built on it will fail.**

Current reality:
- **Finding API (`findCompletedItems`) is deprecated.** It returns rate-limit errors in Production even on a first call. Do not build against it.
- **Sold price data now sits behind the Marketplace Insights API**, which is a Limited Release product requiring eBay business-level approval. Independent and small-business developers are routinely denied. We have applied / should apply, but must not assume access.
- **Browse API returns ACTIVE listings only** — asking prices, not sold prices. Result sets cap at 10,000 items.

**What we build now:** a Browse API scraper capturing **asking prices**, written to `asking_price` on the staging record with `sold_price` NULL. This is legitimate, supported, and works with the production keyset. It is a lower-weight input to the pricing engine, not a sold-price source. Do not label eBay records as `sold_verified` unless and until Marketplace Insights access is granted.

**⚠️ PREREQUISITE — keyset is disabled until this is done.**
Every eBay production keyset is disabled until the app either subscribes to **Marketplace Account Deletion notifications** or is granted an exemption. **We subscribe — we do not opt out.** The Phase B spec captures `seller_location_city`, `seller_location_state`, and `seller_location_zip` on every price record, which is data tied to identifiable eBay sellers; an exemption claims we hold no such data and would not be accurate.

Build: an HTTPS endpoint on the Vercel deployment that (a) answers eBay's verification challenge with the required hash and (b) returns 200 on incoming deletion notifications and purges the matching seller location fields. Roughly 30 minutes of work. Nothing else eBay-related functions until it exists.

**⚠️ RATE LIMIT — 5,000 calls per day.** This dictates the scraper's architecture:
- **Query by model search, not by catalog iteration.** One search call returns up to 200 matching listings. Iterating all 268,048 master_equipment products at 5,000 calls/day would take 54 days for a single pass — unusable.
- Maintain a prioritized model list. ~10,000 actively-traded models = a full pass in two days, comfortably supporting a weekly refresh.
- Tom identifies the priority tier — the top 100–200 models most commonly traded in professional AV rental houses seed the list; expand from transaction data over time.
- Apply for an **Application Growth Check** to raise the daily limit once there's real usage to point at.
- Filter to master_equipment models only — never broad category pulls, or the data fills with consumer gear.

**Category context.** The catalog is line arrays, LED walls, lighting consoles, video processors. A $200K LED wall does not trade on eBay. eBay was always the long tail — DIs, wireless packs, small-format mixers. Weight it accordingly and do not let it block the session.

⚠️ **CORRECTED JULY 28, 2026.** This paragraph previously named the SoundBroker sold archive ("back to 1997"), Reverb sold data via their API, and auction results as "the sold-price sources that matter" — stated as settled fact. **None of the three is verified.** SoundBroker's archive is behind a $100/yr membership and its contents and depth are entirely unknown; the 1997 figure had no verification behind it and has been removed. Reverb sold access depends on an untested endpoint. Auction results are login-gated at SoldTiger and unconfirmed at josephfinn.com. **There are zero verified sold-price sources today.** See the Data Source Status Table. This is the same failure mode as the original eBay claim — do not restate an unchecked source as an available one.

**Competitor asking prices (nightly)**
- **AVGear — ✅ use `avgear.com/products.json`. Wire this FIRST.** Public Shopify endpoint, no key, no auth, no HTML scraping, whole active store in a few calls at `?limit=250&page=N`. Highest-quality asking source available. See AVGear Data Acquisition — Four Quadrants.
- GearSource listings — manufacturer, model, condition, asking price, date
- Gearsupply listings — same fields
- SoundBroker listings — same fields. ⚠️ Apply the 10–15% broker markup correction; D2B listings exempt.
- UsedAVGear, Clair Used Gear — same fields, scrapers already built

⚠️ The line that previously sat here — "AVGear — check if auction results are published post-event" — conflated two different things. AVGear's *asking* prices come from the Shopify JSON endpoint above. AVGear's *auction* results are a separate question on a separate platform (josephfinn.com) and are tracked in the Data Source Status Table, not here.

**Priority model list for scraping — Tom to finalize**
Start scraping these categories immediately, prioritizing models commonly traded in professional AV rental houses:
- LED panels — ROE, Absen, Unilumin, Leyard, Aoto, INFiLED
- LED processors — Brompton, NovaStar, Colorlight
- Audio consoles — Yamaha, DiGiCo, SSL, Avid, Allen & Heath, Midas
- Amplifiers — d&b, L-Acoustics, Meyer Sound, Crown, Lab.gruppen
- Line arrays — d&b, L-Acoustics, Meyer Sound, Martin Audio, Adamson
- Lighting — MA Lighting, Avolites, ETC, Robe, Martin
- Media servers — Disguise, Green Hippo, Resolume
- Projectors — Barco, Christie, Panasonic

**Data quality rules**
- Only scrape models that exist in the master equipment database — no junk data
- Flag listings where condition is unclear — do not guess
- Store asking price AND sold price separately — never conflate the two
- Record the source URL for every entry — needed for validation

**Storage**
`market_prices` table — full field list:
- `source` — platform name (eBay, Reverb, GearSource, SoldTiger, AVGear, AVLAuction, etc.)
⚠️⚠️ **SCHEMA GROUND TRUTH — VERIFIED AGAINST THE LIVE DATABASE JULY 28, 2026.** The columns that ACTUALLY EXIST on `market_prices` are:

`id` (uuid), `source` (text), **`source_category`** (text), `manufacturer` (text), `model` (text), `master_equipment_id` (uuid), `ebay_condition_label` (text), `inferred_grade` (text), `grade_confidence` (text), `grade_source` (text), `description_raw` (text), `asking_price` (numeric), `sold_price` (numeric), `listing_url` (text), `weight` (numeric), `scraped_at` (timestamptz), `created_at` (timestamptz).

**`source_class` DOES NOT EXIST AS A COLUMN.** It is a specification in the confidence weighting model that was never migrated into the table. `source_category` is what got built.

**Resolution — do this, do not improvise:** add `source_class` in a new migration and keep both. `source_category` stays as the coarse three-value quality tier; `source_class` becomes the six-value column the weight formula keys off. They are not competing taxonomies once both exist — one is grain, the other is granularity. **The table is EMPTY (0 rows, verified), so this migration is free — no backfill, no data risk. Do it before Phase B writes the first row, because doing it after means reprocessing everything.**

⚠️ An earlier July 28 edit to this document declared `source_category` deprecated and told Claude Code not to implement it. **That was wrong and has been reversed.** It was written by reconciling two sections of this document against each other without checking the database. Do not repeat that method — when this document and the schema disagree, the schema wins, and the way to find out is to query it.

- `source_category` — coarse quality tier, three values:
  - `sold_verified` — retained as a *definition*, not a column value. ⚠️ **REVISED JULY 2026. Do not use the old definition.** A record qualifies as sold_verified ONLY if a real transaction price was confirmed. Current status of each candidate source:
  - AVauction own transactions — ✅ verified, the only fully reliable source
  - Reverb sold — ✅✅ **VERIFIED & PULLED July 28, 2026. THE sold-price breakthrough.** Not `/api/price_guides` (that endpoint 403s without elevated approval — don't need it). The working endpoint is **`/api/listings/all?query=MODEL&state=sold`** — returns REAL completed-sale prices WITH a Reverb condition grade per listing. Coverage test: 21/24 priority models, then a 60-model pull returned **658 graded sold rows, 53/60 models**. Heavy iron included: DiGiCo SD12 $49,325 (B), SD12 pair $60,000 (A), grandMA3, Yamaha CL5 (25 sales), Martin Viper, Meyer MICA. Public API + personal token (`public` scope) — NO robots.txt or commercial-reuse wall (unlike the auction sources). `source_class = marketplace_sold`, weight 0.60. Staged to `reverb-sold.json`, NOT yet imported. Reverb condition → our grade: Brand New/Mint/Excellent→A, Very Good/B-Stock→B, Good→C, Fair→D, Poor→Poor(unpriced). ⚠️ Calibration note: A-grade is over-represented (384/658) because Brand New maps to A — consider a separate `is_new_in_box` flag so new dealer stock isn't mistaken for a used-Excellent comp. Misses (d&b V8, L-Acoustics K2, Disguise, Robe Pointe) are genuinely rare gear even a big marketplace rarely moves.
  - SoldTiger auction results — 🔶 LOGIN PENDING for catalog, ❌ BLOCKED for price reuse. Closed catalogs are PUBLIC (lot names, quantities, sold/unsold status) — sell-through and supply signals usable with no account. BUT Tiger monetizes its own results data and, like Finn, this falls under attorney Q#10: viewing prices ≠ license to ingest them into our product. Treat the realized-price side as blocked pending legal review, same as Finn. Signup form broken (eWAY `eCrypt`) — phone (805) 497-4999 if catalog access is wanted.
  - AVGear auction results — ❌ **LEGALLY BLOCKED pending attorney Q#10.** Runs on Joseph Finn Co. Two surfaces: `josephfinn.com` (catalog, readable) and `auctions.josephfinn.com` (bidding/prices). The bidding platform blocks scraping via robots.txt AND its terms forbid commercial reuse of site data (Website Usage §d.iv). Hammer prices are viewable to a registered bidder but NOT ingestible into our product until the attorney rules. Catalog/supply data on the WordPress side is fine to read. 18% buyer's premium confirmed. Aug 13 open, Day 1 closes Aug 19 / Day 2 Aug 20.
  - AVLAuction, West Auctions — ⚠️ LIQUIDATION FORMAT. These are sold prices but not comps. Classified `auction_sold_liquidation`, excluded from the median. See the confidence weighting model.
  - LiveAuctioneers — ⚠️ UNVERIFIED, kept in. Free 29M-record database confirmed, keyword-searchable, no paywall. A Google search naming CL5/d&b/grandMA surfaced no LiveAuctioneers pages, but that's Google ranking, not their internal index — they may carry speakers, mixers, and mics from estate/general-audio sales. Caveat: general consumer-audio comps are NOT pro-touring comps and would skew the gauge if mixed in. Verify inside their own results database before building; if kept, tag records so pro vs consumer audio can be separated.
  - eBay completed listings — ❌ NOT AVAILABLE. Finding API deprecated, Marketplace Insights gated.
  - `asking_dealer` — asking prices from professional AV dealers who inspect and grade gear (GearSource, Gearsupply, SoundBroker, UsedAVGear, Clair Used Gear, AVGear, Solaris Network, CUE Sale, ChurchGear)
  - `asking_marketplace` — asking prices from general marketplaces where individual sellers price their own gear (eBay Browse, Sweetwater Gear Exchange, Guitar Center Used, B&H Photo Used, Audiogon, HifiShark, USAudioMart)
- `source_class` — ⚠️ **SPEC'D BUT NOT YET MIGRATED.** Six-value enum that the weight formula keys off. See the confidence weighting model for values and the authoritative source-to-class mapping. Add via migration before Phase B writes any rows.
- `manufacturer` — matched to master_equipment table
- `model` — matched to master_equipment table
- `master_equipment_id` — foreign key to master_equipment record
- `ebay_condition_label` — raw eBay condition string if source is eBay
- `inferred_grade` — A/B/C/D (Excellent/Very Good/Good/Fair) inferred from condition description; Poor/For Parts stored as a distinct unpriced value, never a letter
- `grade_confidence` — high/medium/low
- `grade_source` — ebay_label/description_parse/photo_analysis
- `asking_price` — listed asking price in USD
- `sold_price` — confirmed transaction price in USD (null for asking_price sources)
- `listing_url` — exact page scraped, for validation and audit trail
- `scraped_at` — timestamp of when this record was pulled
- `weight` — calculated confidence weight. ⚠️ Computed as `base_weight(source_class) × confidence_multiplier(grade_confidence)`. See the revised confidence weighting model — do not use flat per-source weights.

The `source_category`, `source_class`, and `weight` fields mean the pricing engine never needs to look up the source name to know how much to trust a data point. Every record carries its own quality signal. (`weight` already exists as a numeric column; it is unpopulated because the table is empty.)

This feeds the pricing suggestion engine from day one and eventually becomes the market index product in phase 3.

### Scraper User Interface — By Phase

**Phase 1 — Background only, minimal UI**
The scraper runs silently. No public-facing interface. Data surfaces in two places only:

1. AVauction Price Index gauge in the seller app — when a seller enters a manufacturer and model during listing creation, the gauge pulls from the market_prices table to generate the suggested price range and needle position. This is the only user-facing output of the scraper in phase 1.

2. Admin scraper health panel — a simple internal page in the admin dashboard showing:
   - Last scraper run time per source (eBay, GearSource, Gearsupply, SoundBroker)
   - Number of records pulled in last 7 days
   - Any errors or failed runs
   - Top 20 most-scraped models with current average asking and sold prices
   - Total records in market_prices table
   This is for Sean only. Takes a few hours to build. Enough to know the scraper is working correctly.

**Phase 2 — Internal intelligence page for Tom**
A simple internal page — not public, login required — that Tom uses when writing the weekly newsletter. Shows:
   - Price trend per model over last 90 days — simple line showing direction
   - Models with biggest price movement up or down in the last 30 days
   - Models with high listing volume — lots of supply hitting the market
   - Models with zero or low supply — scarcity signals
   - Average days on market per model where eBay data allows inference
   Tom uses this to write market commentary without having to manually research. The data tells him what's moving, what's dropping, and what's scarce. His industry knowledge turns raw signals into readable intelligence.

**Phase 3 — Internal trading intelligence only**
The data stays dark. No public subscription product is ever built. The full transaction history, trend lines, days on market, regional variations, and supply/demand signals are used exclusively for:
   - Tom's internal newsletter intelligence page — private, editorial use only
   - Sean and Tom's proprietary trading desk — buying undervalued gear before the market notices
   
   Publishing this data would destroy the information asymmetry that makes the trading desk profitable and the platform defensible. The moat is the data staying dark.



### Grade Inference for Scraped Data
Scraped listings from eBay and competitors don't use your A–D grading system (A/B/C/D = Excellent/Very Good/Good/Fair; see GRADING SYSTEM for the full five-tier scale including the unpriced Poor tier). The scraper infers grades from available signals and stores them with a confidence rating. Your own platform's transaction data — graded via the QC checklist — is the gold standard and gets weighted more heavily as it grows.

**eBay condition mapping** — ⚠️ aligned to the five-tier scale (see GRADING SYSTEM). Grade names map 1:1 to eBay's own labels, which is convenient because eBay uses the same vocabulary:
- New / Open Box → Grade A / Excellent (high confidence)
- Excellent → Grade A / Excellent (medium — parse description to confirm)
- Very Good → Grade B / Very Good (medium)
- Good → Grade C / Good (medium)
- Acceptable → Grade D / Fair (medium)
- For Parts or Not Working → **Poor / For Parts** (high confidence) — ⚠️ NOT a lettered grade; this is the unpriced tier, excluded from the gauge and the median.

**Description parsing via Claude API**
Run every scraped listing description through Claude to extract condition signals:
- "powers on and functions perfectly" → A / Excellent signal
- "minor cosmetic wear" → B / Very Good signal
- "flight cases included" → A / Excellent signal
- "visible wear but works" → C / Good signal
- "known issues" or "needs repair" → D / Fair signal (disclose the issue)
- "for parts" or "not working" → **Poor / For Parts** — unpriced, off the gauge
- "tested and working" → B / Very Good signal

Claude returns a suggested grade and a confidence score (high/medium/low) based on how clearly the description maps to a grade.

**Photo analysis via Claude Vision (optional — phase 2)**
For high-value listings above a threshold price, run listing photos through Claude Vision to identify:
- Visible physical damage — lowers grade
- Missing components — lowers grade
- Flight cases visible — raises grade
- Powered on and producing output — Grade A/B signal

Store photo analysis results separately — do not override description-based grade, add as additional signal.

**Confidence weighting in the pricing engine — REVISED JULY 2026**

The previous version of this model was built around eBay sold prices, which occupied three of its five tiers. eBay sold data is not accessible (see the eBay API section), so that model is void. It also treated every sold price as equivalent, which is wrong for a second and independent reason — see sale context below.

Weight is now the product of two independent dimensions:

**`weight = base_weight(source_class) × confidence_multiplier(grade_confidence)`**

⚠️ **`source_class` is not yet a column on `market_prices` — see the schema ground truth note in the market_prices field list. Migrate it before Phase B runs, or this formula has nothing to read.**

**Dimension 1 — source_class (base weight)**

| source_class | Examples | Base weight |
|---|---|---|
| `own_transaction` | AVauction closed auction or buy-it-now, QC checklist graded | **1.00** |
| `marketplace_sold` | Reverb sold (if API access confirmed), any verified sale in a retail/marketplace context | **0.60** |
| `auction_sold_retail` | Curated auctions where lots are inspected, graded, and marketed — AVGear, SoldTiger | **0.50** |
| `auction_sold_liquidation` | Distressed/liquidation formats — AVLAuction (€10 opens), West Auctions (as-is, untested, local pickup only) | **0.25** |
| `dealer_asking` | GearSource, Gearsupply, SoundBroker, UsedAVGear, Clair, **AVGear (`products.json`)**, Solaris, CUE Sale, ChurchGear | **0.15** |
| `private_asking` | eBay Browse, HifiShark, USAudioMart, Audiogon, Sweetwater, Guitar Center, B&H | **0.10** |

**Dimension 2 — confidence_multiplier**
- high → 1.0
- medium → 0.7
- low → 0.4

**⚠️ Why liquidation auctions are separated out — do not merge these back together.**

An earlier version of this document claimed auction sold results are "nearly as strong as our own data." That is wrong. A €10-opening-bid auction, or an as-is untested lot requiring local pickup, produces a *distressed* price. It is a real transaction, but it measures the floor of the market, not its value.

Merging those into a weighted median alongside inspected, graded, escrowed AVauction transactions drags the gauge down, and because both would carry a "sold" label the distortion would be invisible. Liquidation results are a **floor indicator**, not a comp.

**Until own-transaction volume exists to calibrate against, `auction_sold_liquidation` records are stored but EXCLUDED from the median calculation.** They may be surfaced separately as a floor reference. Once there are enough matched pairs to measure the liquidation discount empirically by category, they can be folded in with that discount applied. Do not guess the discount factor — measure it.

**⚠️ SOURCE MARKUP BIAS — a displayed price is not always the seller's price.**

Some sources display a price that already includes their own margin. Scraping the displayed number and treating it as an asking price silently inflates the median.

**SoundBroker — CONFIRMED, from their published Seller's Agreement:**
- They add a margin of **10%–15% on top of the seller's asking price** on all items
- On items **under $1,000** they add a **flat $150–$200** instead of a percentage — proportionally far worse (a $600 item can carry a 25–33% markup)
- The seller states what they want; SoundBroker adds their fee on top and displays the combined figure
- **Exception:** Direct-to-Buyer / Direct Club listings (highlighted yellow on their site) bypass the SoundBroker fee entirely. Those are true seller prices. **Detect and flag D2B listings separately — do not apply the markup correction to them.**

**Correction to apply to SoundBroker non-D2B records:**
- Item ≥ $1,000: `adjusted_price = raw_price / 1.125` (midpoint of the 10–15% range)
- Item < $1,000: `adjusted_price = raw_price - 175` (midpoint of the $150–200 range)
- Set `markup_correction_applied` to describe which rule fired
- Floor the result at a sane minimum; never allow a negative or absurd adjusted price

**This is an estimate, not a measurement.** The exact margin varies by deal and is negotiable on offers. Revisit once there are matched pairs — the same model listed on both SoundBroker and a non-marked-up source — and measure the real spread rather than trusting the midpoint.

**Check every other source for the same pattern before building its scraper.** The question to answer for each: *is the displayed number what the seller wants, or what the seller wants plus the platform's cut?* Broker and consignment models mark up. Classified and listing-fee models generally do not. Do not assume — find the fee structure in their seller terms, the way this one was found.

Sources still unchecked for markup bias: GearSource, Gearsupply, UsedAVGear, Clair Used Gear, Solaris, CUE Sale, 10K Used.

**⚠️ Display governance — the gauge must not project confidence it does not have.**

The engine will happily return a weighted median, an IQR, and a needle position from nothing but asking prices. That output looks identical to a real market value and is actually a median of what sellers hope to get — which in this industry skews high and stale, since gear sits listed for months at aspirational numbers.

Store these in `pricing_engine_settings`:
- `gauge_min_sold_count` — minimum count of records with source_class `own_transaction`, `marketplace_sold`, or `auction_sold_retail` required before the gauge displays a needle at all. Below this, show a range with no needle.
- `gauge_min_source_diversity` — minimum number of distinct sources required before displaying a needle.
- `gauge_grade_floor` — minimum condition grade allowed into the median that positions the needle. **Set to `good` (i.e. grade C).** Only A/B/C (Excellent/Very Good/Good) feed the median; grade D (Fair) is stored and displayed but weighted low and kept out of the needle calculation; Poor/For Parts never enters. Mirrors Reverb's Price Guide (averages good-or-better, excludes fair/poor/non-functioning). See GRADING SYSTEM for the full scale. ⚠️ This raises the data bar for the gauge to display — with zero verified sold data today, expect the no-needle state at launch.

Label the gauge honestly with what it is built from. "Based on 12 verified sales" and "based on 47 current asking prices" are different claims and must read differently to the user. Sellers will trust a wide honest range and forgive it. They will not forgive a confident wrong number — and the entire differentiator against SoundBroker is that they refuse to guide pricing and we do.

**As own-transaction volume grows the model self-corrects** — weight 1.00 records accumulate and progressively dominate the scraped inputs. This is the intended trajectory. The 0% buy-it-now commission is not only a founding-seller benefit; it is how the platform acquires verified sold data that no scraper can supply.

**Additional columns required on `market_prices` and `market_prices_staging`:**
- `source_class` — enum matching the table above
- `sale_context` — `retail` | `liquidation` | `asking`
- `excluded_from_median` — boolean, default false; true for liquidation records pending calibration
- `raw_price` — the price exactly as displayed on the source, before any correction
- `adjusted_price` — `raw_price` after the source markup correction below; this is what the pricing engine reads
- `markup_correction_applied` — text describing what was subtracted, or NULL if none

**Never overwrite `raw_price`.** Store both. If a markup assumption turns out wrong, the correction can be recomputed without re-scraping.

**Storage fields added to market_prices table**
- ebay_condition_label (raw eBay condition string)
- inferred_grade (A/B/C/D = Excellent/Very Good/Good/Fair; Poor/For Parts is a separate unpriced state)
- grade_confidence (high/medium/low)
- grade_source (ebay_label/description_parse/photo_analysis)
- description_raw (full listing description for re-parsing if needed)
- weight (calculated confidence weight for pricing engine)

**What scraped grades cannot determine**
- Whether gear actually powers on and produces full output
- Whether all original components are present
- Exact hours of use
- Flight case inclusion (unless mentioned in description or visible in photos)
- Internal technical issues not visible externally

These gaps are why AVauction.com's own QC checklist data is so valuable — it captures what scraped data cannot. Over time this makes the platform's own transaction dataset more accurate and more authoritative than any scraped source.


---

---

---

## AVGear Data Acquisition — Four Quadrants (Shopify JSON confirmed live July 2026)

AVGear runs both transaction formats — fixed-price Shopify store + bimonthly auctions on josephfinn.com. Their categories are our exact catalog (first product returned by their API was a Meyer Sound ULTRA-X40). Four data quadrants, four different mechanisms:

### Quadrant 1 — Buy-it-now ACTIVE ✅ SOLVED AND EMPIRICALLY PULLED (July 28, 2026)

**FULL PULL COMPLETED. 23,052 products retrieved across 93 pages. These are measured facts, not estimates.**

`https://www.avgear.com/products.json` is PUBLIC and returns clean structured JSON — no key, no auth.
- Paginate with `?limit=250&page=N` (250 is the Shopify max). Ends naturally on a short page — page 93 returned 52.
- Each record: `id`, `title`, `handle`, `vendor`, `product_type`, `tags`, `variants[]` (price, sku, available), `images[]`.

**⚠️ THE FEED IS A POOR PROXY FOR THE SITE. Field-by-field reality:**

| Field | Expectation | Actual |
|---|---|---|
| `vendor` | manufacturer | ❌ **USELESS** — 23,051 of 23,052 read "AVGear.com". Extract brand from title instead, matched against a known-manufacturer list; tags are a weak fallback (~67% title-match rate achieved). |
| `product_type` | category | ❌ **USELESS** — 3% populated, and the values are model numbers, not categories. |
| `tags` | includes F/C grading | ❌ **FALSE — grading is NOT in the feed.** Corrected July 28. Earlier draft claimed F/C grades appear in tags/product_type. They do not. Zero hits on "Condition:", "Grade:", or any F/C value across all 5,504 used items. |
| `body_html` | condition notes | ❌ Manufacturer brochure copy only. Median 401 chars. Same marketing paragraph on a mint unit and a broken one. |
| `variants[].price` | asking price | ✅ 81.6% populated. Unpriced = "call for price". |
| `tags` (`category-*`) | — | ✅ **UNEXPECTED WIN — 291 distinct category tags.** This is AVGear's full product taxonomy. See parent/child below. |

**⚠️ THE PARENT/CHILD SPLIT — the single most important structural finding. Four of four predictions held.**

Every product carries either a `parent` tag or a `child` tag. Exactly ONE of 23,052 has both. They are two different datasets fused into one feed:

| | PARENT (10,828) | CHILD (12,054) |
|---|---|---|
| What it is | Catalog entry — the product concept | Physical unit in stock |
| Condition tag | 94.2% have none | 90% have one |
| `category-*` taxonomy | **99.0%** | 0.3% |
| Unpriced | 38.5% | 0.3% |
| Destination | → `master_equipment` | → `market_prices` |

**Do not import parents as prices. Do not import children as catalog.** Parent price is AVGear's own new/dropship price, NOT MSRP — proven by a Meyer Sound ULTRA-X40 pair where the parent listed $4,699.99 and the used child listed **$6,799.95**. A used unit above the catalog price is a scarcity signal, not a data error. Never label parent price as MSRP.

**Yield after splitting, deduplicating, and quarantining (measured):**
- **10,827** catalog records → `master_equipment`, carrying 291 categories
- **2,029** deduplicated used asking prices across 365 manufacturers → `market_prices`
- **5,194** deduplicated new-price anchors (depreciation denominators)
- **1,205** quarantined (630 no brand identified, 361 condition unknown, 171 neither tag, 40 no price, 2 price sentinels, 1 both tags)

**⚠️ DEDUPLICATION IS MANDATORY — raw 5,201 used rows collapse to 2,029 (61% redundant).** 720 duplicate groups. Worst: 62 identical DeckLink Minis at $39.99, 58 Panasonic ET-DLE060 at $895, 43 ET-D3QW200 at $6,200, 38 HOLOPLOT MD96 at $12,499. Store as one observation with `unit_count`, never as N observations.

**⚠️ CONSIGNMENT LOT NUMBERS — the duplicates are one seller, not market depth.** SKUs and handle suffixes carry a lot code: Behringer `C1978-8`, the Panasonic PT-RQ50Ks all `c2132-507 / -512 / -529`, the Disguise VX4s all `c2132-*`. **`C####` = a single consignment lot.** Seven identical VX4s are ONE supply event from ONE seller, not seven independent market observations. Extract the lot code from the handle and treat same-lot items as correlated, not independent, when computing the median.

**⚠️ PRICE SENTINEL — $100,000 is a placeholder meaning "call us."** 34 items, all large lots: `(347) Gloshine LED Package`, `(12) Panasonic lenses`, `(4) Shure transmitters`. Filter it. Note the $229,000 Angenieux Optimo Prime 12-lens set is a REAL price — do not filter by magnitude, filter the exact sentinel value.

**Price distribution (measured):** used median $199, new median $494. Used ≥$1,000: 18.1%. Used ≥$5,000: 149 items. Top used manufacturers: panasonic (223), barco (125), christie (96), shure (80), crestron (68), aja (63), sanyo (55), lectrosonics (54). **This is real pro AV, not accessories** — grandMA3 Full Size $78,000, grandMA3 Light $66,000, DiGiCo SD5 $44,995, SD12 $41,900, Disguise VX4 media servers, Panasonic PT-RQ50K projectors.

**Their SKUs are clean product keys — use for fuzzy match.**
- `source_class = dealer_asking`, `sale_context = asking`. These are AVGear's own asking prices (dealer inventory, not marked-up consignment like SoundBroker) — no markup correction needed, but verify.
- **Rate-limit politely.** Public and unauthenticated, but hammering still reads as scraping. With `limit=250` the whole catalog is a few calls anyway — no reason to go fast.
- ⚠️ Shopify stores CAN disable this endpoint; AVGear currently has it ON. If it 404s in future, fall back to HTML collection pages.

### Quadrant 2 — Buy-it-now SOLD 🔶 inferred by disappearance polling

Shopify does not expose other merchants' orders. No direct sold data. Inference:
- Poll `/products.json` on a schedule (daily). Diff against last snapshot.
- A product that was `available: true` and is now gone = left the market (sold, or pulled).
- You already captured its asking price on the prior poll → record "item X, last ask $Y, delisted date Z."
- This is a sold-SIGNAL, not a sold-PRICE. `source_class = private_asking`-tier confidence at best, flag `inferred_delisting = true`. Do NOT treat as verified sold. Useful for velocity / sell-through, not for the median.

### Quadrant 3 — Auction ACTIVE ⚠️ TWO SURFACES, verified July 28, 2026

AVGear auctions run through Joseph Finn Co. across two surfaces:
- **`josephfinn.com`** (WordPress catalog) — `index,follow`, public, scrapable. Auction *catalogs* live here: lot names, manufacturers, models, quantities, open/close dates. Archive by industry at `/category/audio-video/` runs 24+ pages deep, bimonthly AVGear auctions plus WNET, cable stations, Broadcast Video Auctions, etc. This is genuine **supply/catalog intelligence** and it is fair to read.
- **`auctions.josephfinn.com`** (the bidding platform, upgraded Jan 2024) — where bids and prices live. During a live sale the lot list shows `Current High Bidder $X`, `Bids: N`, `Watching: N` per lot. **616 lots on the Aug Day 1 sale alone.** One-time registration required.

**Confirmed auction dates (corrected — earlier draft said Aug 13–20):** both days open **Thursday Aug 13, 9:00 AM EST**. Day 1 first lot closes **Aug 19**; Day 2 first lot closes **Aug 20**. 20-second staggered lot closings, 5-minute extended-bidding rule. Preview Aug 10–17.

**⚠️ Confirmed 18% buyer's premium** on Finn/AVGear auctions (their terms). Any hammer price observed must be × 1.18 for true buyer cost. This is also the exact premium SoldTiger charges — our primary marketing foil (see Competitive Positioning).

### Quadrant 4 — Auction SOLD ❌ CONFIRMED DEAD END (verified on a closed lot, July 28, 2026)

⚠️ **Settled empirically — do not reopen.** A completed June-auction lot was opened directly on `auctions.josephfinn.com` (Lot 5, "(4) Elation ELED Fresnel 150's," marked *Completed / Bidding complete*). It shows starting bid, increment, and watcher count — **and NO winning/hammer price.** Finn strips the realized price the moment a lot closes. The sold price is not published post-close, not even to a registered account.

So this dead-ends two ways at once:
1. **Not published** — there is no historical hammer-price archive on the site to obtain, by any means. The data literally isn't there after close.
2. **Terms forbid reuse anyway** — even the *live* high bid is covered by Website Usage §d.iv (no commercial reuse) and the bidding subdomain's robots.txt blocks automation. This is attorney question #10, but the practical answer already makes it academic on the archive side.

**Same posture as SoldTiger.** Neither publishes post-close realized prices in an obtainable, usable form. **The auction-sold tier is closed. Do not build an ingest for it.** The only residual value is eyeballing the live high bid on a few priority models in the final seconds before they close during Aug 13–20 — a handful of hand-noted points for market feel, not a dataset, and per the terms it stays "market awareness," not product input. (Own-transaction sold data — the weight-1.00 gold standard — is unaffected and remains the real long-term answer to the sold-price problem.)

### The calibration play this unlocks

AVGear is the ONLY source selling the same categories, same grading, same inventory through BOTH a fixed-price channel (Q1, asking) and an auction channel (Q4, realized). If Q4 yields prices, the Q1-ask ÷ Q4-clear ratio per category is the exact auction-to-asking calibration factor the pricing engine needs while own-transaction volume builds. No other source gives both halves from one seller.

---

## DATA SOURCE STATUS TABLE — verified July 28, 2026

**Read this before building any scraper.** Status reflects what was actually checked, not what was assumed. Anything marked UNVERIFIED has not been tested — do not plan around it.

### Legend
- ✅ **VERIFIED** — confirmed working or confirmed available
- ❌ **FAILED** — confirmed unavailable, do not build
- ⚠️ **UNVERIFIED** — not tested; assumption only
- 🔶 **CONDITIONAL** — available but with a constraint that changes how it can be used

### Sold price sources

| Source | Sold data | Status | Detail |
|---|---|---|---|
| **AVauction own transactions** | ✅ | Zero today | The only fully trustworthy source. Grows from launch. Weight 1.00. |
| **eBay (official API)** | ❌ | FAILED | Finding API `findCompletedItems` deprecated, rate-limit errors in Production. Marketplace Insights is Limited Release, gated to approved partners, routine denials. |
| **SoundBroker `/sold/`** | 🔶 | PAYWALLED — $100/yr, terms read, no use restrictions found | "Sold price information" is an EXPLICIT listed benefit of the VIP-Loyalty Club ($100/12mo, $200/24mo, $300/48mo). Seller's Agreement and membership page both read in full: NO anti-scraping clause, NO automated-access clause, NO commercial-use restriction — only a liability disclaimer. Caveats: checkout/registration may present additional terms not yet seen; account termination possible regardless of terms; competitor-relations risk in a small industry. **Next step: buy the $100 membership, look at the archive manually — depth, model searchability, touring-gear coverage — before deciding anything about extraction.** Archive contents entirely unknown. |
| **LiveAuctioneers** | ⚠️ | UNVERIFIED, kept in | Free 29M-record database, keyword-searchable, no paywall. Google search for CL5/d&b/grandMA surfaced nothing, but that's ranking, not their index — likely carries speakers/mixers/mics from estate & general-audio sales. ⚠️ Consumer-audio comps ≠ pro-touring comps; separate them or they skew the gauge. Search inside their DB to confirm coverage before building. |
| **SoldTiger (Tiger Group)** | 🔶 | LOGIN PENDING — partial data already public | **Best catalog match of any source.** $20M at-cost AV sales — Barco, Claypaky, Christie, Martin Audio, Sennheiser, Yamaha, ETC; projectors, truss, video wall, LED, consoles, rigging. 96–99% sell-through. Runs on Bidpath. **What is already visible logged out: closed catalogs are public — lot names, quantities, and sold/unsold status. Only the realized price is gated ("Winning Bid: N/A").** That means sell-through and supply data are obtainable today without an account; only the price half is blocked. **Registration blocker: the signup form is broken — the eWAY `eCrypt` payment-encryption script fails to load (likely ad blocker / privacy extension), so nothing ever submits. Fix: clean browser with extensions disabled, or register by phone — (805) 497-4999, business hours. Expect a ~$300 card hold for bidder registration.** **Note: Tiger markets its own proprietary auction-results data as a differentiator — unlikely to publish lot prices freely even to registered bidders.** |
| **AVGear auctions** | 🔶 | josephfinn.com — CORRECTED JULY 2026, independent source | Bimonthly pro-AV-only auctions (Feb/Apr/Jun/Aug/Oct/Dec — six per year, NOT quarterly; earlier wording was wrong). **Earlier claim that these run through SoldTiger was WRONG — they run on josephfinn.com (Joseph Finn Co., MA auctioneer).** AVGear and SoldTiger are genuinely two independent sold-price sources on two different platforms. Register at josephfinn.com via the AVGear auctions page. **Next live auction: opens Aug 13, 2026, closes Aug 19–20 — one week before Korea departure. Featured lots are exactly our catalog: (4) grandMA2 full-size + (2) Ultralight, Avid S6L-24D, Soundcraft Vi1000 NIB, (28) Martin Mac Viper Performance, NEXO PS15 rigs, Panasonic laser projectors, 200+ Chauvet lots.** Test: check whether josephfinn.com shows realized prices on PAST AVGear auctions (quarterly back to Dec 2024). Live auction = free real-time price observation regardless. |
| **AVLAuction** | 🔶 | Liquidation format | Real pro AV — moving heads, line arrays, LED panels, projectors, trussing, European rental companies. **All items start at €10.** Euro-denominated, European buyer pool, small/new operation. Produces floor prices, not comps. `auction_sold_liquidation`, excluded from median. |
| **West Auctions** | 🔶 | Liquidation format | Real AV category. As-is, untested unless noted, local pickup only, no shipping, individual lots mixed with bulk pallets. Systematic discount. `auction_sold_liquidation`, excluded from median. |
| **Reverb API** | ✅ **VERIFIED — 658 graded sold rows pulled July 28** | Working endpoint is `/api/listings/all?state=sold` (NOT `price_guides`, which 403s and isn't needed). Real realized prices + condition grade per listing, 53/60 priority models covered including heavy iron. Clean source: public API + personal token (`public` scope), no robots.txt or commercial-reuse wall. `source_class = marketplace_sold`, weight 0.60. Staged to `reverb-sold.json`; import pending the source_class/grade migration. Earlier worry that category fit was too narrow (guitars/pedals) was WRONG — consoles, line arrays, wireless, lighting, projectors all returned sold data. |
| **SoldComps (3rd party)** | 🔶 | Available, ToS/provenance risk | sold-comps.com. Up to 240 sold listings per request, 8 eBay sites, 90-day history cap. Per-request pricing. Obtains data by scraping eBay's sold search. |
| **Apify actors (3rd party)** | 🔶 | Available, ToS/provenance risk | ~$0.02/record + $0.10/run. Outlier fencing, lot normalization, A–D confidence grade. Vendor explicitly assigns ToS compliance responsibility to the user. |

### Active / asking price sources

⚠️⚠️ **READ THIS BEFORE TRUSTING THE ✅ MARKS BELOW. VERIFIED JULY 28, 2026 AGAINST THE LIVE DATABASE.**

**`market_prices` contains 0 rows. Zero asking prices, zero sold prices, zero distinct models, zero sources. Nothing has ever been written to it.**

"✅ VERIFIED" in this table means **SEEDING-PROVEN ONLY** — the scraper ran, the site was scrapeable, and manufacturer/model data landed in `master_equipment`. It does **NOT** mean the scraper writes prices. These are two different states and collapsing them created a false impression that a pricing dataset already existed:

| State | Meaning | Current count |
|---|---|---|
| **SEEDING-PROVEN** | Scraper runs, site scrapeable, catalog data captured | 7 of 7 scrapers ✅ |
| **PRICE-WRITING** | Scraper writes priced rows into `market_prices` on a schedule | **0 of 7** ❌ |

**The only finished data asset is the catalog (268,048 products). There is no price data of any kind.** Phase B is the work of taking seeding-proven scrapers and extending them to capture and store prices — larger than "run the scrapers we already have."

| Source | Scraper status (seeding only) | Detail |
|---|---|---|
| **GearSource** | ✅ VERIFIED | Seeding scraper built and run successfully. Site is scrapeable. Asking-price capture is a Phase B extension of existing code. |
| **Gearsupply** | ✅ VERIFIED | Same. ⚠️ **No longer the sole "most serious threat" — see AVGear.** |
| **SoundBroker (live listings)** | ✅ VERIFIED | Live listings scrapeable — **distinct from the paywalled `/sold/` archive.** ~54,700 listings. ⚠️ **Displayed prices include a 10–15% broker markup ($150–200 flat under $1,000). Correction required — see source markup bias.** D2B listings are exempt. |
| **AVGear buy-it-now** | ✅ **PULLED IN FULL July 28 — 23,052 products → 2,029 used comps + 5,194 new anchors + 10,827 catalog records w/ 291 categories.** ⚠️ **Also now assessed as a top-tier competitive threat alongside Gearsupply:** 30,000 sq ft warehouse, 40+ yrs combined experience, multi-level QA, two-axis F1–F5/C1–C5 grading published per item, 14-day guarantee, resale + consignment + auctions under one brand. | `avgear.com/products.json` — clean structured data, no key, no auth, no HTML scraping. Whole active store in a few calls at `?limit=250&page=N`. Seeding scraper also built and run. `source_class = dealer_asking`. **Wire this first — see the AVGear Four Quadrants section.** |
| **UsedAVGear** | ✅ VERIFIED | Seeding scraper built and run. |
| **Clair Used Gear** | ✅ VERIFIED | Seeding scraper built and run. **Note: Clair also operates an eBay store — relevant to the eBay density question.** |
| **eBay Browse API** | 🔶 BLOCKED | Keyset created but **DISABLED** pending Marketplace Account Deletion notification endpoint. 5,000 calls/day once enabled. Active listings only, 10,000-item result cap. |
| **Solaris Network** | ⚠️ UNVERIFIED | Never built, never tested. |
| **CUE Sale** | ⚠️ UNVERIFIED | Never built, never tested. |
| **Audiogon** | ⚠️ UNVERIFIED | Never built, never tested. |
| **Sweetwater Gear Exchange** | ⚠️ UNVERIFIED | Never built. Live Sound & Lighting category only. |
| **Guitar Center Used** | ⚠️ UNVERIFIED | Never built. Pro Audio category only, low weight. |
| **B&H Photo Used** | ⚠️ UNVERIFIED | Never built. |
| **ChurchGear** | ⚠️ UNVERIFIED | Never built. |
| **HifiShark** | ⚠️ UNVERIFIED | Never built. Meta-search across 600+ audio marketplaces. Asking prices only. High leverage if it works. |
| **USAudioMart** | ⚠️ UNVERIFIED | Never built. |
| **BidSpotter** | ⚠️ UNVERIFIED | Never built. Auction aggregator. |
| **Jones Swenson** | ⚠️ UNVERIFIED | Never built. Texas auctioneer, has run Freeman AV liquidations. Irregular cadence. |

### Catalog / reference (not pricing)

| Source | Status | Detail |
|---|---|---|
| **AV-iQ** | ✅ COMPLETE | 239,661 records, 99.1% success, 2,141 non-critical failures, clean termination after retry pass. Not a pricing source — MSRP and specs only. No further passes needed. |
| **All 7 seeding scrapers combined** | ✅ COMPLETE | 268,048 unique products in `master_equipment`. |

### Pending actions — every open question with its price attached

Nearly every unknown left in this table has a cheap, specific test. The whole sold-data picture resolves for roughly $100 (plus a refundable bidder hold) and an afternoon.

| Action | Cost | Resolves |
|---|---|---|
| Pull `avgear.com/products.json` | Free, now | Active buy-it-now — done once wired |
| Tiger phone registration — (805) 497-4999 | Free + ~$300 card hold | SoldTiger "Winning Bid: N/A" question |
| Joseph Finn registration + past-auction check | Free | AVGear auction archive back to Dec 2024 |
| SoundBroker VIP-Loyalty membership | $100 | Sold archive contents — depth, searchability, coverage |
| ~~Reverb token → price_guides~~ ✅ DONE July 28 | — | RESOLVED: `/api/listings/all?state=sold` works, 658 graded rows staged. Next step is IMPORT, not test — see What Remains. |
| LiveAuctioneers search "Yamaha CL5" inside their DB | Free, 2 min | Kill or keep |
| eBay manual density check, ~20 models | Free, 15 min | Whether SoldComps/Apify are worth pursuing |
| Register at auctions.josephfinn.com, watch Aug 13–20 for OWN market awareness | Free | See real clearing prices — ⚠️ VIEWING only; ingesting into the product is blocked pending attorney Q#10 |

**Sequencing note:** the AVGear auction (opens Aug 13; Day 1 closes Aug 19, Day 2 Aug 20) is the only item on this list with an expiry date, and it lands one week before Korea departure. ⚠️ But its value is now capped by attorney Q#10 — you can register and watch clearing prices for your own market feel, you CANNOT capture them into the pricing engine until legal clears it. So the deadline pressure is softer than earlier drafts implied: it's a market-awareness window, not a data-capture window.

### Summary — what this actually leaves

- **Verified sold sources today: none.** Own transactions are the only trustworthy path and they start at zero.
- **One confirmed dead end:** eBay official API. SoundBroker's sold archive moved from dead end to open question — it's an advertised $100/yr membership benefit with no use restrictions found in their published terms. Contents unknown until someone looks.
- **Two liquidation sources** that are real but measure the floor, not market value.
- **SoldTiger is half-open, not closed.** Closed catalogs are public — lot names, quantities, sold/unsold status. Only realized price is gated. Sell-through and supply signals are obtainable today with no account at all.
- **AVGear auctions are an independent sixth sold source**, on josephfinn.com, not SoldTiger. The two do not collapse into one.
- **Three tests still outstanding** before anything else: Reverb `price_guides`, SoldTiger post-close price visibility, LiveAuctioneers coverage (search their own DB, not Google). Combined test time: under an hour. See the pending actions table.
- **Asking-price coverage is genuinely strong** — six scrapers already built and proven against their targets, plus AVGear's public JSON endpoint, which is cleaner than any of them.

**Consequence for the build:** the Phase 1 AI pricing suggestion is supportable on asking-price data with an honest confidence indicator. The Phase 2 Price Index gauge is not supportable yet and must not ship projecting confidence it does not have. See the confidence weighting model and display governance rules.

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

## Upsell Funnel and Revenue Triggers

### The Core Funnel
Free buy-it-now is the entry point. Auction and concierge are the upgrades. The platform uses data and behavior patterns to identify the right moment to suggest each upgrade. Upsells feel helpful because they solve a real problem the seller or buyer already has.

**Funnel stages:**
1. Seller lists gear free on buy-it-now → database grows, seller trusts platform
2. Platform monitors listing performance — views, watchlists, days live, price vs market
3. Platform identifies upgrade opportunities based on data signals
4. Targeted upsell delivered via email or in-app notification
5. One-tap upgrade — gear moves to auction or concierge without relisting

---

### Seller Upsells

**Auction upsell — triggered by listing performance data**
When a buy-it-now listing has been live for a defined period with views but no sale, the platform proactively suggests the auction format.

Trigger signals:
- Listing has X views but no sale after Y days
- Price is above market average for condition — gear may be overpriced for buy-it-now but right for auction
- Similar gear sold recently at auction — platform has comparable data
- Seller has multiple units of same model — good auction lot candidate

Message to seller: "Your [Manufacturer Model] has had 47 views in 30 days but no sale. We recently sold a comparable unit at auction for $X. Want us to feature it in next Friday's auction? 10% commission on final sale price — gear typically closes in one week."

Seller taps yes. Listing moves to auction queue. Admin reviews and schedules. Done.

**Bulk concierge upsell — triggered by large inventory**
When a seller has significant inventory of related gear sitting in buy-it-now, platform identifies potential bulk concierge match opportunities.

Trigger signals:
- Seller has 20+ units of same model
- Seller has complementary gear that could form a complete system
- Platform has a buyer project in the concierge queue that matches seller inventory

Message to seller: "You have 172 ROE BP2V2 tiles listed. We have a buyer looking for a complete LED wall package in this range. Want us to put together a concierge proposal sourced from your inventory? You move more gear in one transaction, buyer gets a complete system."

Concierge sourcing conversations are handled personally in the early days. Eventually automated matching.

**Power seller upsell — triggered by listing volume**
When a standard seller has listed a significant number of items, suggest upgrading to power seller tier for priority placement and dedicated support.

---

### Buyer Upsells

**Concierge upsell — triggered by browsing behavior**
Platform monitors what buyers are viewing and watchlisting. When behavior suggests they are assembling a system piece by piece, proactively offer concierge service.

Trigger signals:
- Buyer has watchlisted items across multiple complementary categories — LED panels + processor + rigging
- Buyer has asked multiple Q&A questions across different listings
- Buyer has placed bids on related gear in the same auction
- Buyer has made multiple buy-it-now purchases in the same category within a short window

Message to buyer: "Looks like you're putting together a video wall setup. Our concierge service can spec the complete system for you — processor, cabling, rigging, and all — sourced from verified inventory. Starts at $X. Want us to put together a proposal?"

**Auction alert upsell — triggered by saved searches**
Buyer has a saved search for specific gear. When that gear appears in an upcoming auction, proactive notification with urgency framing.

Message: "A [Manufacturer Model] in Grade B condition just entered next Friday's auction. Based on recent sales, expect bidding between $X and $Y. Set a max bid now to stay in the running."

---

### Upsell Principles
- Never upsell before trust is established — seller needs at least one approved listing, buyer needs at least one completed purchase
- Data-driven triggers only — every upsell message references specific data the seller or buyer can verify themselves
- One clear action — every upsell message has one tap to respond, not a form or a phone call
- High-value concierge upsells are handled personally in early days — these are relationship conversations not automated messages
- Never upsell during a dispute or open issue — terrible timing kills trust

---

### Marketing — The Free Entry Point
The zero-commission buy-it-now launch benefit is the primary marketing hook. It removes every barrier to seller adoption. Do not describe it as 'free forever' — it is a founding seller launch benefit.

**Primary seller headline:**
"List your gear for free. Keep 100% of your sale price."

**One-liner for outreach:**
"The only professional AV marketplace where listing and selling is completely free. You pay nothing unless you choose to run an auction or use our concierge service."

**CFO version:**
"Turn your depreciated inventory into cash. No listing fees, no upfront costs, no commission on direct sales."

**Tech manager version:**
"List your entire available fleet in minutes from your phone. Free to list. Free to sell. No paperwork."

**Fee transparency — important for trust:**
Buy-it-now carries no seller commission in phase 1 — a founding seller launch benefit. Buyer pays payment processing (2.9% + $0.30) at checkout. Seller receives their full asking price. This is not advertised as free forever — it is a launch benefit that will be reviewed at phase 2.

Auction: 10% commission on final sale price. Seller pays commission, buyer pays payment processing at checkout.

**Phase 1 revenue model:**
- Auction: 10% seller commission on final sale price
- Buy-it-now: no seller commission (founding seller launch benefit — not advertised as free forever)
- Buyer: pays payment processing (2.9% + $0.30) on all transactions
- Concierge: buyer-paid fee, custom quoted — manual service, no software UI in phase 1, revenue starts week 1
- White glove: optional paid service or higher commission tier

**Phase 2 revenue model (additions):**
- Buy-it-now remains free for standard sellers up to a volume limit
- Power sellers pay monthly fee or reduced auction commission
- Featured listings become paid
- Newsletter placements become paid
- Concierge becomes a meaningful recurring revenue line
- White glove service formalized with clear pricing tiers

Concierge: Service fee charged to buyer, plus commission on gear sourced from platform inventory. Structure TBD.

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

## Freight Integration

Removing freight friction is a significant seller and buyer value add. Platform integrates with freight partners to provide instant quotes and label generation at transaction close.

**Tiered shipping by weight:**
- Under 150 lbs → UPS/FedEx API — instant quote, label generated in platform
- Over 150 lbs → LTL freight API (uShip, Freightquote, or GoShip) — instant quote, pickup scheduled
- Full truckloads for large sellers — handled personally with preferred freight broker

**Transaction flow:**
Transaction closes → platform generates shipping quote automatically based on origin zip, destination zip, gear weight/dimensions from master database → seller approves quote in app → pickup scheduled → tracking number uploaded to transaction automatically → inspection window starts on confirmed delivery

**Pre-ship photo requirement:**
Seller must upload photos of packaged gear before shipping label is generated. Protects against damage claims and holds sellers accountable for proper packaging.

**Freight insurance:**
Integrate freight insurance into the quote — buyer pays a small premium, gear is insured door to door. Removes a major source of post-transaction disputes.

**Revenue:**
Negotiate volume rates with freight partners. Pass discounted rates to sellers and buyers. Platform keeps a small margin on each shipment.

**Phase 1 approach:**
Start with UPS/FedEx API for under 150 lbs. Add LTL integration in phase 2 once transaction volume justifies it. Large freight handled personally in early days.

---

## Financing Partner Referral

For high-value purchases — anything over $10,000 — platform displays a financing option at checkout. Simple redirect to a financing partner with embedded referral code. No API integration required in phase 1.

**How it works:**
Buyer reaches checkout on a significant purchase → financing banner appears → one tap redirects to financing partner's site with referral code → buyer applies and gets approved on partner's site → platform receives referral fee

**Revenue:**
Financing partners pay 1-3% of financed amount as referral fee, or flat fee per approved application. Passive revenue requiring almost no platform work.

**Partner selection:**
Identify financing companies already working with rental houses and integrators — they understand the asset class and are easier first conversations. Options include Currency Capital, National Funding, Behalf, Fundbox.

**Referral agreement requirement:**
Partner cannot market directly back to platform users without permission. Referral relationship protects platform's customer relationships.

**Phase 1 implementation:**
One link with tracking code at checkout. Takes an hour to implement. Business development conversation with financing partners needed before launch.

**Future:**
As transaction volume grows, negotiate better referral rates. Eventually explore deeper integration — pre-approval flow within the platform, financing displayed alongside bid confirmation in auction.

---


---

## Premium Services

### White Glove Listing Service
For large sellers with significant inventory who won't photograph and list gear themselves. Platform sends someone to the seller's warehouse to handle everything — photos, barcode scanning, QC checklist, serial number documentation, output testing. Seller reviews and approves listings before they go live. Done in 48 hours.

**Who it's for:**
- Large rental houses liquidating a significant portion of their fleet
- Companies closing or downsizing that need everything moved fast
- Estate or dissolution situations
- Insurance liquidations
- Any seller with enough volume that the service pays for itself

**Pricing model — TBD, options:**
- Flat day rate plus travel — seller pays upfront regardless of sales
- Commission bump — no upfront cost, higher commission rate on white glove listings
- Hybrid — small travel fee upfront, modest commission bump

**Strategic value beyond revenue:**
White glove listings are the highest quality listings on the platform — professional photos, complete documentation, verified serials, accurate grades. They perform better at auction, build buyer confidence, and set the standard for what a great listing looks like. A single white glove visit to a large rental house can add hundreds of clean product records to the master equipment database.

**Phase 1 approach:**
No special platform feature needed yet. Sean flies out, photographs, uploads through the regular seller app on the seller's behalf. ⚠️ In-person customer-facing work is Sean's — see the anonymity constraint. Treat it as an operational process before building it as a platform feature. Build the dedicated white glove admin flow when volume justifies it — dedicated job management, assigned photographer, scheduled visit, bulk upload tool.

**Who handles white glove outreach:**
White glove outreach requires someone who understands the professional AV industry and can have a credible conversation with operations managers at rental houses. "We'll come to you, handle everything, get your gear sold." That's a much easier yes than asking a busy operations manager to spend their weekend uploading photos.

---

### Volume Commission Discounts
Large auction lots get reduced commission rates. A rental house bringing significant inventory in one auction is worth more to the platform than many small individual sellers. The discount removes the last objection from large sellers and fills the auction with premium inventory that attracts serious buyers.

**Structure — tiered by auction GMV:**
Specific percentages TBD — based on what the market will bear and what competitors charge. The principle is clear: the bigger the lot, the lower the commission rate.

**Enterprise lots:**
Largest auctions negotiated case by case. No fixed rate — structured as a deal based on inventory value, category, and relationship. ⚠️ Sean signs and is the named party on any agreement; see the anonymity constraint.

**Why discounts make sense:**
A large lot at reduced commission still generates significant revenue. More importantly it establishes AVauction.com as the platform serious sellers use for major liquidations. Those auctions drive buyer traffic, build platform reputation, and generate data that enriches the pricing engine.

**Combine with white glove:**
Volume discount plus white glove listing service is the complete enterprise package. These are relationship deals not automated transactions — handled personally.

---


---

## Internal Data Strategy — The Trading Edge

### Two-Tier Data Strategy
Not all data gets published. The deepest, most actionable intelligence stays internal forever. This is the most important strategic decision in the business.

**What you publish — the credibility layer:**
- The AVauction Price Index gauge — range and confidence only, no price history, no transaction data
- General market trends in the newsletter — directional commentary, not specific signals
- Aggregate category data — enough to be genuinely useful, not enough to trade on
- The newsletter (ongoing) — editorial commentary informed by pricing data, directional signals only

This builds platform credibility, drives newsletter subscribers, and establishes AVauction.com as the authoritative voice on AV resale values. All of it is real and useful. None of it gives away the edge.

**What you never publish — the trading layer:**
- Real-time supply signals — gear submitted but not yet visible to the market
- Buyer demand data — saved searches, watchlist density, search volume by model
- Price velocity — models dropping or rising faster than the market has noticed
- Pre-listing intelligence — gear in admin review queue, not yet live
- Geographic arbitrage — same model selling for significantly more in one region than another
- Time-to-sell data — how fast specific models move at auction vs buy-it-now
- Demand vs supply imbalance — buyers searching for a model with zero current supply

This is the information asymmetry. Sean and Tom see the whole market before the market sees itself. That intelligence is never sold, never published, never exposed via API. It is used exclusively for internal trading decisions.

### No API Access — Ever
Do not build or sell API access to the pricing database. A well-funded competitor could subscribe, feed the data into their own pricing engine, and use it to compete directly. Selling the API means subsidizing your own competition.

The newsletter publishes enough to be credible and valuable. The real data edge stays dark.

### The Arbitrage Operation (Phase 3)
Once 24 months of transaction data exists and the pricing engine is reliable, Sean and Tom operate a quiet trading desk using internal intelligence unavailable to the market.

**The flywheel:**
Internal data flags undervalued gear → platform purchases at listed price → seller is happy, got their asking price → gear enters platform inventory → listed in next Friday's auction at market price → closes above purchase price → repeat

From the outside this looks like a normal transaction. Seller got paid. Buyer got gear. Platform kept the spread. No disclosure required beyond what's in the seller agreement.

**The exit structure:**
When the company sells, the acquirer buys the platform, the brand, and the marketplace transaction history. There is no published data product — that concept was retired (see Phase 3: the data stays dark). The trading operation and the deep intelligence that powers it stays with Sean and Tom personally. This must be negotiated into the sale agreement explicitly. The acquirer gets the marketplace. Sean and Tom keep the edge and continue compounding it independently post-exit.

### New Gear Wholesale (Phase 4)
Buy new gear at wholesale/dealer cost from manufacturers and sell it on the platform alongside used inventory. Authorized dealer relationships with key manufacturers — ROE, d&b, L-Acoustics, Brompton, MA Lighting.

New gear today becomes used gear in 5 years. A rental house that buys new ROE panels through AVauction.com is the same rental house that lists those panels when they upgrade. Platform owns both ends of the lifecycle.

Keep firmly in phase 4 — requires manufacturer relationships, dealer agreements, and cash flow to support inventory risk.

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

## Design and Functionality Inspiration

AVauction.com draws design and functionality inspiration from two platforms that have genuinely solved the trust, data, and marketplace experience problems in their respective industries. Study both before building any buyer-facing feature.

### Reverb.com — The gold standard for used gear marketplaces
Reverb is the world's largest marketplace for used musical instruments. Roughly 85% of their employees are musicians — the platform was built by people who actually understand the product and the community. That insider knowledge is exactly what AVauction.com has with Tom.

**What to steal from Reverb:**

Price guide built into every listing — Reverb shows real transaction data alongside every listing so buyers know immediately if the asking price is fair. This is the AVauction Price Index gauge concept applied to a gear marketplace. It builds trust, reduces negotiation friction, and makes buyers more confident pulling the trigger.

Condition-based listing flow — Reverb's seller flow guides sellers through condition selection with clear definitions. Sellers know exactly what each condition grade means in the context of that category of gear. This maps directly to the QC checklist and A-D grading system.

Free to list, commission on sale — same model as AVauction.com. Reverb charges 5% selling fee plus payment processing. Removing the listing fee friction is what got sellers to move over from eBay.

Shop profiles for sellers — each seller has a shop page that shows their full inventory, transaction history, response rate, and reviews. This is the seller profile and trust tier system. Buyers can browse a seller's entire catalog from one page.

Make an offer feature — buyers can negotiate by submitting an offer without direct contact with the seller. Platform mediates the negotiation. This is worth considering as a phase 2 feature for buy-it-now listings where the seller is open to negotiation.

Feed personalization — Reverb's homepage shows listings based on what you've browsed and saved. This is the saved search and watchlist system taken further — the platform learns what you're looking for and surfaces it without you asking.

Mobile app quality — Reverb's iOS and Android apps are best in class for a gear marketplace. Barcode scanning, photo upload, and listing management all work smoothly on mobile. The AVauction seller app should feel this polished.

**The Reverb energy to match:** Built by people who love gear. The listings have personality. The interface feels like it was designed by someone who has actually played in a band, not a generic e-commerce template. AVauction.com should feel like it was built by people who have actually loaded trucks at 3am.

---

### StockX — The gold standard for data-driven marketplace trust
StockX took a chaotic, fraud-ridden market — sneaker resale — and made it trustworthy by treating it like a stock exchange. Every decision they made was about eliminating uncertainty for buyers and sellers. That same approach applies directly to professional AV gear.

**What to steal from StockX:**

Standardized product pages — StockX eliminated individual seller listing pages entirely. Every sneaker has one canonical product page showing the price history graph, current bids and asks, and transaction volume. The product is the same regardless of who is selling it. AVauction.com does this with the master equipment database — every ROE BP2V2 listing uses the same specs, the same product page template, the same pricing data. Sellers add their condition and photos, not their own product descriptions.

Price history graph — the AVauction Price Index gauge is inspired by StockX's price chart. StockX shows a line graph of every transaction price over time so buyers can see at a glance whether prices are rising, falling, or stable. The AVauction Price Index gauge and admin trading desk dashboard should feel like this — authoritative, visual, instantly readable.

Bid/ask interface — StockX operates like a limit order book. Buyers post bids at prices they're willing to pay. Sellers post asks at prices they'll accept. When they match, the transaction executes automatically. This is more sophisticated than AVauction.com's current auction model but worth studying — especially for the buy-it-now section where a "make an offer" feature could work the same way.

No direct buyer-seller contact — StockX routes everything through the platform. Buyers and sellers never communicate directly. The platform is the intermediary. This is exactly the AVauction model — all Q&A through the platform, all payments through escrow, seller anonymity until escrow is funded. StockX proved this model builds more trust than direct contact, not less.

Authentication as a trust pillar — StockX physically inspects every item before it reaches the buyer. AVauction.com's equivalent is the QC checklist, admin review, condition grading, and the escrow inspection window. The message to buyers should be the same: we stand between you and a bad transaction.

Data transparency everywhere — StockX shows transaction volume, price volatility, days since last sale, and how many people are watching a product. All of this is available to every user for free. The data makes the market feel real and active. AVauction.com's social proof row — lot count, bids, watchers — on the countdown timer and listing pages is this same principle.

Clean, premium dark aesthetic — StockX has moved toward a dark, minimal design that feels more like a financial product than a classified ad site. Numbers and data are prominent. Photos are secondary to the data. AVauction.com should feel closer to StockX than to eBay or Craigslist.

**The StockX principle to internalize:** Remove the "listing" entirely. A listing is just a seller's opinion of what their gear is worth. A product page backed by real transaction data is the market's opinion. Show the market's opinion and the listing becomes a secondary detail. This is exactly what the master equipment database and AVauction Price Index gauge accomplish.

---

### Combined principles for AVauction.com

From Reverb — the human touch. Community, personality, gear culture, people who actually know what they're talking about. The editorial voice of the newsletter. The Easter eggs. Real industry knowledge behind the content.

From StockX — the data spine. Standardized product pages from the master equipment database. Price history backed by real transaction data. No direct buyer-seller contact. Trust through process, not through personality.

The combination is something neither of them is: a professional B2B gear marketplace that has both the industry credibility of Reverb and the data infrastructure of StockX, applied to a market — professional AV — that has never had either.

---

### Reverb.com as a data source
In addition to design inspiration, Reverb has an official API. ✅ **VERIFIED July 28, 2026 — it DOES expose sold data.** `/api/listings/all?state=sold` returns graded realized prices; 658 rows pulled across 53 pro-AV models. See the Data Source Status Table. The API is documented around managing your own Reverb shop (my/listings, my/orders). A `price_guides` endpoint appears in their HAL link structure but has not been tested. Generate a personal access token and hit it before planning around it. Add Reverb to the market price scraper alongside eBay, GearSource, Gearsupply, and SoundBroker.

Reverb API targets for the scraper:
- Professional audio consoles — Yamaha, DiGiCo, SSL, Avid, Allen & Heath, Midas
- Power amplifiers — d&b, L-Acoustics, Crown, Lab.gruppen
- Signal processing — outboard gear, crossovers, DSP units
- Microphones and DI boxes — Shure, Sennheiser, Audio-Technica, Radial
- Cross-reference every listing against master equipment database — only pull models that exist in the database, ignore consumer gear

⚠️ **Two caveats on Reverb, both material.**

First, access is unverified — see above. Second, and independent of access: Reverb's Price Guide covers guitars, basses, amps, pedals, synths and drums. Our catalog is line arrays, LED walls, lighting consoles and video processors. Reverb is genuinely useful for a Yamaha CL5 or an outboard compressor. It is not where a d&b array or a Brompton processor trades. "Strong on professional audio" is true relative to consumer marketplaces and misleading relative to our actual inventory.

---

---

## Competitor Analysis

A detailed look at every platform AVauction.com competes with. Study what each one does well and where they fall short. The gaps are the opportunity.

---

### GearSource (gearsource.com)
**Founded:** 2002 — the oldest and most established competitor. 22 years in the market.
**Model:** Global B2B marketplace for buying and selling used professional live events equipment. Operates in 100+ countries.

**What they do well:**
- Global reach — the most internationally recognized name in professional AV resale
- 48-hour inspection period on all orders — they figured out escrow protection early
- Secure payment system — established trust with buyers and sellers
- GearShare — they just launched an AI-powered cross-rental marketplace alongside their sales marketplace. This is smart — same inventory listed for sale AND available for short-term cross-rental simultaneously
- GearSpotting — proprietary AI search across rental inventories
- NeedZone — reverse listing tool where buyers post what they need and sellers find them
- GearIQ (coming 2026) — analytics layer with pricing intelligence and asset utilization data. This is the closest competitor to AVauction's pricing intelligence layer. ⚠️ Note: the "AVauction Market Report" public data product was retired — the data stays dark (see Phase 3). GearIQ competing on published analytics does not obligate us to publish ours; our answer is the Price Index gauge plus Tom's editorial commentary, not a data product

**What they don't do well:**
- No pricing intelligence visible to buyers or sellers — 22 years of data and no AVauction Price Index gauge
- No auction functionality — pure buy-it-now, no weekly event, no urgency mechanism
- No condition grading system — seller describes condition however they want, inconsistent
- No newsletter or editorial voice — the site feels like a database, not a community
- Design is dated — functional but not premium, feels like 2015
- No seller trust tier system — buyer has no way to quickly assess seller credibility

**The GearIQ situation — important clarification:**
GearSource itself is a pure buy/sell marketplace — no rentals. Their parent company GearNet Holdings separately launched GearShare, a cross-rental platform for production companies who need to borrow gear from other rental houses for a few days. GearIQ is being built on top of GearShare, not GearSource — it's primarily focused on rental utilization analytics, not resale pricing intelligence. Helping rental houses understand how much their gear sits idle and when to rent it out is a fundamentally different product from a KBB-style price gauge for used gear transactions.

That said, GearNet Holdings now has both platforms and could eventually pull pricing intelligence from both rental and sales data. Watch GearIQ as it develops. For now the used gear resale pricing intelligence angle — the AVauction Price Index gauge, the market report, transaction-based price history — is still wide open. Move fast to establish AVauction.com as the authoritative tool before GearIQ expands its scope.

---

### Gearsupply (gearsupply.com) + Gearsupply Direct
**Founded:** ~2020
**Model:** Two-sided marketplace (gearsupply.com) plus direct repurchaser (gearsupply.direct, formerly Soundsupply — claims to be the world's leading repurchaser and reseller of used AV equipment)

**What they do well:**
- Clean modern design — the best-looking site among the direct competitors
- GearGuru specialists — human concierge service to help buyers find the right gear. This is the closest thing to AVauction.com's concierge concept in the existing market
- Direct buying — they buy gear directly from sellers for instant cash. Sellers who don't want to wait for a marketplace sale get an immediate offer
- Sustainability angle — strong positioning around reducing AV gear going to landfill. Smart differentiator
- L-Acoustics CPO partnership — certified pre-owned program with a major manufacturer. This is the new gear wholesale concept in early form
- Lowest fees positioning — claim to have the lowest fees in the industry
- Buyer-seller direct chat — they allow buyers and sellers to communicate directly on the platform

**What they don't do well:**
- No auction — same as GearSource, no weekly urgency mechanism
- No pricing intelligence — no gauge, no price history, no market data visible
- No condition grading standard — inconsistent seller-defined conditions
- Direct buyer-seller chat is a non-circumvention risk — their own feature could be undermining their commission
- No newsletter or editorial content beyond generic blog posts about AV topics

**GearGuru — the closest concierge competitor:**
Gearsupply has a feature called GearGuru — "Speak with our GearGuru specialists to find the perfect gear for your next show." This is the closest thing in the market to AVauction.com's concierge service. However the differences are significant:

- GearGuru is a customer service chat function. It helps buyers find gear that is already listed on the platform. AVauction.com's concierge specs an entire system from scratch — complete signal flow, specific models, quantities, rationale — then sources the gear from platform inventory.
- GearGuru is powered by a customer service rep. AVauction.com's concierge is powered by AI with human expert review of every recommendation. That scales in a way a human-only service cannot.
- GearGuru has no structured intake process, no project dashboard, no tiered service levels. It's a chat window.
- GearGuru does not appear to generate formal system proposals or handle the full procurement process end to end.

Nobody in this space is doing true AI-assisted system design for buyers. The concierge is genuinely differentiated — not an incremental improvement on GearGuru but a fundamentally different service.

**Key insight:**
Gearsupply Direct is essentially doing what the AVauction.com internal arbitrage trading desk will do — buying undervalued gear and reselling it at market price. They're doing it manually and publicly. We'll do it with data intelligence and quietly.

---

### SoundBroker (soundbroker.com)
**Founded:** 1997 — the oldest platform, predates the internet marketplace era
**Model:** Membership-based sales organization. 85,000+ listings, $100M+ in listed inventory

**What they do well:**
- Volume — largest raw listing count of any competitor
- Longevity — nearly 30 years of industry relationships
- Specialty in liquidating manufacturers' discontinued inventory — a unique niche
- Real-time listing updates

**What they don't do well:**
- Design is 1990s era — looks genuinely outdated, no mobile optimization visible
- Membership-based model creates friction — buyers and sellers need to join before transacting
- No pricing intelligence, no auction, no condition grading standard
- No escrow or buyer protection mentioned
- No community or editorial voice
- The weekly Zoom show the founder hosts about current events is... not a marketing strategy

**Key insight:**
SoundBroker survives entirely on legacy relationships and volume. The 30-year-old sellers and buyers who know it will keep using it. A new generation of rental house operators has no reason to go there over a more modern platform. AVauction.com's newsletter and community angle wins this audience without much effort.

---

### AVGear (avgear.com)
**Model:** Direct buyer of used AV equipment — "sell your gear for instant CASH." Also sells used gear through their own storefront.

**What they do well:**
- Instant cash offer for sellers who don't want to wait — same as Gearsupply Direct
- No hassle, no fees for sellers — they take on the resale risk themselves
- Quick turnaround

**What they don't do well:**
- Not a true marketplace — they're a dealer, not a platform connecting buyers and sellers
- No pricing transparency
- No auction
- Limited inventory depth compared to marketplaces
- Generic design, no brand personality

**Key insight:**
AVGear is a direct competitor to the AVauction.com internal arbitrage trading desk, not to the marketplace itself. They're buying undervalued gear and reselling it. The difference is they do it publicly and without data intelligence. We'll know what gear is undervalued before they do.

---

### 10K Used (10kused.com)
**Founded:** 2005
**Model:** Buy and sell used stage lighting, audio, video, and event production equipment. Worldwide shipping.

**What they do well:**
- 20 years in the market — established presence
- Worldwide shipping focus
- Covers all AV categories

**What they don't do well:**
- Design looks dated
- No auction functionality
- No pricing intelligence
- No condition grading standard
- No escrow or buyer protection visible
- No newsletter or editorial presence
- Appears to be a smaller operation with limited inventory depth

**Key insight:**
10K Used is the smallest of the direct competitors. Low threat. Worth monitoring for pricing data via scraper.

---

### The competitive landscape summary

Every single competitor shares the same fundamental weaknesses:
- No weekly auction creating urgency and return visits
- No AVauction Price Index gauge showing buyers and sellers what gear is worth
- No standardized condition grading system
- No authoritative editorial voice or newsletter
- No data product or market intelligence

GearSource is the most serious competitor — 22 years old, global presence, and GearIQ coming in 2026 threatens the data angle. Gearsupply is the best-designed and most modern. SoundBroker has the volume. Nobody has the auction. Nobody has the pricing intelligence. Nobody has a newsletter with genuine industry credibility behind it.

The window to establish AVauction.com as the authoritative platform for professional AV resale is open. GearIQ is the signal that it won't stay open forever.

---

## Additional Scraping Sources — Extended Competitor List

Which of the 20 additional platforms are worth scraping, what data they provide, and any legal or technical considerations. Organized by value tier.

### Legal framework before diving in
Scraping publicly visible pricing from competitor websites is generally legal in the US based on the hiQ Labs vs LinkedIn precedent — the Ninth Circuit confirmed that scraping public data does not automatically violate the CFAA. The key rules are: respect robots.txt where it explicitly blocks scrapers, don't scrape behind logins or paywalls, rate limit requests to avoid server load, and never collect personal user data. The pricing and listing data on these sites is public and does not contain personal information.

Claude Code should check each site's robots.txt before building the scraper and honor any explicit disallows. The scraper should identify itself with a real user-agent string and apply a crawl delay between requests.

---

### Tier 1 — High value, scrape immediately alongside existing sources

**Audiogon (audiogon.com)**
High value for professional audio gear — consoles, amplifiers, signal processing, high-end microphones. Audiogon has a large volume of used professional audio listings and their Bluebook captures real transaction data. Publicly accessible scrapers already exist on Apify for Audiogon listings — the data structure is well understood. Pull manufacturer, model, condition, asking price, and any sold/transaction data visible. Cross-reference against master equipment database to filter for professional gear only.

**UsedAVGear.com (Nationwide Video)**
Prices are publicly visible on their WooCommerce site. High-value professional AV gear — projectors, LED processors, Disguise media servers, Christie, Barco. These are exactly the models that should be in the master equipment database. Asking prices from a major rental house liquidator are strong market signals. Scrape product pages — manufacturer, model, condition description, asking price. Regular price vs sale price both visible.

**Clair Used Gear (clairusedgear.com)**
Similar to UsedAVGear — dealer pricing from a major touring company. Professional audio focused — line arrays, amplifiers, consoles, wireless. Shopify-based so product page structure is consistent and easy to scrape. High confidence data because Clair's technicians inspect and grade everything before listing.

**Solaris Network (solarisnetwork.com)**
International professional AV dealer with strong lighting and video inventory. Dual USD/EUR pricing. Pull manufacturer, model, condition, USD asking price. Good for lighting gear pricing where other sources are thin — MA Lighting, Christie, Barco, ROE, Unilumin.

**CUE Sale (cuesale.com)**
Dutch professional AV dealer. Strong on European touring lighting gear. Has their own 3-star condition rating system. Pull manufacturer, model, condition star rating, price in EUR. Convert to USD at current rate. Useful for lighting and rigging pricing where US market data is sparse.

**ChurchGear (churchgear.com)**
Nashville based. Church AV equipment — consoles, amplifiers, speakers, wireless. Lower price tier than professional touring gear but real transaction prices if they publish sold data. Mostly relevant for audio gear pricing at the lower end of the professional market. Worth including for audio console pricing context.

---

### Tier 2 — Moderate value, add after Tier 1 is running

**Sweetwater Gear Exchange (sweetwater.com/used)**
Publicly visible listing prices. Music gear focused but Live Sound & Lighting category contains professional AV gear — line arrays, consoles, amplifiers, wireless systems. The Sweetwater brand and buyer volume means these prices reflect real market demand. Pull the Live Sound & Lighting category specifically. Filter against master equipment database to exclude consumer gear.

**Guitar Center Used (guitarcenter.com/Used)**
Largest US music retailer. Used section has professional audio gear — Shure wireless, Yamaha consoles, Crown amplifiers. Lower tier than professional touring but large transaction volume means statistically meaningful pricing. Pull Pro Audio category specifically. Guitar Center prices tend to run slightly high on used gear so weight these listings at lower confidence than GearSource or eBay.

**B&H Photo Used (bhphotovideo.com)**
Professional video and audio used section. Broadcast-grade equipment relevant to the AV market — cameras, switchers, intercoms, projection. Lower volume than eBay but B&H's inspection and grading makes these prices meaningful. Pull Used Pro Audio and Used Video categories.

**Adorama Used (adorama.com)**
Similar to B&H — professional photo/video/audio used section. Lower priority than B&H but additional data points for broadcast and studio gear.

---

### Tier 3 — Low value or too small to bother

**Saturday Audio (saturdayaudio.com)**
High-end home audio dealer in Chicago. Audiophile market — not professional AV. Skip unless adding high-end studio microphone and preamp pricing.

**Midwest Digital AV (midwestdigitalavinc.com)**
Small AV integrator with used gear. Tiny inventory. Not worth the scraper overhead.

**AVL Gear (avlgear.com)**
Small Shopify site. Limited professional AV inventory. Skip.

**Paragon SNS (paragonsns.com)**
Small preowned specials section from an integrator. Skip.

**Long & McQuade GearHunter (long-mcquade.com/GearHunter)**
Canada's largest music retailer. Used gear section with professional audio. Canadian pricing in CAD — conversion adds noise. Decentralized listing means coverage is inconsistent. Low priority but worth adding eventually for Canadian market data.

**Gearwise (gearwise.se)**
Swedish dealer. Prices in SEK. Nordic market. Skip for now — too much currency conversion noise for a US-focused pricing engine. Add if building international market data in phase 3.

**AV.com (av.com/secondhand)**
Premium domain. Need to investigate what's actually there — limited information accessible. Monitor but don't prioritize.

**AVGear (avgear.com)**
Direct buyer and dealer, not a listing marketplace. They buy gear at unpublished prices and resell it. Their asking prices are dealer markups on unknown purchase costs — lower quality signal than marketplace prices. Skip.

---

### What to scrape from each source

For all sites, pull only these fields:
- Manufacturer
- Model name (exact)
- Condition description or grade
- Asking price (USD)
- Date scraped
- Source URL

Do NOT attempt to scrape:
- Seller personal information
- Buyer contact details
- Internal transaction data
- Any data behind a login

Filter every scraped listing against the master equipment database — only store records where the manufacturer and model match an existing master_equipment record. Do not create new master database records from scraper data alone — those require admin review.

---

### The complete scraper source list — final picture

**Sold price sources (highest quality data):**
1. eBay API — ASKING prices only via Browse API (sold data gated behind Marketplace Insights — see the eBay API section)
2. Reverb API — ✅ VERIFIED July 28: sold access works (`/api/listings/all?state=sold`), and the narrow-category worry was WRONG — consoles, arrays, wireless, lighting, projectors all return graded sold data. 658 rows staged.

**Asking price sources (secondary quality):**
3. GearSource — direct competitor, professional AV focused
4. Gearsupply — direct competitor, professional AV focused
5. SoundBroker — direct competitor, professional AV focused
6. UsedAVGear.com — Nationwide Video fleet liquidation
7. Clair Used Gear — Clair Global fleet liquidation
8. Solaris Network — international dealer, strong on lighting and video
9. CUE Sale — European touring lighting specialist
10. Audiogon — professional audio consoles and amplifiers
11. Sweetwater Gear Exchange — Live Sound & Lighting category only
12. Guitar Center Used — Pro Audio category only, lower weight
13. B&H Photo Used — Pro Audio and Video categories
14. ChurchGear — lower-tier professional audio, Nashville

**Important — AV-iQ is NOT a pricing data source:**
AV-iQ is a manufacturer product catalog for new gear. It contains MSRP and specs but no used prices, no sold prices, and no transaction history. It is scraped once in week 1 to seed the master equipment database with clean product records — manufacturer, model, category, specs, MSRP, discontinued status. It is never scraped again for pricing data. All 21 pricing data sources listed above are separate from AV-iQ.

The resellers listed on AV-iQ are authorized dealers for new gear — companies like Midtown Video, Spinitar, and A-V Services. These are potential future sellers on AVauction.com but their AV-iQ presence provides no used pricing data.

That is **14 enumerated candidate sources** above (2 sold-price candidates, 12 asking-price), expanding to **21 total** once the GOLD/SILVER/BRONZE tier sources documented in the next section are added — AVGear auctions, SoldTiger, AVLAuction, LiveAuctioneers, West Auctions, HifiShark, USAudioMart, BidSpotter, Jones Swenson. ⚠️ Earlier drafts variously claimed 21, 14, and 13 for the same list; **14 enumerated + 7 tiered = 21** is the reconciliation. ⚠️ **Candidate, not confirmed** — several were found in July 2026 to be inaccessible, paywalled, or category-mismatched. See the sold_verified definition for current per-source status before treating any of them as available.

---

## Additional Scraping Sources — Beyond the Original List

Beyond the 14 sources enumerated above, there are several more categories of public pricing data worth capturing. These are organized by value tier.

---

### GOLD TIER — Auction Sold Results (Real Transaction Prices)

⚠ **IMPORTANT — VERIFY BEFORE BUILDING SCRAPER**
These sources were identified as potential sold price data sources but have NOT been fully verified for public accessibility. Before building scrapers for any of these, manually register an account and confirm that final sold prices per lot are publicly visible after an auction closes — without a paid subscription. Some may require login, some may require paid access, some may be genuinely public. Do not assume.

**AVGear.com Auctions (avgear.com/pages/auctions)**
AVGear runs **bimonthly** professional AV-only auctions — Feb/Apr/Jun/Aug/Oct/Dec, six per year. (Documented as "quarterly" in earlier drafts; the stated months are every two months. Corrected July 28, 2026 — this matters because it sets when the next observable auction falls after the August one.) Archives back to Dec 2024. Brands include grandMA, Avid, Soundcraft, Martin, NEXO, Chauvet, Panasonic, Christie.
✅ CORRECTED JULY 2026: auctions run on **josephfinn.com (Joseph Finn Co.)** — NOT SoldTiger as previously written. Register via the buttons on avgear.com/pages/auctions.
⚠ Verify: does josephfinn.com show realized prices per lot on PAST AVGear auctions? Also: SoldTiger's known behavior is to render "Winning Bid: N/A" on closed lots for logged-out visitors — check whether Joseph Finn does the same.
📅 Next auction: opens Aug 13, 2026, closes Aug 19–20. Watching it live captures real competitive-bid prices on our exact catalog regardless of what the archive shows.

**SoldTiger.com (Tiger Group AV Auctions)**
Tiger Group runs the largest professional AV auctions in the country — $7M+ in a single two-day sale.
✅ SCANNED JULY 2026 (logged out): closed auction catalogs are PUBLIC — full lot lists with names, quantities, sold/unsold status, no login wall, paginated (e.g. soldtiger.com/auctions/catalog/id/568, 747 lots). **But every sold lot renders "Winning Bid: N/A" for logged-out visitors** — the field exists, the amount is withheld.
⚠ Verify (requires login): does N/A become a dollar figure for registered bidders? Also test the "Highest/Lowest Price" catalog sort while logged in — if it works, prices exist in the data. Registration requires a credit card ($300 authorization hold, released in 3–7 days). ⚠️ Signup form is currently BROKEN — eWAY encryption script (`eCrypt`) fails to load, submit does nothing, confirmed in clean browser. Register by phone: (805) 497-4999.
📌 Even without prices: public sold/unsold status per lot = sell-through data by model across every Tiger AV auction. That's collectable today.
📌 Their Terms of Sale (read in full July 2026): no anti-scraping/data-use clauses — it's purely a buyer's contract (deposits, removal, as-is). Note clause 4: Tiger and affiliates may bid in their own auctions for their own account.

**AVLAuction.com**
European professional AV auction platform. MA Lighting, Clay Paky, Martin, Robe, L-Acoustics, Yamaha, Christie, Barco.
⚠ Verify: Are post-auction sold prices publicly visible without login?

**LiveAuctioneers.com — ⚠️ UNVERIFIED, kept in**
The free results database is confirmed real — 29 million results, keyword searchable, no paywall.

⚠️ Free results database, 29M records, keyword-searchable, no paywall. A Google search for CL5/d&b/grandMA surfaced no LiveAuctioneers pages — but that reflects Google ranking, not their internal index, so it's not conclusive. They likely carry speakers, mixers, and microphones through estate and general-audio sales. Caveat that matters: general consumer-audio prices are not professional-touring prices, and mixing them into the median would mislead the gauge. Search their own results database directly to gauge pro-AV depth; if kept, tag records to keep consumer and pro audio separable.

**West Auctions (westauction.com) — AV & Staging Category**
Northern California auctioneer conducting professional AV auctions on behalf of rental houses.
⚠ Verify: Are post-auction sold prices publicly visible without login?

---

### SILVER TIER — Aggregators and Meta-Search

These platforms aggregate pricing data from multiple sources — scraping them efficiently captures data from sources that would be expensive to scrape individually.

**HifiShark (hifishark.com)**
Meta-search engine covering 600+ second-hand audio marketplaces worldwide. Aggregates listings from Audiogon, USAudioMart, eBay, and 600+ others. One search pulls from dozens of sources simultaneously. Strong on professional audio — consoles, amplifiers, outboard gear. Search by model and pull all results across all sources. This is extremely efficient — one scraper covering hundreds of sources. Note: HifiShark shows asking prices, not sold prices. But the breadth of coverage makes it valuable for establishing asking price consensus across many sources simultaneously.

**USAudioMart (usaudiomart.com)**
America's largest free audio classifieds. Professional audio gear appears alongside consumer audiophile gear. Yamaha consoles, Crown amplifiers, QSC, Shure wireless — all listed here by individual sellers. Free to list means prices tend to be realistic market prices without dealer markup. Pull the professional audio categories. Filter against master equipment database.

---

### BRONZE TIER — Monitor but Lower Priority

**BidSpotter (bidspotter.com)**
Auction aggregator similar to LiveAuctioneers. Professional AV equipment appears across multiple auctioneers. Useful for finding additional auction results sources. Lower priority than direct auction sites.

**Jones Swenson Auctions (jonesswenson.com)**
Texas auctioneer that has conducted AV equipment auctions on behalf of Freeman AV and other major companies. Freeman AV — one of the largest AV companies in the US — uses them to liquidate fleet. Post-auction results occasionally published. Monitor for new auctions and scrape results when they appear.

---

### Why Auction Sold Results Are the Most Valuable Data

This is worth stating clearly because it changes the priority order of the scraper build:

Asking prices — what sellers hope to get — are the weakest signal. Any seller can ask any price they want. GearSource, Gearsupply, and the dealer sites all show asking prices.

Transaction prices from our own platform — what buyers actually paid — are the strongest signal. But these don't exist until the platform has been running for months.

Auction sold results — what competitive bidding produced — are the next best thing to our own transaction data, **but only from curated retail-format auctions.** A sold result from a Tiger Group auction of Solotech fleet gear is a real market price produced by competitive bidding among professional buyers.

⚠️ **This does NOT apply to liquidation-format auctions.** €10 opening bids, as-is untested lots, and local-pickup-only terms produce floor prices, not market values. See the revised confidence weighting model — liquidation results carry base weight 0.25 and are excluded from the median until the discount can be measured empirically.

This means the scraper priority order should actually be:

1. eBay API — ⚠️ asking prices only. Sold listings are NOT accessible without Marketplace Insights approval (see the eBay API section)
2. Reverb API — ✅ VERIFIED July 28 (use `/api/listings/all?state=sold`, NOT price_guides); category fit is broad, not narrow. 658 graded sold rows staged.
3. AVGear.com auction results — sold prices, pro AV specific
4. SoldTiger.com auction results — sold prices, largest professional AV auctions in the country
5. AVLAuction.com auction results — sold prices, strong on European touring gear
6. LiveAuctioneers.com — ⚠️ unverified, kept in; search their own DB for pro-AV depth, separate consumer from pro comps
7. HifiShark — aggregated asking prices across 600+ sources
8. GearSource — asking prices
9. Gearsupply — asking prices
10. SoundBroker — asking prices
11. UsedAVGear.com — dealer asking prices
12. Clair Used Gear — dealer asking prices
13. Solaris Network — dealer asking prices
14. CUE Sale — dealer asking prices
15. Audiogon — asking prices, strong on professional audio
16. Sweetwater Gear Exchange — asking prices, Live Sound category only
17. Guitar Center Used — asking prices, Pro Audio category only
18. B&H Photo Used — asking prices
19. ChurchGear — asking prices, lower tier audio
21. USAudioMart — asking prices, individual sellers
22. West Auctions — sold prices, irregular cadence

That is 21 candidate sources (14 enumerated + 7 tiered). ⚠️ **The claim that the first 6 are usable sold-price sources did not survive verification.** eBay sold is unavailable, Reverb is unverified, LiveAuctioneers coverage is unconfirmed (Google shows nothing but their internal DB is untested), and AVLAuction and West Auctions are liquidation-format rather than comps. Treat this list as a research inventory, not a build plan — the per-source status in the sold_verified definition governs.

Prioritize sold price sources first — but only after verifying each one is actually accessible and category-appropriate. See the sold_verified definition. Verification precedes scraper construction.





---

## Extended Competitor Analysis — Second Wave

A detailed look at every additional platform provided for analysis. These range from direct competitors to adjacent dealers and retail chains. Organized by category.

---

### CATEGORY 1 — Direct AV Marketplace Competitors (Non-Marketplace Dealers)

These are dealers who buy gear from sellers and resell it themselves — not true two-sided marketplaces. They compete for the same seller inventory but through a different model.

---

**UsedAVGear.com**
Subsidiary of Nationwide Video — "North America's largest Live Events rental company." This is significant. They're liquidating their own fleet through a direct retail storefront, not a marketplace. Clean WooCommerce site, good photography, professional AV categories. Barco projectors at $65,000, Disguise media servers at $35-40,000 — high-value gear listed clearly.

What they do well: Professional photography and real photos. Clear pricing. High credibility because it's backed by an actual major rental company. Clean category navigation.

What they don't do: They're a dealer, not a marketplace. No seller listings from other companies. No AVauction Price Index gauge, no auction, no community. The trust comes from Nationwide Video's name, not from a transparent transaction process.

Key insight: UsedAVGear.com is actually a future seller on AVauction.com, not just a competitor. Nationwide Video liquidating fleet inventory through AVauction's white glove service and auction format could be a significant partnership. They're already selling gear — the question is whether AVauction's auction format gets them better prices than their own retail site.

---

**Clair Used Gear (clairusedgear.com)**
Clair Global's own used gear storefront — Clair is one of the most legendary names in professional audio, the company behind some of the biggest concert touring operations in the world. This is their fleet liquidation channel. Shopify-based. Clean, professional. 14-day replacement policy. Audio, lighting, RF/wireless categories. Links to eBay store for reviews — they're cross-posting there too.

What they do well: The Clair name is enormous credibility. "Expertly curated used gear" backed by technicians who actually know professional audio. 14-day replacement policy shows confidence in what they sell. Clean presentation.

What they don't do: Same as Nationwide Video — dealer, not marketplace. No two-sided transactions. No pricing data. No auction.

Key insight: Clair Global is another potential white glove seller. When Clair retires equipment from tours and installations, AVauction.com's auction format could generate significantly better prices than their own Shopify store. The relationship Tom builds with major houses like Clair is more valuable than any feature built.

---

**Solaris Network (solarisnetwork.com)**
Global distributor of used and new professional AV — lighting, video, audio. Sells to 88+ countries. Established, international, serious selection of lighting and video gear. Has a "Wanted" section where buyers post what they need — this is the NeedZone concept already in practice. B-Stock section. Dual currency pricing (USD/EUR) on every listing.

What they do well: International reach. Dual currency. Wanted listings where buyers post what they need. B-Stock section separate from used. "Tell Us What You Need" reverse listing tool. Good brand coverage — MA Lighting, Christie, Barco, L-Acoustics, Meyer Sound.

What they don't do: Still a dealer. No two-sided marketplace. No buyer protection visible. No auction. Design is dated — early 2010s era. No pricing intelligence.

Key insight: Solaris proves international demand for professional AV gear. The Wanted section confirms buyers actively seek specific gear. The "Tell Us What You Need" feature is worth building as a lightweight buyer request board in phase 2.

---

**ChurchGear (churchgear.com)**
Nashville, TN based. Mission: "rescue production gear from churches, restoring and reselling it to smaller churches and individuals." This is a very specific niche — church-to-church AV gear pipeline. 6-month warranty on purchases (churches only). Podcast, ServiceCrew community, book by founder, live events. Built on Shopify. 855 number. Full team page.

What they do well: Extremely clear mission and audience. Community built around the seller/buyer (churches). Content marketing — podcast, blog, free resources. Warranty builds trust. ServiceCrew creates a professional network. Local to Nashville.

What they don't do: Dealer, not marketplace. Limited to church AV categories. Small individual seller prices — Yamaha M7CL at $999, Midas PRO6 at $2,800. Not the high-value professional touring and rental market AVauction targets.

Key insight: ChurchGear is a potential buyer channel for AVauction.com. Churches upgrading their systems sell to ChurchGear — but the rental house gear that comes in at auction is often exactly what larger churches buying through ChurchGear would want. The concierge service directly competes with ChurchGear's church customer base. AVauction.com should be the premium option for a church spending $75,000+ on a system; ChurchGear serves the $1,000-$10,000 church market.

---

**CUE Sale (cuesale.com)**
Netherlands-based. 10 years in business. Used stage lighting, audio, video, and rigging. Sells internationally. Lease financing available through Grenke Lease. CUE Spares sister site for spare parts. B-stock section separate from used. Strong on European touring lighting gear. Real photos — "All pictures are made by us." 3-star condition rating system. Ships next day from stock. Instagram/TikTok active.

What they do well: Own photography commitment — "We don't use 3rd party pictures." Clear 3-star condition rating system. Real-time availability — everything in stock, ships next day. Lease financing available. Spare parts sister site is a smart companion product. Active social media presence with real content. Clear pricing excluding VAT. Comparison tool on listings. Compare and wishlist features.

What they don't do: European-focused, small US presence. Dealer not marketplace. No auction. No pricing intelligence. No community beyond social media.

Key insight: CUE Sale's own photography commitment and 3-star condition rating are worth noting. Their "everything in stock, ships tomorrow" positioning is strong seller messaging. The spare parts sister site is interesting — a "parts" section for Grade D gear on AVauction.com could be a phase 2 idea. Lease financing integration is more advanced than AVauction.com's referral banner — worth studying their Grenke integration when building the financing feature.

---

### CATEGORY 2 — Audiophile and High-End Audio

**Audiogon (audiogon.com)**
The oldest and largest high-end audiophile marketplace. Founded late 1990s. Has both auction and classified listings. The Bluebook — their proprietary price guide showing real transaction data. VIP Vault — premium members-only section with daily deals, price drops, rare finds. Forums, virtual systems showcase, dealer directory. 0-36% APR financing through a partner. Dealer program separate from individual seller program.

What they do well:
The Bluebook is exactly what AVauction.com is building — real transaction data used to create an authoritative pricing reference. It's built their reputation as the authoritative source on high-end audio values. Forums create genuine community and repeat engagement. Virtual Systems feature lets buyers share their complete setups — generates aspirational content. VIP Vault creates a premium tier that drives repeat engagement. Dealer directory separates professional dealers from individual sellers — same as the individual vs business account distinction.

What they don't do: Audiogon is for home audio enthusiasts, not professional AV. Their inventory is turntables, cables, DACs, tube amplifiers — completely different from professional touring and rental gear. No condition grading standard. Design shows age.

Key insight: The Bluebook is the single most important thing to study from Audiogon. They've been doing publicly accessible pricing data for decades. Study how they present it, how they segment by condition, and how they've built credibility around it. The difference is AVauction.com keeps the detailed data dark — the Bluebook is public. The VIP Vault premium section is worth studying as a model for AVauction Pro subscription tier presentation.

---

### CATEGORY 3 — Retail Chains with Used Gear Sections

These are major retailers who sell used gear as a secondary business. They're not direct competitors — they serve a different customer — but they have features worth learning from.

---

**Sweetwater Gear Exchange (sweetwater.com/used)**
Sweetwater is one of the world's largest music technology retailers. Gear Exchange is their peer-to-peer used marketplace launched 2022-2024. Sell for free if you take payment as Sweetwater Gift Card (0% seller fee). 5% seller fee + 2.5% transaction fee for bank/PayPal/Venmo payout. Discounted shipping labels up to 40% off through the platform. Mandatory photos — "the exact item listed." Verified seller badges showing how long they've been a Sweetwater customer. Seller storefronts with custom bio and policies. Make an Offer feature. Handpicked GX Collections curated by staff. Price Drops feed.

What they do well:
The gift card payout incentive is clever — zero seller fees if you take store credit. Drives the seller to spend money with Sweetwater rather than just taking cash. Curated GX Collections are editorial — staff handpick gear for specific use cases. Verified customer badges use Sweetwater's existing customer history as trust signal — sellers who've been Sweetwater customers for 10 years get a badge showing that. Discounted shipping labels integrated directly.

What they don't do: Music gear focused — guitars, pedals, keyboards. Professional AV touring gear is a tiny fraction. No auction. No pricing intelligence. No professional B2B focus.

Key insight: The gift card payout incentive is a model worth considering for AVauction.com. If a seller takes platform credits instead of cash payout — usable toward concierge services, listing promotions, or future transactions — the platform pays zero fees and the seller gets more flexibility. The curated collections editorial approach is strong — "gear our team thinks is exceptional" adds curation value above raw search.

---

**Guitar Center Used (guitarcenter.com/Used)**
America's largest music retailer with 300+ physical locations. Used section shows trade-in and consignment gear. 45-day return policy on used items. Gear is inspected and condition-graded. Can be bought online and shipped or found in local stores.

What they do well: 45-day return policy is industry-leading. Physical inspection and condition grading by staff. Local store inventory searchable online. 300+ locations means buyer can inspect in person if nearby.

What they don't do: General music retail, not professional AV. No auction. No pricing intelligence. Prices tend to be high on used gear relative to market — Guitar Center trade-in values are notoriously low for sellers.

Key insight: The 45-day return policy is significantly more generous than AVauction.com's 72-hour inspection window. For the right categories of gear where condition is hard to assess remotely, a longer return window could be a differentiator. Worth asking Tom what an appropriate inspection window is for different gear categories — a $150,000 LED wall may need longer than 72 hours to fully test.

---

**B&H Photo (bhphotovideo.com)**
New York institution. Massive professional video, photo, audio selection. Used gear section called "Used Department" with condition grades — Excellent, Very Good, Good, Fair — and clear written descriptions of what each means. 30-day return policy on used. In-store pickup available. Staff inspect every item.

What they do well: Standardized condition descriptions with written detail for each grade — not just a letter grade but actual language explaining what "Excellent" means. 30-day return policy on used. Enormous brand trust from 50+ years in professional video and photo. Financing available.

What they don't do: Not a marketplace — they buy trade-ins and resell. Professional AV categories exist but it's not their focus. No auction.

Key insight: B&H's written condition grade descriptions are a strong model for the AVauction.com condition grading standards page. Each grade gets a full paragraph of plain English describing what a buyer can expect. Tom's grade definitions should follow this model — not just a label but a complete description a buyer can rely on.

---

**Adorama (adorama.com)**
Similar to B&H — New York professional photo/video/audio retailer with a used section. Condition grades similar to B&H. Financing available. Trade-in program.

Low differentiation from B&H for AVauction.com analysis purposes.

---

**Long & McQuade GearHunter (long-mcquade.com/GearHunter)**
Canada's largest music retailer with 70+ locations. GearHunter is their online used gear listing system showing trade-in inventory from physical stores. Trade-ins come through stores, get inspected, listed online. 90-day warranty on used gear (negotiable). Decentralized — each store is responsible for listing their own inventory, which means coverage is inconsistent.

What they do well: 90-day warranty on used gear is strong. Physical inspection before listing. Trade-in credit available.

What they don't do: Decentralized store-by-store listing means many items never get online. Canadian market focused. Music retail, not professional AV. No auction. No pricing intelligence. Design is basic.

Key insight: The decentralized listing failure is instructive — if each AVauction.com seller is responsible for listing their own gear accurately, the quality will vary. This is why the admin review step is critical. Every listing gets reviewed before going live.

---

### CATEGORY 4 — International and Niche Dealers

**Gearwise (gearwise.se)**
Swedish used pro AV dealer. Nordic market focus. Clean design. Lighting and audio focused. Small inventory. No marketplace features — dealer only.

Low direct competitive relevance for US market. Worth monitoring for design inspiration — Nordic design aesthetic is clean and minimal.

---

**Saturday Audio (saturdayaudio.com)**
Used and demo high-end home audio. Chicago based. Audiophile market, not professional AV. Trade-in program. Appointment-based showroom.

Not a direct competitor — different market entirely.

---

**Midwest Digital AV (midwestdigitalavinc.com)**
AV integrator with used equipment for sale. Small selection, integrator-focused. Not a marketplace.

Not a direct competitor.

---

**AVL Gear (avlgear.com)**
Used AV, lighting, and live gear retailer. Small Shopify-based site. Limited inventory visible. Not a marketplace.

Not a direct competitor.

---

**Paragon SNS (paragonsns.com)**
Preowned AV specials section. Professional AV integrator with used gear for sale as secondary business. Small selection.

Not a direct competitor.

---

**AV.com (av.com/secondhand)**
Domain authority alone makes this interesting — av.com is a premium domain. Secondhand section. Limited information visible without deeper access.

Worth monitoring as a potential future competitor given the domain strength.

---

### Summary — Extended Competitive Landscape

**The most important findings:**

1. **UsedAVGear.com (Nationwide Video) and Clair Used Gear are potential white glove sellers, not competitors.** The biggest rental houses and production companies in the world are already liquidating gear through their own Shopify sites. AVauction.com's auction format with real buyer competition should generate significantly better prices than their own retail channels. The pitch to these companies: "We'll get you more money than your own site."

2. **Audiogon's Bluebook is the closest existing model for the AVauction Price Index gauge.** They've been publishing real transaction data for decades. Study how they present condition-based pricing and the level of detail they provide per model. The key difference is AVauction.com doesn't publish the underlying data — the gauge is the free sample. The full history stays dark — internal use only.

3. **ChurchGear is a natural buyer channel for AVauction.com's concierge.** Churches spending $75,000+ on a complete system are exactly the concierge buyer. ChurchGear serves the $1,000-$10,000 market. The concierge targets the serious upgrade market.

4. **CUE Sale's real photos commitment and 3-star condition system are worth studying.** "All pictures are made by us" is a strong trust signal. The spare parts sister site is an interesting adjacent product.

5. **Sweetwater Gear Exchange's gift card payout incentive is creative.** Zero seller fees if you take store credit. Worth considering for AVauction.com — sellers who take platform credits toward concierge services or listing promotions pay no payout fees.

6. **B&H's written condition grade descriptions are the right model for Tom's grading definitions.** Not just a letter grade — a full written description of what a buyer can expect at each level.

7. **No one has the auction, pricing intelligence, or concierge.** This holds across all 20 platforms examined. The gap is real and persistent.



---

## Lessons from Competitors and Reference Platforms

What each platform does well that AVauction.com should study, steal, or deliberately do differently. Organized by platform then by theme.

---

### Reverb — The most lessons to learn

**Price Guide — publish historical sold prices publicly**
Reverb publishes every single transaction price in their Price Guide. 240,000+ products with full transaction history, condition-specific price ranges, and a price history graph. They made this public deliberately — transparency builds trust and attracts sellers who want to know what their gear is worth before listing.

AVauction.com's approach is different — the full transaction history stays dark, the AVauction Price Index gauge shows a range. But the gauge needs to feel as authoritative as Reverb's Price Guide does. Study the visual design and the way Reverb surfaces data confidence ("based on 847 recent sales") and replicate that credibility signal without revealing the underlying data.

**Make an Offer — nearly half of Reverb sales start with an offer**
Reverb reports that nearly half of used gear sales begin with an offer, and more than 40% of seller counter-offers result in a sale. This is a significant revenue driver that AVauction.com doesn't currently have for buy-it-now listings.

Consider a phase 2 "Make an Offer" feature for buy-it-now listings where the seller has opted in. Platform mediates the negotiation — no direct contact. Seller sets a floor price below which offers are auto-declined. Could meaningfully increase buy-it-now conversion rates on higher-priced gear where buyers hesitate at the asking price.

**Price Drop feed — automatic notifications when listings drop 10%+**
Reverb automatically surfaces listings to a Price Drops feed whenever a seller drops their price 10% or more. Buyers who follow certain gear get notified. This creates urgency for sellers to price competitively and rewards buyers who are patient.

AVauction.com equivalent: when a seller reduces their buy-it-now asking price, buyers who have that model on their watchlist get an automatic notification. Simple to build, drives re-engagement with the platform.

**Feed / Follow system — personalized marketplace**
Reverb's Feed lets buyers follow specific products, shops, and saved searches. New listings matching their criteria surface automatically. Buyers who use the Feed visit more frequently and buy more.

AVauction.com's saved search alert system covers this. Make sure the alerts feel personal and timely — not generic marketing emails.

**Seller payout speed — ships = gets paid**
After the first sale, Reverb initiates seller payout as soon as a valid tracking number shows the gear is in transit — not waiting for delivery confirmation. This is more seller-friendly than waiting for the full inspection window to close.

AVauction.com uses a 72-hour inspection window before release. Consider whether a partial payout on tracking confirmation is possible — seller gets 50% on ship confirmation, 50% after inspection window. Reduces seller cash flow friction while maintaining buyer protection. Worth discussing with the attorney.

**Safe Shipping — platform-owned insurance product**
Reverb's Safe Shipping is required on all label purchases between $1,500 and $10,000. It's a platform revenue stream (1-3.5% of sale price) that also improves buyer trust. Damage claims are handled by Reverb, not left between buyer and seller.

This is better than just integrating freight insurance from a third party. AVauction.com should own the insurance relationship rather than just referring to a partner. Research whether Stripe or a freight insurance API can be packaged as an AVauction-branded product.

**Seller Hub — dedicated seller analytics dashboard**
Reverb provides a full Seller Hub with analytics on views, offers, sales velocity, and conversion rates per listing. Sellers can see which listings are performing and which are stale.

AVauction.com's seller dashboard should include basic analytics — listing views, watchlist count, Q&A activity, days live, comparable sold prices. Sellers who can see their listings underperforming have a reason to adjust the price or move to auction. That's a natural upsell trigger.

---

### StockX — The most important structural lessons

**Standardized product pages — one page per product, not per listing**
StockX eliminated individual listing pages. Every Air Jordan 1 has one canonical product page regardless of how many sellers are offering it. Buyers see the market, not individual sellers.

AVauction.com already does this with the master equipment database — every ROE BP2V2 has one canonical product page with specs from the database. Individual seller listings are variants of that page, not independent pages. This is the single most important structural decision AVauction.com has already made correctly. Reinforce it — never let a seller override the canonical product specs.

**Sell Now option — accept the highest existing bid instantly**
StockX lets sellers list an Ask, or choose "Sell Now" to immediately accept the current highest bid. For sellers who need cash fast this is compelling — no waiting, instant transaction.

AVauction.com equivalent for buy-it-now: when a seller submits a listing, show them any active buyer demand signals for that model. "3 buyers have saved searches for this model. List it now and it may sell within 24 hours." Not a formal bid/ask system but the same psychological effect.

**Bid/Ask spread visibility — shows market depth**
StockX shows buyers the highest current bid alongside the lowest ask. Buyers can see how far apart supply and demand are. If the spread is narrow, a deal is close. If it's wide, there's negotiation room.

For AVauction.com's auction: showing active bid count and current high bid in real time is the equivalent. Buyers can see how competitive a lot is without seeing who is bidding. Creates urgency when the spread is narrowing.

**Xpress Ship badge — speed as a filter**
StockX gives badges to items available for faster shipping. Buyers can filter for Xpress Ship when they need gear quickly.

AVauction.com equivalent: sellers who commit to shipping within 48 hours get a "Quick Ship" badge on their listings. Buyers on deadline — production companies with a show in 3 days — filter for quick ship sellers. Meaningful differentiator in the professional AV world where timelines are tight.

**Seller performance tiers with fee benefits**
StockX reduces seller fees for high-volume sellers. The more you sell, the lower your commission. This incentivizes the best sellers to stay on the platform exclusively rather than diversifying across marketplaces.

AVauction.com's power seller and enterprise tiers already include volume commission discounts. Make sure the discount structure is clearly communicated — sellers should know exactly what threshold gets them to the next tier and what the benefit is.

---

### GearSource — Operational lessons

**GearMoves — own the shipping relationship**
GearSource built their own internal shipper rather than just connecting to third-party APIs. When a seller declines the shipping estimate, GearSource handles it directly. Owning the shipping relationship means owning the customer experience around one of the most friction-heavy parts of the transaction.

AVauction.com phase 1 uses UPS/FedEx and LTL APIs. Phase 2 consideration: build enough volume with freight partners to negotiate exclusive rates and potentially white-label the shipping experience as "AVauction Freight." Own the relationship, not just the integration.

**NeedZone — reverse listings where buyers post what they need**
GearSource has NeedZone where buyers post what gear they're looking for and sellers respond. This is essentially a buyer's request board.

AVauction.com equivalent: the concierge intake form is the professional version of this. A buyer submits what they need, the platform sources it. But a lightweight public version — "Post a Gear Request" visible to verified sellers — could surface demand that sellers didn't know existed. Worth considering as a phase 2 feature.

**Make an Offer — negotiation without direct contact**
GearSource has a Make an Offer button that lets buyers propose a price without direct seller contact. Same as Reverb. Both major professional AV marketplaces have this.

This is worth adding to AVauction.com's buy-it-now section in phase 2. The platform mediates all negotiation. No contact info exchange. Commission applies to negotiated price same as listed price.

---

### eBay — Auction mechanics lessons

**Auto-relist — unsold items automatically relist**
eBay automatically relists unsold auction items. If it doesn't sell after 8 relists it goes to an unsold archive. This keeps inventory visible without seller action.

AVauction.com equivalent: the auto bump-down to buy-it-now when reserve isn't met is the version of this. An additional option: seller can opt into auto-relist for auction if reserve isn't met rather than bumping to buy-it-now. Some sellers prefer to keep trying at auction rather than sitting in buy-it-now.

**Strategic auction timing**
eBay research shows that listing the same product in consecutive back-to-back auctions reduces prices by 4-5% because buyers know they can wait for the next one. Spacing identical products apart maximizes price.

AVauction.com's staggered closing schedule naturally prevents this — lots close 5 minutes apart. But admin should avoid putting two identical models (same manufacturer, same condition grade) in the same Friday auction. Space them across consecutive weeks to maximize bid competition on each.

**Seller buyer blocking**
eBay lets sellers block specific buyers or set buyer requirements — minimum feedback score, no unpaid item history, etc. Sellers have control over who can bid on their items.

AVauction.com's trust tier system partially covers this — sellers can see buyer trust ratings. Consider allowing sellers to set a minimum buyer trust tier requirement for their auction lots. A rental house selling a $150,000 LED wall doesn't want unverified individual accounts bidding.

**Best Offer — accept, counter, or decline**
eBay's Best Offer lets sellers accept offers, counter with a different price, or decline. The three-way response creates a natural negotiation flow without direct contact.

Worth building into AVauction.com's buy-it-now Make an Offer feature when that gets built in phase 2.

---

### Gearsupply — What not to do

**Direct buyer-seller messaging undermines non-circumvention**
Gearsupply allows direct messaging between buyers and sellers. Their terms say commission is owed even on off-platform transactions, but the messaging feature makes it easy to exchange contact info and transact privately.

AVauction.com's approach — all Q&A through platform, AI contact scanning on every message, seller anonymity until escrow funded — is deliberately the opposite. The friction of not being able to contact the seller directly is a feature, not a bug. It keeps transactions on-platform and protects commission.

**No standardized condition grading**
Gearsupply has no standardized condition system. Sellers describe condition however they want. This creates inconsistency that erodes buyer trust — "excellent" means different things to different sellers.

AVauction.com's A-D grading system with industry-accurate definitions is a direct competitive advantage. Every Grade B listing means the same thing regardless of who the seller is.

---

### Summary — Features to consider adding in phase 2

The following features are proven on comparable platforms and worth building after the core marketplace is running:

- **Make an Offer** on buy-it-now listings — seller opts in, platform mediates, commission applies
- **Price Drop notifications** — automatic alert to watchlisters when asking price drops 10%+
- **Quick Ship badge** — seller commits to 48-hour ship window, appears as a filter
- **NeedZone-style buyer requests** — lightweight public board where buyers post what gear they need
- **Auto-relist option for auction** — alternative to auto bump-down for sellers who prefer to retry at auction
- **Minimum buyer tier requirement** — sellers can require bidders to be verified business or above
- **Partial payout on ship confirmation** — discuss with attorney, reduces seller cash flow friction
- **Platform-owned freight insurance product** — white-label rather than third-party referral



---

## Competitor Shipping and Financing Comparison

How each competitor handles shipping logistics and buyer financing. Both are significant friction points in high-value gear transactions — whoever removes the most friction wins the sale.

---

### GearSource — Most developed shipping integration

**Shipping:**
<cite index="94-1">GearSource has built GearMoves, their own internal shipping service. When a transaction closes, the seller can either accept the platform's shipping estimate and arrange their own shipment, or decline and have GearSource automatically route the order to GearMoves.</cite> They offer instant shipping quotes directly in the shopping cart — one of their platform v4 launch features. Buyers can also choose to arrange their own carrier or pick up from the seller. International shipping is supported with cross-border payment handling built in. If seller arranges their own freight and damage occurs, buyer is responsible for documenting and notifying within 48 hours. GearSource is not responsible for freight damage or loss.

**Financing:**
No publicly documented financing partnership found. GearSource does not appear to offer buyer financing at checkout.

**AVauction.com advantage:**
- Integrated freight insurance at transaction close — removes damage claim friction
- Financing referral banner for purchases over $10,000 — GearSource has nothing here
- Pre-ship photo requirement before label generated — protects against packaging damage claims

---

### Reverb — Most polished shipping and financing experience

**Shipping:**
<cite index="104-1">Reverb offers Safe Shipping — an insurance product purchased alongside a Reverb shipping label that covers lost or damaged gear. Safe Shipping is required on all Reverb label purchases between $1,500 and $10,000. It costs 1-3.5% of the sale price depending on item value and destination.</cite> Reverb generates discounted shipping labels through USPS, UPS, and DHL. They have a shipping label estimator built into the listing creation flow. <cite index="105-1">Quick Shipper badge sellers can offer 2-day shipping, with Reverb reporting up to 25% growth in order volume for sellers who offer free 2-day shipping.</cite> International labels available for items under $2,500.

**Financing:**
<cite index="106-1">Reverb has partnered with Affirm and Klarna to offer buyer financing. Sellers using Reverb Payments can offer financing options — buyers pay via financing, sellers get paid out normally on the standard Reverb Payments timeline.</cite> 0% APR financing is prominently featured in their navigation. This is the most developed financing integration of any competitor.

**What AVauction.com can learn:**
- Safe Shipping is a clean model — optional insurance purchased at label generation, platform handles claims
- Built-in shipping label estimator in the listing flow reduces seller friction
- Financing integrated directly into checkout, not just a referral link, is the gold standard
- 2-day shipping badge creates competitive differentiation among sellers

**AVauction.com advantage on professional AV:**
Reverb's shipping is optimized for guitar-sized items — USPS, UPS, standard parcel. Professional AV gear often exceeds 150 lbs and requires LTL freight. AVauction.com's tiered approach — parcel API under 150 lbs, LTL API over 150 lbs — is better suited to the actual gear being sold.

---

### Gearsupply — Shipping partner model, no financing

**Shipping:**
<cite index="30-1">Gearsupply mentions "reliable shipping partners" as a core part of their value proposition</cite> but does not appear to have integrated shipping label generation or instant quotes built into the platform. Sellers appear to arrange their own shipping. No GearMoves equivalent found. No freight insurance product documented publicly.

**Financing:**
No financing partnership found. Gearsupply does not offer buyer financing.

**AVauction.com advantage:**
Both integrated shipping quotes and financing referral are gaps Gearsupply hasn't filled.

---

### SoundBroker — Manual, seller-arranged

**Shipping:**
Entirely seller-arranged. SoundBroker does not provide shipping labels, freight quotes, or insurance. They offer a VIP Platinum Member shipping service as an add-on but it appears to be an optional bolt-on rather than an integrated platform feature. Buyers and sellers figure out logistics themselves.

**Financing:**
No financing offered.

**AVauction.com advantage:**
Significant. Any shipping integration at all is better than SoundBroker's manual approach.

---

### 10K Used — Integrated shipping for their own inventory, buyer arranges for marketplace

**Shipping:**
<cite index="87-1">For buy-it-now purchases, buyers choose between self-arranged collection or delivery, or paying 10K Used to arrange delivery including shipping, insurance, and duties.</cite> Payment of a 3.3% Stripe transaction fee applies. For auction purchases, buyers are responsible for all collection and shipping costs. Items must be collected within 14 days or storage fees apply.

**Financing:**
No financing offered.

**AVauction.com advantage:**
10K Used is UK-based and their model assumes buyers can physically collect gear or arrange freight themselves. The integrated freight quote and label generation at transaction close is a meaningful differentiator for US professional AV buyers who are not near the seller.

---

### Summary — Shipping and Financing Competitive Gaps

| Platform | Integrated Shipping | Freight Insurance | Financing |
|---|---|---|---|
| GearSource | ✓ GearMoves internal shipper | ✗ not documented | ✗ |
| Reverb | ✓ Label generation + Safe Shipping | ✓ 1-3.5% of sale | ✓ Affirm + Klarna |
| Gearsupply | ✗ Shipping partners only | ✗ | ✗ |
| SoundBroker | ✗ Manual | ✗ | ✗ |
| 10K Used | Partial — their inventory only | ✗ | ✗ |
| **AVauction.com** | **✓ Parcel API + LTL API** | **✓ Integrated at close** | **✓ Referral banner** |

Reverb is the only competitor with a fully developed shipping and financing experience. Their model is the right reference point — but their shipping is optimized for musical instruments, not professional AV freight. AVauction.com's tiered approach to shipping handles the actual weight and size of professional AV gear in a way Reverb's parcel-first model doesn't.

No professional AV competitor offers buyer financing. The financing referral banner at checkout for purchases over $10,000 is a genuine differentiator in this market.



---

## Competitor Legal and Buyer Protection Comparison

A detailed look at how each competitor handles escrow, buyer protection, dispute resolution, inspection windows, and liability. This research informs AVauction.com's own legal framework — where to match the industry standard and where to do better.

---

### GearSource — Most developed legal framework

**Inspection window:** 48 hours (2 business days) from confirmed delivery. Buyer must report issues in writing within this window.

**Escrow / payment protection:** GearSource operates their own payments system called GearSource Payments. Funds held until inspection window closes. They call their buyer protection program the "GearSource Buyer GEARantee."

**Dispute resolution:** Has a dedicated Conflict Resolution Team at conflicts@gearsource.com. Process is:
1. Buyer contacts Conflict Resolution Team in good faith
2. Team reviews sale and all communications
3. If unresolved, buyer must give 10 business days written notice before filing lawsuit or arbitration
4. Platform can approve refund directly to buyer if no other resolution possible

**Chargeback policy:** If buyer initiates chargeback, seller is responsible for the full disputed amount plus fees within 5 days. All funds stay in seller's GearSource Payments account until settled. Chargebacks can take up to 3 months to resolve.

**Platform liability:** Standard disclaimer — GearSource is not liable for outcomes of disputes between buyers and sellers. They facilitate but do not guarantee.

**Non-circumvention:** Implied through their payments system — transactions outside the platform are not covered by the GEARantee.

**What AVauction.com does better:**
- 72-hour inspection window vs GearSource's 48 hours — more time for buyers to properly test professional gear
- Stripe Connect escrow is a licensed, regulated payment processor vs GearSource's proprietary system
- Dispute freeze — one-click hold on any payout — more responsive than GearSource's email-based process
- Explicit non-circumvention clause with penalties in seller agreement

---

### Gearsupply — Thinner legal protection, direct buyer-seller contact risk

**Inspection window:** Not clearly specified in public terms.

**Escrow / payment protection:** Claims "safe and quick payment process" but specifics are thin in public-facing terms. Allows direct buyer-seller communication which creates circumvention risk — they explicitly charge commission on transactions completed outside the platform even if the connection was made through Gearsupply.

**Dispute resolution:** Customer service focused. No dedicated conflict resolution process documented publicly.

**Non-circumvention:** Explicitly stated — sellers liable for fees even if sale finalized outside the platform. However their own direct messaging feature undermines this by making it easy to transact off-platform.

**Platform liability:** Standard disclaimer — "as is" basis, no warranties.

**What AVauction.com does better:**
- No direct buyer-seller contact at all — Q&A only through platform, AI contact scanning on all messages
- Explicit 72-hour inspection escrow window
- Formal dispute resolution process
- Seller anonymity until escrow funded eliminates the circumvention temptation entirely

---

### SoundBroker — Oldest, most manual process

**Inspection window:** 2 calendar days from delivery. Buyer must contact seller in writing within this window. Does not count Saturday, Sunday, or government holidays.

**Escrow / payment protection:** SoundBroker holds payment and releases to seller within 2 business days after buyer accepts without exception. For their Direct To Buyer (D2B) program, seller is paid in advance of shipping — no escrow, buyer takes all the risk.

**Dispute resolution:** Buyer contacts seller directly or through SoundBroker within the 2-day window. No formal conflict resolution team documented. Seller submits W-9 and invoice to receive payment.

**Non-circumvention:** Not clearly documented publicly.

**Platform liability:** Standard disclaimer.

**What AVauction.com does better:**
- Everything. SoundBroker's process is essentially manual escrow with email-based dispute resolution. No automation, no formal process, no chargeback protection documented.
- The D2B program where buyers pay before inspection is a significant buyer risk that AVauction.com explicitly avoids.

---

### 10K Used — As-is, buyer beware

**Inspection window:** None for auction purchases. All items sold "as is, where is." Buyer must inspect before bidding. No claims entertained for discrepancies after purchase.

**Escrow / payment protection:** Payment due within 24 hours of invoice. No escrow — ownership transfers only upon full receipt of payment, buyer assumes risk immediately on payment.

**Dispute resolution:** None documented for auction purchases. Buyers told to inspect before bidding.

**Non-circumvention:** Explicitly stated — £1,000 liquidated damages per breach plus commission owed.

**Platform liability:** 10K Used liability capped at the amount paid by buyer for the item. No warranties expressed or implied.

**What AVauction.com does better:**
- Everything on buyer protection. 10K Used's auction terms are pure buyer beware — no inspection window, no escrow, no dispute process.
- This is actually a meaningful competitive advantage on the auction side. Professional buyers spending $50,000+ on gear need more protection than 10K Used offers.

---

### The competitive legal landscape — Summary

The industry standard for buyer protection is thin. GearSource has the most developed framework with their GEARantee and Conflict Resolution Team, but even they rely on email-based dispute resolution and a proprietary payments system that isn't a regulated escrow.

SoundBroker is manual. 10K Used's auction terms are pure as-is. Gearsupply's direct messaging undermines their own non-circumvention clause.

**AVauction.com's legal advantages:**

1. **72-hour inspection window** vs industry standard of 48 hours or nothing — more time to properly test professional gear
2. **Stripe Connect regulated escrow** — a licensed, audited payment processor holds funds, not a proprietary in-house system
3. **Dispute freeze** — one-click payout hold, not an email to a conflict resolution team
4. **No direct buyer-seller contact** — AI contact scanning eliminates the circumvention temptation before it starts
5. **Seller anonymity** — platform-assigned usernames until escrow funded
6. **Explicit non-circumvention with clear penalties** — documented in the seller agreement from day one
7. **Formal fulfillment strike system** — documented, automated, transparent
8. **Bidirectional reviews** — sellers can review buyers too, creating mutual accountability

**What to flag for the attorney — MASTER LIST. Sean owns this, not Tom.**

⚠️ Tom cannot sign agreements or represent AVauction to third parties — see Tom's Anonymity hard constraint. All attorney contact runs through Sean. Questions #7–#9 are declared in later sections and are consolidated here.

**All ten must be resolved before Stripe goes live (week 10 target).**

1. Non-circumvention clause language and enforceability
2. Escrow release trigger definition — exactly when does the 72-hour window start and end
3. Dispute freeze authority — what gives the platform the right to hold funds and for how long
4. Seller suspension procedures — due process requirements before account termination
5. Chargeback liability allocation between platform and seller
6. **Non-circumvention penalty amount** — a specific liquidated-damages figure per breach that will hold up in court. **Two competitor benchmarks now on file:** GearSource stipulates £1,000 per breach plus commission owed; Joseph Finn Co. (Finn/AVGear auctions) uses a payment-default liquidated-damages formula of *the lesser of 20% of invoice or the resale shortfall plus re-marketing costs*, charged to a card authorized at registration. Ours needs a dollar figure, not a placeholder — bring both benchmarks.
7. INFORM Consumers Act disclosure vs the anonymity-until-escrow model — see the INFORM section
8. 1099-K filing obligation under separate charges and transfers — Stripe or platform
9. Buyer default penalty amount — see the Buyer Default Policy section. Benchmark: Finn's 20%-or-resale-shortfall formula above, plus their mechanism of getting explicit card-on-file authorization at registration to charge damages later — worth asking whether our Stripe setup can replicate that consent step cleanly.
10. **Third-party auction-results data — can we use it at all?** Joseph Finn's bidding platform (`auctions.josephfinn.com`) blocks automated access via robots.txt AND its registration terms (Website Usage §d.iv) prohibit copying/reproducing/reusing site information "with the intent of commercially [exploiting]" their services. SoldTiger similarly gates and monetizes its own results. **Question: is there any lawful path to using publicly-viewable auction hammer prices from houses whose terms forbid commercial reuse — and if not, what is the clean alternative for realized-price comps?** This currently blocks the entire auction-sold data tier. See Data Source Status.



---

## Domain and Hosting
- **Domain:** avauction.com (Porkbun, DNS → Vercel)
- **Hosting:** Vercel (landing page live)
- **GitHub:** github.com/SELLGEAR/avauction
- **Deployment:** Push to main → auto-deploys

---

## Open Loose Ends — Aug 17, 2026

Short-list from the Aug 16, 2026 auction-timing-model session. Not full spec, just the things that must not get forgotten.

1. **Apply migration `0030_auction_schedule_settings.sql`** — written but not yet run against any database. Confirm it targets the dev database before applying, not production.
2. **Add `.reverb-token` and the scraper JSON dumps (`avgear-*.json`, `reverb-*.json`, etc.) to `.gitignore`.** `.reverb-token` is a credential and must never be committed — see Security, "GitHub Repository."
3. **Investigate the 36-line uncommitted change in `lib/auction/types.ts`.** Predates the Aug 16 session, origin unknown — decide keep or discard.
4. **The listing detail page is the next build** (`design/auction-detail.html` needs a redraw first — see Auction Countdown Timer / status-driven listing page). It needs a `GET /api/listings/[id]` endpoint that doesn't exist yet.
5. **TBD with Tom:** the new all-week bidding model removes the Monday-reveal / Friday-open early-browse window entirely — buyers no longer get advance notice of what's coming before it's biddable. Decide whether that's fine or whether some early-look mechanism belongs back in (separate from the whale early-access preview, which is future scope — see Auction Format).
6. **Auction operations admin dashboard — not built, not needed before launch.** Schedule or skip weeks, assign approved lots to a week's drop, monitor the live Friday auction, pull a lot mid-auction. Needed before *regular weekly operation*, but early auctions can be run manually: "skip a week" simply means not assigning lots to that Monday's drop, and timing settings are adjusted directly in `pricing_engine_settings` (see Auction Format). Build the dashboard once manual operation becomes the bottleneck, not before.

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

## Scraping — Two Phase Approach

**Phase A — Seeding: ✅ COMPLETE**
All 7 seeding scrapers have finished their first full pass. `master_equipment` now holds **268,048 unique products**.

- **AV-iQ: COMPLETE at 239,661 records** — 99.1% success rate. The scraper terminated cleanly after its retry pass, which recovered 16 records and left 2,141 permanently failing. Those 2,141 are non-critical: malformed URLs with special characters, non-AV items that don't belong in the catalog anyway (camera lenses, window blinds), and a handful of source-side HTTP 500s. **No further AV-iQ passes are needed.**
- GearSource, Gearsupply, SoundBroker, AVGear, UsedAVGear, Clair Used Gear — all run, all deduplicated cross-source via `product_key`.

**Note on the catalog estimate:** the working figure was ~270k AV-iQ records. The confirmed catalog size is ~240k. Use **239,661** for all planning — coverage math, SEO page counts, match-rate projections. Do not use the old estimate.

Phase B now matches against the full reference database.

**Phase B — Price scraping (after seeding is solid, ~1-2 weeks):**
All sources scrape pricing data. ⚠️ **Source availability was materially revised in July 2026 — read the eBay API section and the sold_verified definition before building any scraper.**

- eBay — Browse API, **asking prices only**
- Reverb — unverified, depends on `/api/price_guides`
- 🔶 **SoundBroker `soundbroker.com/sold/` requires VIP-Loyalty membership ($100/yr) — and "sold price information" is an explicitly advertised membership benefit.** Both the Seller's Agreement and the membership page have been read in full: no anti-scraping, automated-access, or commercial-use restrictions exist in either — only a liability disclaimer. Remaining unknowns: possible additional terms at checkout, account-termination risk on bulk access, competitor-relations optics. **First step is not legal — it's a $100 membership and a manual look at what the archive actually contains.**
- Auction sold results — see the sold_verified definition for per-source status

Higher match rate because master_equipment is already comprehensive.

**Why two phases:**
Match rate on any scraped pricing record depends on master_equipment being populated first. A listing for a Brompton Tessera that has no master_equipment record gets discarded or queued. Running pricing scrapers before seeding is complete wastes data.

**Start phase B when:**
✅ **This condition is now MET.** AV-iQ is complete and all Tier 1 dealer scrapers have run. Phase B is unblocked and is the next backend session.

Prerequisites for that session: eBay Production API keys (App ID, Dev ID, Cert ID) and a Reverb personal access token.

---


---

## Scheduled Scraping — Weekly Re-Seeding

The seeding scrapers currently run once manually and stop. For ongoing database growth they need to run on a schedule to pick up new products added to source sites since the last run.

**When to add this:** After the initial seeding pass completes (all 7 scrapers finish their first full run). Probably session 4 or 5.

**How it works:**
- Vercel cron jobs trigger each scraper on a weekly schedule
- The scrapers already handle deduplication via product_key — re-running never creates duplicates, only picks up new products
- AV-iQ monthly sync is separate — runs on the 1st of each month, new products only
- The scrape_log table tracks every URL already visited so re-runs skip processed pages automatically

**Proposed schedule:**
- AV-iQ — 1st of each month (new products only, manufacturers added since last run)
- GearSource, Gearsupply, SoundBroker, UsedAVGear, Clair Used Gear — weekly, Sunday 2am ET
- AVGear — weekly, Sunday 2am ET

**Implementation:**
Vercel cron jobs in `vercel.json` trigger a Next.js API route that spawns each scraper process. All scrapers already support being run non-interactively. This is roughly 30 minutes of Claude Code work once the Next.js app exists.

**Phase B pricing scrapers also run weekly:**
Once phase B price scraping is built, those scrapers run on the same weekly schedule — picking up new listings and sold prices since the last run. eBay and Reverb APIs support date-filtered queries so only new records are fetched each week, not the full history.

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

## Phase B Pricing Scrapers — Staging-and-Review Workflow

**This overrides any earlier text in this document that describes pricing scrapers writing straight into `market_prices`.**

Phase B scrapers — whichever sources survive verification — write to **`market_prices_staging`**, NOT directly to `market_prices`. The first run is reviewed before any record is promoted.

**Each staging record captures:**
- Raw source data — original listing title, price, URL, sold date
- Match confidence score
- Matched `product_key`

**Auto-flag traps for review:**
- Quantity / lot listings — title contains "lot", "(10)", "bulk", or similar
- Parts and broken units — "for parts", "not working", "as-is"

**Promotion is manual.** Moving records from `market_prices_staging` → `market_prices` is a deliberate query or admin action. Never automatic, never on a cron, never as a side effect of the scrape.

**When this relaxes:** after first-run match quality is validated and the confidence thresholds are tuned, Phase B may switch to direct writes. Until that validation happens, staging is mandatory.

**Why:** a bad match rate silently poisoning `market_prices` would corrupt the Price Index gauge and the trading desk signal at the same time — the two things the entire business rests on. Garbage in the pricing table is far more expensive than a manual review step.

---

## Phase B Pricing Scrapers — Location Data

When building the Phase B pricing scrapers, capture seller location on every price record.

**These fields go on `market_prices_staging` as well as `market_prices`** — see the Staging-and-Review Workflow section above. Location is captured at scrape time and carried through on promotion; it cannot be backfilled later because the source listing may be gone.

**Fields to add to both tables:**
- `seller_location_city` — text
- `seller_location_state` — text (2-letter abbreviation)
- `seller_location_zip` — text where available

**Why this matters:**
The trading desk use case goes beyond knowing what gear is worth — it becomes knowing where underpriced gear physically is. A Yamaha CL5 listed at $7,500 when the market says $9,400 is interesting. A CL5 listed at $7,500 within driving distance is a same-day pickup opportunity.

**The trading desk query this enables:**
- Find gear priced 15%+ below market median
- Within X miles of trading desk location
- Grade A/B/C (Excellent/Very Good/Good) — never Poor/For Parts, which has no reliable market value
- In target categories (LED walls, line arrays, consoles)

This turns the pricing engine into a geographic deal finder, not just a price signal. The data costs almost nothing extra to collect — eBay returns itemLocation on every listing, Reverb returns seller location in the shipping object.

**Implementation note:**
Add seller_location_state and seller_location_city to both `market_prices_staging` and `market_prices` in the Phase B migration. Zip code where available from the source. Do not attempt to geocode — state and city are sufficient for the trading desk proximity filter.


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
