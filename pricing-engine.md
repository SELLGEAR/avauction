# Pricing Intelligence & Gauge

> **Part of the AVauction.com CLAUDE.md documentation system.** Core build context — product, architecture, auction model, schema, current state — lives in `CLAUDE.md`. This file holds the pricing engine design — weighting model, confidence classes, gauge governance, grade floor, and the LLM-in-pricing-engine design note. Read it when your task touches this area; otherwise the core file is enough. If anything here conflicts with a decision in `CLAUDE.md`, the core file wins.

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

