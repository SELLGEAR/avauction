import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { rateLimit } from "@/lib/rateLimit";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { gradeFromQc, type Grade, type QcAnswers } from "@/lib/listings/gradeFromQc";
import { qualityScore, type PhotoInput } from "@/lib/listings/qualityScore";

// POST /api/listings/submit — seller submits gear for admin review.
//
// Flow: resolve master equipment (direct id, or fuzzy match on
// manufacturer/model for the "can't find it" path) -> compute suggested
// grade from the QC answers (seller divergence sets grade_override) ->
// pricing engine suggestion -> quality score (admin-only) ->
// submit_listing() inserts everything atomically at pending_review.
//
// If fuzzy match can only queue the product, NO listing is created —
// listings.master_equipment_id is NOT NULL by design ("no listing without
// a master record"). The seller resubmits after admin approves the product.
export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!rateLimit(`submit:${user.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const supabase = createServiceRoleClient();
  const { data: seller } = await supabase
    .from("sellers")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!seller) return NextResponse.json({ error: "not_a_seller" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const qc = body.qc as QcAnswers | undefined;
  const photos = (body.photos ?? []) as PhotoInput[];
  if (
    !qc ||
    typeof qc.powers_on !== "boolean" ||
    typeof qc.all_components !== "boolean" ||
    typeof qc.flight_case !== "boolean" ||
    !["none", "minor", "significant"].includes(qc.cosmetic_damage) ||
    typeof qc.known_issues !== "boolean" ||
    typeof qc.serviced !== "boolean"
  ) {
    return NextResponse.json({ error: "qc_answers_incomplete" }, { status: 400 });
  }
  if (typeof body.title !== "string" || body.title.trim() === "") {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }
  if (typeof body.zip_code !== "string" || body.zip_code.trim() === "") {
    return NextResponse.json({ error: "zip_code_required" }, { status: 400 });
  }

  // ---- Resolve master equipment ----------------------------------------
  let equipmentId = typeof body.master_equipment_id === "string" ? body.master_equipment_id : null;
  if (!equipmentId) {
    const mfr = typeof body.manufacturer === "string" ? body.manufacturer : "";
    const model = typeof body.model === "string" ? body.model : "";
    if (!mfr || !model) {
      return NextResponse.json(
        { error: "master_equipment_id_or_manufacturer_model_required" },
        { status: 400 }
      );
    }
    const { data: match, error: matchErr } = await supabase.rpc("match_or_queue", {
      p_source: "seller_submission",
      p_raw_title: `${mfr} ${model}`,
      p_manufacturer_hint: mfr,
      p_model_hint: model,
      p_listing_url: null,
    });
    if (matchErr) {
      console.error("match_or_queue failed:", matchErr.message);
      return NextResponse.json({ error: "match_failed" }, { status: 500 });
    }
    const m = match as { decision: string; master_equipment_id?: string; pending_id?: string };
    if (m.decision === "matched" && m.master_equipment_id) {
      equipmentId = m.master_equipment_id;
    } else if (m.decision === "queued" || m.decision === "queued_duplicate") {
      return NextResponse.json(
        {
          status: "pending_equipment_review",
          pending_id: m.pending_id ?? null,
          message:
            "This product isn't in our database yet — it's been sent for review. You'll be able to submit the listing once it's approved.",
        },
        { status: 422 }
      );
    } else {
      return NextResponse.json({ error: "unknown_product" }, { status: 422 });
    }
  }

  // ---- Grade + pricing + quality score ---------------------------------
  const suggestedGrade = gradeFromQc(qc);
  const sellerGrade =
    typeof body.condition_grade === "string" && ["A", "B", "C", "D"].includes(body.condition_grade)
      ? (body.condition_grade as Grade)
      : suggestedGrade;
  const gradeOverride = sellerGrade !== suggestedGrade;
  const finalGrade = sellerGrade;

  const { data: priceSuggestion } = await supabase.rpc("suggest_price", {
    p_master_equipment_id: equipmentId,
    p_condition_grade: finalGrade,
  });

  const knownIssues = typeof body.known_issues === "string" ? body.known_issues : "";
  const serialNumbers = Array.isArray(body.serial_numbers)
    ? (body.serial_numbers as string[])
    : [];
  const quantity = typeof body.quantity === "number" && body.quantity > 0 ? body.quantity : 1;
  const { score, breakdown } = qualityScore({
    photos,
    qc,
    description: typeof body.description === "string" ? body.description : null,
    knownIssues,
    serialNumbers,
    quantity,
    hoursOfUse: typeof body.hours_of_use === "number" ? body.hours_of_use : null,
    gradeOverride,
  });

  // ---- Atomic insert ----------------------------------------------------
  const { data: result, error: submitErr } = await supabase.rpc("submit_listing", {
    p: {
      seller_id: seller.id,
      master_equipment_id: equipmentId,
      title: body.title,
      description: body.description ?? null,
      condition_grade: finalGrade,
      grade_override: gradeOverride,
      quantity,
      hours_of_use: body.hours_of_use ?? null,
      serial_numbers: serialNumbers,
      year_of_manufacture: body.year_of_manufacture ?? null,
      purchase_year: body.purchase_year ?? null,
      zip_code: body.zip_code,
      asking_price: body.asking_price ?? null,
      reserve_price: body.reserve_price ?? null,
      listing_type: body.listing_type,
      known_issues: knownIssues,
      flight_case_included: qc.flight_case,
      entry_method: body.entry_method ?? "form",
      photos,
      qc: { ...qc, suggested_grade: suggestedGrade, seller_accepted_grade: !gradeOverride },
      admin_meta: {
        quality_score: score,
        score_breakdown: breakdown,
        suggested_grade: suggestedGrade,
        price_suggestion: priceSuggestion ?? null,
      },
    },
  });

  if (submitErr) {
    console.error("submit_listing failed:", submitErr.message);
    return NextResponse.json({ error: "submit_failed" }, { status: 500 });
  }

  const r = result as { ok: boolean; error?: string; listing_id?: string };
  if (!r.ok) return NextResponse.json(r, { status: 422 });

  // Quality score deliberately omitted — admin-only
  return NextResponse.json({
    ok: true,
    listing_id: r.listing_id,
    status: "pending_review",
    suggested_grade: suggestedGrade,
    grade_override: gradeOverride,
    price_suggestion: priceSuggestion ?? null,
  });
}
