import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  destroyAsset,
  getCloudinaryConfig,
  publicIdPrefix,
  signedUploadParams,
} from "@/lib/photos/cloudinary";

// Seller photo uploads — the server side of the Cloudinary SIGNED direct
// upload flow. Sellers only.
//
//   POST   /api/photos  -> one set of signed upload params (one per file;
//                          the public_id is server-chosen and namespaced
//                          listings/<seller_id>/<uuid>)
//   DELETE /api/photos  -> { public_id } destroys an asset the seller
//                          uploaded but removed before submitting. Only
//                          the seller's own namespace is destroyable.
//
// The file itself goes browser -> Cloudinary; nothing binary touches this
// route. The API secret never leaves the server: the browser gets the
// cloud name, api_key (public) and a signature.

async function sellerFor(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return { status: 401 as const, error: "unauthorized" };
  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!seller) return { status: 403 as const, error: "not_a_seller" };
  return { user, sellerId: seller.id as string };
}

export async function POST(req: Request) {
  const who = await sellerFor(req);
  if ("error" in who) return NextResponse.json({ error: who.error }, { status: who.status });

  // 60/min per seller: a 24-photo listing with retries fits comfortably,
  // a signature farm doesn't
  if (!rateLimit(`photos:sign:${who.user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const cfg = getCloudinaryConfig();
  if (!cfg) {
    console.error("photos: Cloudinary env not configured");
    return NextResponse.json({ error: "photos_not_configured" }, { status: 503 });
  }

  return NextResponse.json(signedUploadParams(cfg, who.sellerId));
}

export async function DELETE(req: Request) {
  const who = await sellerFor(req);
  if ("error" in who) return NextResponse.json({ error: who.error }, { status: who.status });

  if (!rateLimit(`photos:destroy:${who.user.id}`, 60, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  let body: { public_id?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const publicId = typeof body.public_id === "string" ? body.public_id : "";
  if (!publicId.startsWith(publicIdPrefix(who.sellerId)) || publicId.includes("..")) {
    return NextResponse.json({ error: "not_your_photo" }, { status: 403 });
  }

  const cfg = getCloudinaryConfig();
  if (!cfg) return NextResponse.json({ error: "photos_not_configured" }, { status: 503 });

  // Only pre-submission photos are destroyable here: once a row exists on
  // a listing the photo belongs to the review record.
  const supabase = createServiceRoleClient();
  const { count } = await supabase
    .from("listing_photos")
    .select("id", { count: "exact", head: true })
    .eq("public_id", publicId);
  if ((count ?? 0) > 0) {
    return NextResponse.json({ error: "photo_attached_to_listing" }, { status: 409 });
  }

  try {
    const result = await destroyAsset(cfg, publicId);
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    console.error("cloudinary destroy failed:", (e as Error).message);
    return NextResponse.json({ error: "destroy_failed" }, { status: 502 });
  }
}
