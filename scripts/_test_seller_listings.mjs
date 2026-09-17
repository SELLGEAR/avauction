// Day 3 verification: seller-visible listings loop, end to end.
//   1. Seller A submits two auction listings -> both pending_review via
//      A's own RLS read path (the exact query /seller/listings runs)
//   2. approve-listing.mjs approves #1 -> active, appears in /api/search
//      (browse) and GET /api/listings/[id] (detail, Live state)
//   3. approve-listing.mjs rejects #2 with a reason -> draft with
//      seller-visible rejection_reason via A's RLS read
//   4. Cross-seller isolation: seller B querying A's rows sees ONLY the
//      active one (public policy) — never pending_review or draft
import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const anon = createClient(url, anonKey);
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
const API = "http://localhost:3000";

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : "  " + JSON.stringify(detail)}`);
  ok ? pass++ : fail++;
};

// RLS-scoped client: same anon key the browser uses, user JWT attached —
// exactly the read path SellerListingsList exercises.
const rlsClient = (token) =>
  createClient(url, anonKey, { global: { headers: { Authorization: `Bearer ${token}` } } });

const ts = Date.now();
async function makeUser(tag) {
  const { data, error } = await anon.auth.signUp({
    email: `day3-${tag}-${ts}@example.com`,
    password: "test-password-1234",
  });
  if (error || !data.session) throw new Error(`signup ${tag}: ${error?.message}`);
  return { id: data.user.id, token: data.session.access_token };
}

async function makeSeller(tag) {
  const u = await makeUser(tag);
  const res = await fetch(`${API}/api/auth/upgrade-to-seller`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${u.token}` },
    body: JSON.stringify({
      account_type: "individual",
      agreement_accepted: true,
      contact_name: `Day3 ${tag}`,
      contact_email: `day3-${tag}-${ts}@example.com`,
      phone: "555-0100",
      address_line1: "1 Test St",
      city: "Nashville",
      state: "TN",
      postal_code: "37203",
    }),
  });
  if (!res.ok) throw new Error(`upgrade ${tag}: ${await res.text()}`);
  const { data: seller } = await service.from("sellers").select("id").eq("user_id", u.id).single();
  return { ...u, sellerId: seller.id };
}

const sellerA = await makeSeller("sellerA");
const sellerB = await makeSeller("sellerB");

// ---- 1. Submit two auction listings as A -------------------------------
const { data: eq } = await service.rpc("search_equipment", { p_q: "digico sd12", p_limit: 1 });
const equipment = eq?.[0];
if (!equipment) throw new Error("no catalog hit for digico sd12");

const payload = (title) => ({
  master_equipment_id: equipment.id,
  title,
  description: "Day 3 seller-listings verification",
  qc: {
    powers_on: true,
    all_components: true,
    flight_case: true,
    cosmetic_damage: "none",
    known_issues: false,
    known_issues_description: null,
    serviced: false,
    service_description: null,
    serial_confirmed: true,
  },
  quantity: 1,
  hours_of_use: 500,
  serial_numbers: ["SN-DAY3-001"],
  zip_code: "37203",
  asking_price: 25000,
  reserve_price: null,
  listing_type: "auction",
  known_issues: "None disclosed",
  entry_method: "form",
  photos: [],
});

async function submit(title) {
  const res = await fetch(`${API}/api/listings/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${sellerA.token}` },
    body: JSON.stringify(payload(title)),
  });
  const body = await res.json();
  if (res.status !== 200 || !body.ok) throw new Error(`submit failed: ${JSON.stringify(body)}`);
  return body.listing_id;
}

const toApprove = await submit(`DAY3 approve-me ${ts}`);
const toReject = await submit(`DAY3 reject-me ${ts}`);
console.log(`submitted: approve=${toApprove} reject=${toReject}\n`);

// The exact /seller/listings query
const sellerListings = async (who, sellerId) => {
  const { data, error } = await rlsClient(who.token)
    .from("listings")
    .select(
      "id, title, status, listing_type, condition_grade, asking_price, reserve_price, current_bid, bid_count, quantity, auction_end, rejection_reason, created_at"
    )
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`RLS read failed: ${error.message}`);
  return data;
};

{
  const rows = await sellerListings(sellerA, sellerA.sellerId);
  const both = rows.filter((r) => [toApprove, toReject].includes(r.id));
  check("A sees both listings via RLS read-own", both.length === 2, rows.map((r) => r.id));
  check("both are pending_review ('In review' group)", both.every((r) => r.status === "pending_review"), both);
}

// ---- 2. Approve #1 through the real helper -----------------------------
const helper = (...args) =>
  execFileSync("node", ["scripts/approve-listing.mjs", ...args], { encoding: "utf8" });

const approveOut = helper("approve", toApprove);
console.log(approveOut.trim());
check("helper reports APPROVED", approveOut.includes("APPROVED"), approveOut);

{
  const rows = await sellerListings(sellerA, sellerA.sellerId);
  const live = rows.find((r) => r.id === toApprove);
  check("approved listing now active ('Live' group)", live?.status === "active", live);
  check("auction slot assigned (auction_end set, future)", live?.auction_end && new Date(live.auction_end) > new Date(), live?.auction_end);
  check("rejection_reason null on approved listing", live?.rejection_reason === null, live);

  // Browse: the /auction data path
  const searchRes = await fetch(`${API}/api/search?type=auction&q=DAY3&per_page=50`);
  const search = await searchRes.json();
  const hit = (search.results ?? []).find((r) => r.id === toApprove);
  check("approved listing appears in /api/search (browse)", !!hit, { total: search.total });
  check("browse row shows auction type + grade A", hit?.listing_type === "auction" && hit?.condition_grade === "A", hit);

  // Detail: the /listing/[id] data path
  const detailRes = await fetch(`${API}/api/listings/${toApprove}`);
  const detail = await detailRes.json();
  check("GET /api/listings/[id] serves it (Live state)", detailRes.status === 200 && detail.status === "active", { status: detailRes.status });
  check("detail has auction_end for LotCloseCountdown", !!detail.auction_end, detail.auction_end);

  // Still-pending listing must NOT leak to public paths
  const pendingDetail = await fetch(`${API}/api/listings/${toReject}`);
  check("pending listing 404s on public detail", pendingDetail.status === 404, pendingDetail.status);
}

// ---- 3. Reject #2 with a reason ----------------------------------------
const REASON = "Serial number photo missing — re-shoot the label and resubmit.";
const rejectOut = helper("reject", toReject, "--reason", REASON);
console.log(rejectOut.trim());
check("helper reports REJECTED", rejectOut.includes("REJECTED"), rejectOut);

{
  const rows = await sellerListings(sellerA, sellerA.sellerId);
  const returned = rows.find((r) => r.id === toReject);
  check("rejected listing now draft ('Returned from review' group)", returned?.status === "draft", returned);
  check("seller-visible rejection_reason matches", returned?.rejection_reason === REASON, returned?.rejection_reason);
}

// ---- 4. Cross-seller isolation -----------------------------------------
{
  const rows = await sellerListings(sellerB, sellerA.sellerId); // B querying A's rows
  const ids = rows.map((r) => r.id);
  check("B sees A's ACTIVE listing (public policy)", ids.includes(toApprove), ids);
  check("B cannot see A's draft (rejected) listing", !ids.includes(toReject), ids);
  check("B sees no pending_review rows of A's", rows.every((r) => r.status !== "pending_review" && r.status !== "draft"), rows.map((r) => r.status));

  const own = await sellerListings(sellerB, sellerB.sellerId);
  check("B's own list is empty", own.length === 0, own);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
