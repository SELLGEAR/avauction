import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import {
  editorUrl,
  getCloudinaryConfig,
  isValidPublicId,
  thumbUrl,
  type PhotoIdentity,
} from "@/lib/photos/cloudinary";
import { MAX_BLUR_REGIONS, normalizeBlurRegions } from "@/lib/photos/rules";

// POST /api/photos/preview — signed preview URLs for a photo the seller
// just uploaded. Listing photos are type=authenticated, so the browser
// can't derive any viewable URL from the upload response; it asks here.
//
//   body: { public_id, version, format, width, height, blur_regions? }
//   ->    { thumb_url, editor_url }
//
// thumb_url  = the buyer treatment (blur regions + watermark) at tile size
// editor_url = clean, capped long edge, for drawing blur boxes. Sellers
//              only ever get URLs for public_ids in their own namespace.

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!rateLimit(`photos:preview:${user.id}`, 240, 60_000)) {
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
  const isPosInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;
  if (!isPosInt(body.version) || !isPosInt(body.width) || !isPosInt(body.height) || typeof body.format !== "string") {
    return NextResponse.json({ error: "invalid_photo" }, { status: 400 });
  }
  const regions = normalizeBlurRegions(body.blur_regions);
  if (!regions || regions.length > MAX_BLUR_REGIONS) {
    return NextResponse.json({ error: "invalid_blur_regions" }, { status: 400 });
  }

  const cfg = getCloudinaryConfig();
  if (!cfg) return NextResponse.json({ error: "photos_not_configured" }, { status: 503 });

  const p: PhotoIdentity = {
    public_id: publicId,
    version: body.version,
    format: body.format.toLowerCase(),
    width: body.width,
    height: body.height,
  };
  return NextResponse.json({ thumb_url: thumbUrl(cfg, p, regions), editor_url: editorUrl(cfg, p) });
}
