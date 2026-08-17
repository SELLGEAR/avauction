# Competitor Research & Reference

> **Part of the AVauction.com CLAUDE.md documentation system.** Core build context — product, architecture, auction model, schema, current state — lives in `CLAUDE.md`. This file holds the full competitor profiles, threat analysis, competitive positioning, and design/feature inspiration drawn from other platforms. Read it when your task touches this area; otherwise the core file is enough. If anything here conflicts with a decision in `CLAUDE.md`, the core file wins.

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

