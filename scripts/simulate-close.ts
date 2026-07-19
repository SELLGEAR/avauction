// Verification harness for auction close (migration 0018).
//
// Creates five ZZTEST_ lots covering every close outcome, runs the sweep,
// asserts the results, and deletes everything it created — win or lose.
// Run with: npx tsx scripts/simulate-close.ts
//
// Lot A: two bidders, reserve met            -> sold + transaction
// Lot B: one bid, reserve far above          -> bumped to buy-it-now
// Lot C: no bids, no asking price            -> expired
// Lot D: has bid, not due for an hour        -> untouched by sweep
// Lot E: no bids, has asking price           -> bumped to buy-it-now

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
  const r = data as Record<string, any>;
  if (!r.accepted) throw new Error(`test bid rejected: ${r.error}`);
  return r;
}

async function main() {
  const created = {
    authUserIds: [] as string[],
    sellerId: "",
    equipmentId: "",
    listingIds: [] as string[],
  };

  try {
    // ---- Setup ----------------------------------------------------------
    console.log("Setting up test data (ZZTEST_)...");
    const emails = ["zztest_seller", "zztest_win", "zztest_lose"].map(
      (n) => `${n}_${Date.now()}@example.com`
    );
    for (const email of emails) {
      const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true });
      if (error) throw error;
      created.authUserIds.push(data.user.id);
      const { error: uErr } = await db.from("users").upsert({ id: data.user.id, email, role: "buyer" });
      if (uErr) throw uErr;
    }
    const [sellerUser, winner, loser] = created.authUserIds;

    const { data: seller, error: sErr } = await db
      .from("sellers")
      .insert({ user_id: sellerUser, business_name: "ZZTEST_SELLER", account_type: "business" })
      .select("id")
      .single();
    if (sErr) throw sErr;
    created.sellerId = seller.id;

    const { data: equip, error: eErr } = await db
      .from("master_equipment")
      .insert({
        manufacturer: "ZZTEST_MFG",
        model: `CLOSE-${Date.now()}`,
        category: "audio",
        status: "approved",
        source: "av_iq",
      })
      .select("id")
      .single();
    if (eErr) throw eErr;
    created.equipmentId = equip.id;

    // Lots end +10 min (outside the 5-min auto-extend window) so test bids
    // don't extend them; after bidding we force auction_end into the past.
    const in10min = new Date(Date.now() + 10 * 60_000).toISOString();
    const in1hour = new Date(Date.now() + 60 * 60_000).toISOString();
    const started = new Date(Date.now() - 60_000).toISOString();

    async function makeLot(name: string, opts: Record<string, unknown>) {
      const { data, error } = await db
        .from("listings")
        .insert({
          seller_id: created.sellerId,
          master_equipment_id: created.equipmentId,
          title: name,
          zip_code: "00000",
          listing_type: "auction",
          status: "active",
          condition_grade: "B",
          auction_start: started,
          auction_end: in10min,
          known_issues: "test lot",
          ...opts,
        })
        .select("id")
        .single();
      if (error) throw error;
      created.listingIds.push(data.id);
      return data.id as string;
    }

    const lotA = await makeLot("ZZTEST_LOT_A", { reserve_price: 100 });
    const lotB = await makeLot("ZZTEST_LOT_B", { reserve_price: 5000, asking_price: 4000 });
    const lotC = await makeLot("ZZTEST_LOT_C", {});
    const lotD = await makeLot("ZZTEST_LOT_D", { auction_end: in1hour });
    const lotE = await makeLot("ZZTEST_LOT_E", { asking_price: 1500 });

    // Bids: A gets a two-way battle past its reserve; B a lone low bid;
    // D a bid that must survive the sweep untouched
    await bid(lotA, winner, 500);
    await bid(lotA, loser, 300); // winner's proxy defends at 325 >= reserve 100
    await bid(lotB, loser, 200); // display 25, far below reserve 5000
    await bid(lotD, winner, 800);

    // Force due lots' close time into the past
    const past = new Date(Date.now() - 1000).toISOString();
    for (const lot of [lotA, lotB, lotC, lotE]) {
      await db.from("listings").update({ auction_end: past }).eq("id", lot);
    }

    // ---- Run the sweep --------------------------------------------------
    console.log("\nRunning close_due_auction_lots sweep...");
    const { data: sweep, error: swErr } = await db.rpc("close_due_auction_lots", { p_limit: 50 });
    if (swErr) throw swErr;
    const s = sweep as { processed: number; results: Record<string, any>[] };
    const byLot = Object.fromEntries(s.results.map((r) => [r.listing_id, r]));

    check("sweep processed exactly the 4 due lots", s.processed === 4, s);

    // ---- Lot A: sold ----------------------------------------------------
    console.log("\nLot A — reserve met, sold");
    check("outcome sold", byLot[lotA]?.outcome === "sold", byLot[lotA]);
    check("winner is high bidder", byLot[lotA]?.winner_id === winner, byLot[lotA]);
    check("final price 325", Number(byLot[lotA]?.final_price) === 325, byLot[lotA]);
    const { data: la } = await db.from("listings").select("status").eq("id", lotA).single();
    check("listing status sold", la?.status === "sold", la);
    const { data: tx } = await db
      .from("transactions")
      .select("*")
      .eq("listing_id", lotA)
      .single();
    check("transaction created", !!tx, tx);
    check("transaction pending_payment", tx?.status === "pending_payment", tx);
    check("commission 10% = 32.50", Number(tx?.commission_amount) === 32.5, tx);
    check(
      "denormalized capture (mfr/model/grade/type/zip)",
      tx?.manufacturer === "ZZTEST_MFG" &&
        tx?.condition_grade === "B" &&
        tx?.listing_type === "auction" &&
        tx?.zip_code === "00000",
      tx
    );
    check("buyer recorded", tx?.buyer_id === winner, tx);

    // ---- Lot B: reserve not met, bumped ---------------------------------
    console.log("\nLot B — reserve not met, bumped to buy-it-now");
    check("outcome reserve_not_met", byLot[lotB]?.outcome === "reserve_not_met", byLot[lotB]);
    const { data: lb } = await db
      .from("listings")
      .select("listing_type, status, asking_price, current_bid, auction_end")
      .eq("id", lotB)
      .single();
    check("now buy_it_now and active", lb?.listing_type === "buy_it_now" && lb?.status === "active", lb);
    check("asking price preserved at 4000", Number(lb?.asking_price) === 4000, lb);
    check("current_bid cleared", lb?.current_bid === null, lb);
    const { count: bHigh } = await db
      .from("bids")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", lotB)
      .eq("is_current_high", true);
    check("high-bid flag cleared", bHigh === 0, { bHigh });
    const { count: bTx } = await db
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("listing_id", lotB);
    check("no transaction created", bTx === 0, { bTx });

    // ---- Lot C: expired -------------------------------------------------
    console.log("\nLot C — no bids, no asking price");
    check("outcome expired", byLot[lotC]?.outcome === "expired", byLot[lotC]);
    const { data: lc } = await db.from("listings").select("status").eq("id", lotC).single();
    check("listing status expired", lc?.status === "expired", lc);

    // ---- Lot D: not due, untouched --------------------------------------
    console.log("\nLot D — not due, must be untouched");
    check("not in sweep results", byLot[lotD] === undefined, byLot[lotD]);
    const { data: ld } = await db
      .from("listings")
      .select("listing_type, status, current_bid")
      .eq("id", lotD)
      .single();
    check(
      "still an active auction with its bid",
      ld?.listing_type === "auction" && ld?.status === "active" && Number(ld?.current_bid) === 25,
      ld
    );

    // ---- Lot E: no bids but asking price, bumped ------------------------
    console.log("\nLot E — no bids, has asking price");
    check("outcome reserve_not_met (bump)", byLot[lotE]?.outcome === "reserve_not_met", byLot[lotE]);
    check("had_bids false", byLot[lotE]?.had_bids === false, byLot[lotE]);
    const { data: le } = await db
      .from("listings")
      .select("listing_type, status, asking_price")
      .eq("id", lotE)
      .single();
    check("now buy_it_now at 1500", le?.listing_type === "buy_it_now" && Number(le?.asking_price) === 1500, le);

    // ---- Idempotence ----------------------------------------------------
    console.log("\nSecond sweep — must be a no-op");
    const { data: sweep2, error: sw2Err } = await db.rpc("close_due_auction_lots", { p_limit: 50 });
    if (sw2Err) throw sw2Err;
    check("second sweep processes nothing", (sweep2 as any).processed === 0, sweep2);
  } finally {
    // ---- Cleanup (FK order) --------------------------------------------
    console.log("\nCleaning up test data...");
    for (const lot of created.listingIds) {
      await db.from("transactions").delete().eq("listing_id", lot);
      await db.from("bids").delete().eq("listing_id", lot);
      await db.from("listings").delete().eq("id", lot);
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
