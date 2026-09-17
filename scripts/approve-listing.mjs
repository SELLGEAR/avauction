// Admin listing-review helper — the manual stand-in for the auction ops
// dashboard (CLAUDE.md loose end #9: build the dashboard when manual
// operation becomes the bottleneck, not before). Drives the REAL admin API
// routes (requireAdmin + reviewListing), never a service-role shortcut
// around them.
//
// Usage (dev server must be running):
//   node scripts/approve-listing.mjs list
//   node scripts/approve-listing.mjs approve <listing-id> [--start <iso>] [--end <iso>] [--offset-min <n>]
//   node scripts/approve-listing.mjs reject <listing-id> --reason "why it was returned"
//
// Auction approvals need a slot (approval is where a lot gets its close
// time — an active auction with null times is unbiddable by design).
// Defaults: start = now, end = next Friday 12:00 ET, staggered later by
// --offset-min minutes (default 0). Buy-it-now approvals need no times.
//
// Auth: signs in as ops-admin@avauction-demo.local — created and promoted
// to role=admin via the service role on first run. No password is stored:
// every run rotates it to a fresh random value, then signs in for the JWT.
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const service = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const API = process.env.API_BASE_URL || "http://localhost:3000";

const ADMIN_EMAIL = "ops-admin@avauction-demo.local";

function fatal(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

async function getAdminToken() {
  const password = crypto.randomUUID();
  const { data: created, error } = await service.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password,
    email_confirm: true,
  });
  let userId = created?.user?.id;
  if (error) {
    if (!(error.message.includes("already been registered") || error.status === 422)) {
      fatal(`create ops admin: ${error.message}`);
    }
    const { data: list } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const existing = list.users.find((u) => u.email === ADMIN_EMAIL);
    if (!existing) fatal("ops admin exists but was not found via listUsers");
    userId = existing.id;
    const { error: pwErr } = await service.auth.admin.updateUserById(userId, { password });
    if (pwErr) fatal(`rotate ops admin password: ${pwErr.message}`);
  }

  // requireAdmin checks public.users.role in the database, not the token
  const { error: roleErr } = await service
    .from("users")
    .update({ role: "admin" })
    .eq("id", userId);
  if (roleErr) fatal(`promote ops admin: ${roleErr.message}`);

  const { data: session, error: signInErr } = await anon.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password,
  });
  if (signInErr || !session.session) fatal(`ops admin sign-in: ${signInErr?.message}`);
  return session.session.access_token;
}

// Noon ET for a given UTC date's calendar day, DST-safe: try the EDT
// offset, verify the wall-clock hour in America/New_York, fall back to EST.
function noonEt(date) {
  const day = date.toISOString().slice(0, 10);
  for (const offset of ["-04:00", "-05:00"]) {
    const candidate = new Date(`${day}T12:00:00${offset}`);
    const hour = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hour12: false,
    }).format(candidate);
    if (Number(hour) === 12) return candidate;
  }
  fatal(`could not resolve noon ET for ${day}`);
}

function nextFridayNoonEt() {
  const now = new Date();
  for (let i = 0; i < 8; i++) {
    const d = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    const weekday = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
    }).format(d);
    if (weekday === "Fri") {
      const noon = noonEt(d);
      if (noon > now) return noon;
    }
  }
  fatal("no upcoming Friday found");
}

function argValue(args, flag) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}

async function api(path, opts, token) {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
  });
  let body;
  try {
    body = await res.json();
  } catch {
    fatal(`${path} returned non-JSON (${res.status}) — is the dev server running at ${API}?`);
  }
  return { status: res.status, body };
}

const [cmd, ...rest] = process.argv.slice(2);

if (!["list", "approve", "reject"].includes(cmd)) {
  console.log(
    "usage:\n  node scripts/approve-listing.mjs list\n" +
      "  node scripts/approve-listing.mjs approve <id> [--start <iso>] [--end <iso>] [--offset-min <n>]\n" +
      '  node scripts/approve-listing.mjs reject <id> --reason "text"'
  );
  process.exit(cmd ? 1 : 0);
}

const token = await getAdminToken();

if (cmd === "list") {
  const { status, body } = await api("/api/admin/listings?status=pending_review", {}, token);
  if (status !== 200) fatal(`queue fetch failed (${status}): ${JSON.stringify(body)}`);
  const rows = body.results ?? [];
  console.log(`${body.total} listing(s) pending review\n`);
  for (const l of rows) {
    const eq = l.master_equipment ?? {};
    const meta = Array.isArray(l.listing_admin_meta) ? l.listing_admin_meta[0] : l.listing_admin_meta;
    const seller = l.sellers ?? {};
    console.log(`  ${l.id}`);
    console.log(`    ${l.title}`);
    console.log(
      `    ${l.listing_type} · grade ${l.condition_grade ?? "—"}${l.grade_override ? " (OVERRIDE)" : ""}` +
        ` · asking ${l.asking_price ?? "—"} · reserve ${l.reserve_price ?? "—"} · qty ${l.quantity}`
    );
    console.log(
      `    ${eq.manufacturer ?? "?"} ${eq.model ?? "?"} (${eq.category ?? "?"})` +
        ` · seller: ${seller.business_name ?? "individual"} [${seller.verification_status ?? "?"}]` +
        ` · quality ${meta?.quality_score ?? "—"} · submitted ${l.created_at}`
    );
    console.log("");
  }
  process.exit(0);
}

const id = rest[0];
if (!id || id.startsWith("--")) fatal(`${cmd} needs a listing id`);

if (cmd === "approve") {
  // Fetch the listing type first so auction approvals get their slot
  const { data: listing } = await service
    .from("listings")
    .select("listing_type, title, status")
    .eq("id", id)
    .single();
  if (!listing) fatal("listing not found");
  if (listing.status !== "pending_review") fatal(`listing status is '${listing.status}', not pending_review`);

  const payload = { action: "approve" };
  if (listing.listing_type === "auction") {
    const offsetMin = Number(argValue(rest, "--offset-min") ?? 0);
    const start = argValue(rest, "--start") ?? new Date().toISOString();
    const end =
      argValue(rest, "--end") ??
      new Date(nextFridayNoonEt().getTime() + offsetMin * 60 * 1000).toISOString();
    payload.auction_start = start;
    payload.auction_end = end;
    console.log(`auction slot: start ${payload.auction_start} → end ${payload.auction_end}`);
  }

  const { status, body } = await api(`/api/admin/listings/${id}`, { method: "POST", body: JSON.stringify(payload) }, token);
  if (status !== 200 || !body.ok) fatal(`approve failed (${status}): ${JSON.stringify(body)}`);
  console.log(
    `APPROVED — "${listing.title}" is live` +
      (body.alerted ? ` (${body.alerted} saved-search alert(s) fired)` : "")
  );
  process.exit(0);
}

// reject
const reason = argValue(rest, "--reason");
if (!reason) fatal('reject needs --reason "text" — it becomes the seller-visible rejection_reason');
const { status, body } = await api(
  `/api/admin/listings/${id}`,
  { method: "POST", body: JSON.stringify({ action: "reject", reason }) },
  token
);
if (status !== 200 || !body.ok) fatal(`reject failed (${status}): ${JSON.stringify(body)}`);
console.log(`REJECTED — returned to the seller as a draft with reason: "${reason}"`);
