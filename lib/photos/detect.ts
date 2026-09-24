// Seller-identifying mark detection — Claude vision over a listing photo.
// Server-only (reads ANTHROPIC_API_KEY). Never import from a client
// component.
//
// The anonymity rule (CLAUDE.md): the seller's company name, contact
// details and exact location are never shown to buyers before escrow is
// funded. Rental houses stencil, sticker and spray-paint their gear, so a
// photo can leak all three. This scan suggests blur boxes for those marks
// ONLY. Manufacturer branding, model numbers and serial plates are what a
// buyer is entitled to see — they are never flagged, and the serial_label
// shot must stay legible.
//
// Fail-open by design: any error, timeout, refusal or missing key returns
// a record with status failed/unavailable and NO suggestions. The upload
// is never blocked — the seller draws boxes by hand.

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  MAX_BLUR_REGIONS,
  normalizeBlurRegions,
  type BlurRegion,
  type DetectionRecord,
  type PhotoType,
} from "./rules";

// Model is a deployment setting: PHOTO_DETECTION_MODEL in the environment
// (Vercel project env / .env.local). Default is the current Opus.
export const DEFAULT_DETECTION_MODEL = "claude-opus-5-5";
export function getDetectionModel(): string {
  const v = (process.env.PHOTO_DETECTION_MODEL ?? "").trim();
  return v || DEFAULT_DETECTION_MODEL;
}
const DEFAULT_TIMEOUT_MS = 25_000;

// The model reports boxes on a 1000x1000 grid over the image it sees —
// integers are more reliable than decimals from a vision model.
const GRID = 1000;

// Kinds that identify the SELLER. Everything else is product information.
const IDENTIFYING_KINDS = [
  "company_name", "logo", "asset_tag", "stencil", "spray_paint",
  "contact_info", "other_identifying",
] as const;
const PRODUCT_KINDS = ["manufacturer_branding", "model_number", "serial_plate"] as const;

const MarkSchema = z.object({
  kind: z.enum([...IDENTIFYING_KINDS, ...PRODUCT_KINDS]),
  label: z.string().max(60),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});
const DetectionSchema = z.object({
  marks: z.array(MarkSchema).max(40),
});
export type DetectionOutput = z.infer<typeof DetectionSchema>;

// Pure: model output -> normalized blur regions. Product kinds are
// dropped here as well as in the prompt — belt and braces.
export function parseDetectionOutput(raw: unknown): BlurRegion[] {
  const parsed = DetectionSchema.safeParse(raw);
  if (!parsed.success) return [];
  const identifying = parsed.data.marks.filter((m) =>
    (IDENTIFYING_KINDS as readonly string[]).includes(m.kind)
  );
  const regions = normalizeBlurRegions(
    identifying.map((m) => ({
      x: m.x / GRID, y: m.y / GRID, w: m.w / GRID, h: m.h / GRID, label: m.label,
    }))
  ) ?? [];
  return regions.slice(0, MAX_BLUR_REGIONS);
}

const SYSTEM_PROMPT = `You review photographs of used professional audio-visual equipment that a seller is listing on an anonymous marketplace. Buyers must not be able to identify WHO is selling. Your job is to locate marks in the photo that identify the seller or their business so they can be blurred before the photo is shown.

Flag (kind):
- company_name: a rental company, production company, integrator, venue or owner name, printed, engraved, stickered or written
- logo: a company or brand logo that is NOT the equipment manufacturer's
- asset_tag: inventory / asset / barcode tags and stickers applied by an owner
- stencil: stencilled or engraved ownership marks on cases and gear
- spray_paint: spray-painted or hand-painted identifiers (initials, company abbreviations, unit numbers)
- contact_info: phone numbers, email addresses, websites, addresses, QR codes
- other_identifying: anything else that would let a buyer identify the seller (e.g. a name badge, a truck livery in the background)

Do NOT flag — these are product information the buyer is entitled to see:
- manufacturer_branding: the equipment maker's logo or name (Yamaha, DiGiCo, MA Lighting, Barco, Shure, etc.)
- model_number: model names and numbers printed by the manufacturer
- serial_plate: the manufacturer's serial number plate or label

If the manufacturer's serial plate carries an owner's sticker next to it, flag only the sticker. Report every mark you find as a tight bounding box on a 1000 by 1000 grid laid over the image (x, y = top-left corner; w, h = width and height), including the product-information kinds so they can be excluded downstream. If there are no marks at all, return an empty list.`;

export interface DetectInput {
  imageBase64: string;
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  photoType: PhotoType | string;
  timeoutMs?: number;
  model?: string; // defaults to getDetectionModel()
}

export async function detectIdentifyingMarks(input: DetectInput): Promise<DetectionRecord> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { status: "unavailable", suggested: [], model: null, note: "ANTHROPIC_API_KEY not set" };
  }
  const client = new Anthropic({ timeout: input.timeoutMs ?? DEFAULT_TIMEOUT_MS, maxRetries: 1 });
  const model = input.model ?? getDetectionModel();
  const shotNote =
    input.photoType === "serial_label"
      ? "This is the SERIAL LABEL shot: the manufacturer's serial plate must stay legible. Flag only owner-applied stickers, tags or writing, never the serial plate itself."
      : `Shot type: ${input.photoType}.`;
  try {
    const response = await client.beta.messages.create({
      model,
      max_tokens: 4096,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(DetectionSchema), effort: "medium" },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: input.mediaType, data: input.imageBase64 } },
            { type: "text", text: `${shotNote} List every mark in this photo.` },
          ],
        },
      ],
    });
    if (response.stop_reason === "refusal") {
      return { status: "failed", suggested: [], model: response.model, note: "model declined" };
    }
    const text = response.content.find((b) => b.type === "text")?.text ?? "";
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { status: "failed", suggested: [], model: response.model, note: "unparseable output" };
    }
    return { status: "done", suggested: parseDetectionOutput(json), model: response.model, note: null };
  } catch (e) {
    const note =
      e instanceof Anthropic.RateLimitError ? "rate limited"
      : e instanceof Anthropic.AuthenticationError ? "invalid api key"
      : e instanceof Anthropic.APIConnectionTimeoutError ? "timeout"
      : e instanceof Anthropic.APIError ? `api error ${e.status}`
      : "error";
    console.error("detectIdentifyingMarks failed:", note, (e as Error).message);
    return { status: "failed", suggested: [], model: null, note };
  }
}
