# Data Sources & Scraping

> **Part of the AVauction.com CLAUDE.md documentation system.** Core build context — product, architecture, auction model, schema, current state — lives in `CLAUDE.md`. This file holds the data-source status ledger, per-source acquisition research (AVGear, Reverb, etc.), the clean-source checklist, and the scraping/re-seeding workflow. Read it when your task touches this area; otherwise the core file is enough. If anything here conflicts with a decision in `CLAUDE.md`, the core file wins.

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

