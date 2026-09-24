import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { detectionUrl, getCloudinaryConfig, isValidPublicId } from "@/lib/photos/cloudinary";
import { detectIdentifyingMarks } from "@/lib/photos/detect";
import { PHOTO_TYPE_VALUES, type DetectionRecord } from "@/lib/photos/rules";

// POST /api/photos/analyze — scan one uploaded photo for seller-identifying
// marks and return SUGGESTED blur regions. The seller edits them in the
// uploader; nothing is stored here.
//
//   body: { public_id, version, format, photo_type }
//   ->    DetectionRecord { status, suggested[], model, note }
//
// Fail-open: every failure path returns status failed/unavailable with an
// empty suggestion list and HTTP 200, so the uploader never blocks on it.
// The image is fetched server-side through a signed, downscaled, CLEAN
// delivery URL — the clean bytes go to the model and nowhere else.

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`photos:analyze:${user.id}`, 40, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase.from("sellers").select("id").eq("user_id", user.id).single();
  if (!seller) return NextResponse.json({ error: "not_a_seller" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const publicId = typeof body.public_id === "string" ? body.public_id : "";
  if (!isValidPublicId(publicId, seller.id)) {
    return NextResponse.json({ error: "not_your_photo" }, { status: 403 });
  }
  const version = body.version;
  if (typeof version !== "number" || !Number.isInteger(version) || version <= 0 || typeof body.format !== "string") {
    return NextResponse.json({ error: "invalid_photo" }, { status: 400 });
  }
  const photoType = typeof body.photo_type === "string" && PHOTO_TYPE_VALUES.includes(body.photo_type) ? body.photo_type : "other";

  const failed = (note: string, status: DetectionRecord["status"] = "failed"): DetectionRecord => ({
    status, suggested: [], model: null, note,
  });

  const cfg = getCloudinaryConfig();
  if (!cfg) return NextResponse.json(failed("photos not configured", "unavailable"));
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json(failed("ANTHROPIC_API_KEY not set", "unavailable"));

  // Downscaled clean JPEG via a signed URL — never handed to the browser
  let imageBase64: string;
  try {
    const res = await fetch(detectionUrl(cfg, { public_id: publicId, version, format: body.format.toLowerCase() }));
    if (!res.ok) return NextResponse.json(failed(`image fetch ${res.status}`));
    imageBase64 = Buffer.from(await res.arrayBuffer()).toString("base64");
  } catch (e) {
    console.error("analyze: image fetch failed:", (e as Error).message);
    return NextResponse.json(failed("image fetch error"));
  }

  const record = await detectIdentifyingMarks({ imageBase64, mediaType: "image/jpeg", photoType });
  return NextResponse.json(record);
}
