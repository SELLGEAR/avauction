// Verification harness for the proxy bidding engine (migration 0015).
//
// Creates throwaway test data (users, seller, master_equipment record,
// auction listing), runs bid scenarios against the real place_bid()
// function, asserts the invariants, and deletes everything it created —
// win or lose. Run with: npx tsx scripts/simulate-auction.ts
//
// Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + BID_ENCRYPTION_KEY
// in .env.local. Test rows are namespaced with ZZTEST_ so a crashed run
// is easy to find and remove by hand.

import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const bidKey = process.env.BID_ENCRYPTION_KEY;
if (!url || !key) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
if (!bidKey) throw new Error("BID_ENCRYPTION_KEY missing — add it to .env.local");

const db = createClient(url, key, { auth: { persistSession: false } });

let failures = 0;
function check(name: string, cond: boolean, detail?: unknown) {
  if (cond) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.error(`  FAIL  ${name}`, detail ?? "");
  }
}

async function bid(listingId: string, bidderId: string, maxBid: number) {
  const { data, error } = await db.rpc("place_bid", {
    p_listing_id: listingId,
    p_bidder_id: bidderId,
    p_max_bid: maxBid,
    p_key: bidKey,
  });
  if (error) throw new Error(`place_bid rpc failed: ${error.message}`);
  return data as Record<string, any>;
}

async function currentListing(listingId: string) {
  const { data } = await db
    .from("listings")
    .select("current_bid, bid_count, auction_end")
    .eq("id", listingId)
    .single();
  return data!;
}

async function main() {
  const created = {
    authUserIds: [] as string[],
    sellerId: "",
    equipmentId: "",
    listingId: "",
  };

  try {
    // ---- Setup ----------------------------------------------------------
    console.log("Setting up test data (ZZTEST_)...");
    const emails = ["zztest_a", "zztest_b", "zztest_c"].map(
      (n) => `${n}_${Date.now()}@example.com`
    );
    for (const email of emails) {
      const { data, error } = await db.auth.admin.createUser({
        email,
        email_confirm: true,
      });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      const { error: uErr } = await db
        .from("users")
        .insert({ id: data.user.id, email, role: "buyer" });
      if (uErr) throw uErr;
    }
    const [alice, bob, carol] = created.authUserIds;

    // Seller identity for the listing (Alice doubles as seller; she won't bid)
    const { data: seller, error: sErr } = await db
      .from("sellers")
      .insert({ user_id: alice, business_name: "ZZTEST_SELLER", account_type: "business" })
      .select("id")
      .single();
    if (sErr) throw sErr;
    created.sellerId = seller.id;

    const { data: equip, error: eErr } = await db
      .from("master_equipment")
      .insert({
        manufacturer: "ZZTEST_MFG",
        model: `SIM-${Date.now()}`,
        category: "audio",
        status: "approved",
        source: "av_iq",
      })
      .select("id")
      .single();
    if (eErr) throw eErr;
    created.equipmentId = equip.id;

    const { data: listing, error: lErr } = await db
      .from("listings")
      .insert({
        seller_id: created.sellerId,
        master_equipment_id: created.equipmentId,
        title: "ZZTEST_LOT",
        zip_code: "00000",
        listing_type: "auction",
        status: "active",
        reserve_price: 900,
        auction_start: new Date(Date.now() - 60_000).toISOString(),
        auction_end: new Date(Date.now() + 60 * 60_000).toISOString(),
        known_issues: "test lot",
      })
      .select("id")
      .single();
    if (lErr) throw lErr;
    created.listingId = listing.id;
    const lot = created.listingId;

    // ---- Scenario 1: opening bid ---------------------------------------
    console.log("\nScenario 1 — opening bid");
    const r1 = await bid(lot, bob, 500);
    check("first bid accepted", r1.accepted === true, r1);
    check("opens at opening minimum (25)", r1.current_bid === 25, r1);
    const r1b = await bid(lot, carol, 10);
    check("below-increment bid rejected", r1b.accepted === false && r1b.error === "bid_too_low", r1b);

    // ---- Scenario 2: proxy battle — challenger loses to higher ceiling -
    console.log("\nScenario 2 — proxy defense");
    const r2 = await bid(lot, carol, 300);
    check("challenger not high bidder", r2.accepted === true && r2.is_high_bidder === false, r2);
    // Bob's proxy (500) defends: display = min(300 + 25, 500) = 325
    check("display = challenger max + increment", r2.current_bid === 325, r2);

    // ---- Scenario 3: challenger overtakes ------------------------------
    console.log("\nScenario 3 — challenger overtakes");
    const r3 = await bid(lot, carol, 1000);
    check("challenger becomes high bidder", r3.accepted === true && r3.is_high_bidder === true, r3);
    // Bob's 500 beaten: display = min(500 + 25(<500 bracket? 500 is boundary -> 50), 1000)
    check("display = incumbent max + its increment", r3.current_bid === 550, r3);
    check("reserve not met below 900", r3.reserve_met === false, r3);

    // ---- Scenario 4: tie goes to earlier ceiling -----------------------
    console.log("\nScenario 4 — tie favors incumbent");
    const r4 = await bid(lot, bob, 1000);
    check("tying challenger is outbid", r4.accepted === true && r4.is_high_bidder === false, r4);
    check("display capped at shared ceiling", r4.current_bid === 1000, r4);
    check("reserve met at 1000", r4.reserve_met === true, r4);

    // ---- Scenario 5: self-raise doesn't move the price -----------------
    console.log("\nScenario 5 — self-raise");
    const r5 = await bid(lot, carol, 2000);
    check("ceiling raise accepted", r5.accepted === true, r5);
    check("visible bid unchanged", r5.current_bid === 1000, r5);
    const r5b = await bid(lot, carol, 1500);
    check("lowering own ceiling rejected", r5b.accepted === false && r5b.error === "ceiling_not_raised", r5b);

    // ---- Scenario 6: concurrent burst ----------------------------------
    console.log("\nScenario 6 — 10 concurrent bids");
    const before = await currentListing(lot);
    const burst = await Promise.all(
      Array.from({ length: 10 }, (_, i) => bid(lot, bob, 2100 + i * 100))
    );
    const accepted = burst.filter((r) => r.accepted).length;
    const after = await currentListing(lot);
    const { count: rowCount } = await db
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", lot);
    check("at least one burst bid accepted", accepted >= 1, burst.map((r) => r.error ?? "ok"));
    check(
      "bid_count matches actual rows (no lost updates)",
      after.bid_count === rowCount,
      { bid_count: after.bid_count, rows: rowCount }
    );
    check("price monotonically increased", (after.current_bid ?? 0) >= (before.current_bid ?? 0), after);
    const { count: highCount } = await db
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", lot)
      .eq("is_current_high", true);
    check("exactly one current-high row", highCount === 1, { highCount });

    // ---- Scenario 7: auto-extend ---------------------------------------
    console.log("\nScenario 7 — auto-extend");
    const soon = new Date(Date.now() + 2 * 60_000).toISOString();
    await db.from("listings").update({ auction_end: soon }).eq("id", lot);
    const r7 = await bid(lot, bob, 50_000);
    check("late bid triggers extension", r7.accepted === true && r7.extended === true, r7);
    const after7 = await currentListing(lot);
    check(
      "auction_end pushed out ~5 minutes",
      new Date(after7.auction_end).getTime() - new Date(soon).getTime() === 5 * 60_000,
      { was: soon, now: after7.auction_end }
    );

    // ---- Scenario 8: closed auction rejects ----------------------------
    console.log("\nScenario 8 — closed auction");
    await db
      .from("listings")
      .update({ auction_end: new Date(Date.now() - 1000).toISOString() })
      .eq("id", lot);
    const r8 = await bid(lot, carol, 60_000);
    check("bid after close rejected", r8.accepted === false && r8.error === "auction_closed", r8);
  } finally {
    // ---- Cleanup (FK order) --------------------------------------------
    console.log("\nCleaning up test data...");
    if (created.listingId) {
      await db.from("bids").delete().eq("listing_id", created.listingId);
      await db.from("listings").delete().eq("id", created.listingId);
    }
    if (created.equipmentId) await db.from("master_equipment").delete().eq("id", created.equipmentId);
    if (created.sellerId) await db.from("sellers").delete().eq("id", created.sellerId);
    for (const id of created.authUserIds) {
      await db.from("users").delete().eq("id", id);
      await db.auth.admin.deleteUser(id);
    }
  }

  console.log(failures === 0 ? "\nALL SCENARIOS PASSED" : `\n${failures} CHECK(S) FAILED`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error("simulation crashed:", e);
  process.exit(1);
});
