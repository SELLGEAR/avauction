"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  EquipmentTypeahead,
  type EquipmentSelection,
} from "@/components/seller/EquipmentTypeahead";
import {
  gradeFromQc,
  GRADE_DEFINITIONS,
  GRADE_NAMES,
  POOR_DEFINITION,
  POOR_NAME,
  type CosmeticDamage,
  type Grade,
  type QcAnswers,
} from "@/lib/listings/gradeFromQc";

// The gear entry form — multi-step, mobile-first, one thing at a time.
// Photo upload DEFERRED (submits with photos: [], min_photos_per_listing
// is 0); AI description DEFERRED (plain textarea). Functional-but-plain —
// design polish is Tom's later phase.
//
// Steps: equipment -> QC checklist -> grade -> details -> photos (stub)
// -> pricing + listing type -> attestation -> submit.
// Poor / For Parts (doesn't power on) blocks at the grade step; the submit
// route has a matching server-side guard.

const GRADES: Grade[] = ["A", "B", "C", "D"];
const STEPS = [
  "Equipment",
  "Condition checklist",
  "Grade",
  "Details",
  "Photos",
  "Pricing",
  "Review & submit",
] as const;

const inputClass =
  "mt-1.5 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none focus:border-[#3a3a3a]";
const labelClass = "mb-3 block text-xs font-medium uppercase tracking-wider text-[#999]";
const primaryBtn =
  "rounded-lg bg-[#22ee77] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] disabled:opacity-40";
const secondaryBtn =
  "rounded-lg border border-[#2a2a2a] px-5 py-2.5 text-sm font-medium text-[#999] hover:border-[#3a3a3a] hover:text-white";

const choiceBtn = (active: boolean) =>
  `rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "border-[#22ee77] bg-[#0d2218] text-white"
      : "border-[#2a2a2a] bg-[#0a0a0a] text-[#999] hover:border-[#3a3a3a]"
  }`;

// Seller-facing messages for every error code the submit path can return
const ERROR_MESSAGES: Record<string, string> = {
  qc_answers_incomplete: "The condition checklist is incomplete — go back and answer every question.",
  title_required: "The listing needs a title.",
  zip_code_required: "The listing needs the zip code where the gear is located.",
  known_issues_required: "The known-issues field can't be left blank.",
  asking_price_required: "Buy-it-now listings need an asking price.",
  invalid_listing_type: "Pick auction or buy-it-now.",
  min_photos_required: "This listing needs more photos.",
  invalid_master_equipment: "The selected product is no longer available — search again.",
  master_equipment_id_or_manufacturer_model_required:
    "Select a product from the database or enter manufacturer and model.",
  not_a_seller: "Your account isn't set up to sell yet.",
  rate_limited: "Too many submissions — wait a minute and try again.",
  match_failed: "Something went wrong matching your product. Try again.",
  submit_failed: "Something went wrong submitting your listing. Try again.",
};

interface YesNoProps {
  value: boolean | null;
  onChange: (v: boolean) => void;
}

function YesNo({ value, onChange }: YesNoProps) {
  return (
    <div className="mt-1.5 grid grid-cols-2 gap-2">
      <button type="button" onClick={() => onChange(true)} className={choiceBtn(value === true)}>
        Yes
      </button>
      <button type="button" onClick={() => onChange(false)} className={choiceBtn(value === false)}>
        No
      </button>
    </div>
  );
}

interface QcState {
  powers_on: boolean | null;
  all_components: boolean | null;
  flight_case: boolean | null;
  cosmetic_damage: CosmeticDamage | null;
  known_issues: boolean | null;
  known_issues_description: string;
  serviced: boolean | null;
  service_description: string;
  hours_of_use: string;
  serial_confirmed: boolean | null;
}

const EMPTY_QC: QcState = {
  powers_on: null,
  all_components: null,
  flight_case: null,
  cosmetic_damage: null,
  known_issues: null,
  known_issues_description: "",
  serviced: null,
  service_description: "",
  hours_of_use: "",
  serial_confirmed: null,
};

interface PriceSuggestion {
  has_data: boolean;
  suggested_low?: number;
  suggested_high?: number;
  confidence: string;
}

type Outcome =
  | {
      kind: "success";
      listingId: string;
      suggestedGrade: string;
      gradeOverride: boolean;
    }
  | { kind: "equipment_queued"; message: string };

interface Props {
  token: string;
}

export function GearEntryForm({ token }: Props) {
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState<EquipmentSelection | null>(null);
  const [qc, setQc] = useState<QcState>(EMPTY_QC);
  const [chosenGrade, setChosenGrade] = useState<Grade | null>(null);
  // Details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [zipCode, setZipCode] = useState("");
  const [yearOfManufacture, setYearOfManufacture] = useState("");
  const [purchaseYear, setPurchaseYear] = useState("");
  const [serialNumbers, setSerialNumbers] = useState("");
  const [knownIssuesText, setKnownIssuesText] = useState("");
  // Pricing
  const [listingType, setListingType] = useState<"auction" | "buy_it_now" | null>(null);
  const [askingPrice, setAskingPrice] = useState("");
  const [reservePrice, setReservePrice] = useState("");
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestion | null>(null);
  // Submit
  const [attested, setAttested] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);

  const patchQc = (patch: Partial<QcState>) => setQc((prev) => ({ ...prev, ...patch }));

  const qcComplete =
    qc.powers_on !== null &&
    qc.all_components !== null &&
    qc.flight_case !== null &&
    qc.cosmetic_damage !== null &&
    qc.known_issues !== null &&
    (!qc.known_issues || qc.known_issues_description.trim() !== "") &&
    qc.serviced !== null &&
    (!qc.serviced || qc.service_description.trim() !== "") &&
    qc.serial_confirmed !== null;

  const qcAnswers: QcAnswers | null = qcComplete
    ? {
        powers_on: qc.powers_on!,
        all_components: qc.all_components!,
        flight_case: qc.flight_case!,
        cosmetic_damage: qc.cosmetic_damage!,
        known_issues: qc.known_issues!,
        known_issues_description: qc.known_issues ? qc.known_issues_description.trim() : null,
        serviced: qc.serviced!,
        service_description: qc.serviced ? qc.service_description.trim() : null,
        serial_confirmed: qc.serial_confirmed!,
      }
    : null;

  const suggestedGrade = qcAnswers ? gradeFromQc(qcAnswers) : null;

  const equipmentName =
    selection?.kind === "catalog"
      ? `${selection.equipment.manufacturer} ${selection.equipment.model}`
      : selection?.kind === "manual"
        ? `${selection.manufacturer} ${selection.model}`
        : "";

  // Entering details: prefill title from the selection, and known-issues
  // from the QC answer, once, without clobbering seller edits
  useEffect(() => {
    if (step !== 3) return;
    if (title.trim() === "" && equipmentName) setTitle(equipmentName);
    if (knownIssuesText.trim() === "" && qc.known_issues === false) {
      setKnownIssuesText("None disclosed");
    }
    if (knownIssuesText.trim() === "" && qc.known_issues === true) {
      setKnownIssuesText(qc.known_issues_description.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // Entering pricing: fetch the suggestion for catalog-matched gear
  useEffect(() => {
    if (step !== 5) return;
    if (selection?.kind !== "catalog" || !chosenGrade) {
      setPriceSuggestion(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/equipment/${selection.equipment.id}/price-suggestion?grade=${chosenGrade}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as PriceSuggestion;
        if (!cancelled) setPriceSuggestion(body);
      } catch {
        if (!cancelled) setPriceSuggestion(null);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, selection, chosenGrade, token]);

  const detailsValid =
    title.trim() !== "" &&
    /^\d{5}$/.test(zipCode.trim()) &&
    knownIssuesText.trim() !== "" &&
    Number(quantity) >= 1;

  const askingNum = Number(askingPrice);
  const pricingValid =
    listingType !== null && Number.isFinite(askingNum) && askingNum > 0;

  function resetAll() {
    setStep(0);
    setSelection(null);
    setQc(EMPTY_QC);
    setChosenGrade(null);
    setTitle("");
    setDescription("");
    setQuantity("1");
    setZipCode("");
    setYearOfManufacture("");
    setPurchaseYear("");
    setSerialNumbers("");
    setKnownIssuesText("");
    setListingType(null);
    setAskingPrice("");
    setReservePrice("");
    setPriceSuggestion(null);
    setAttested(false);
    setSubmitError(null);
    setOutcome(null);
  }

  async function submit() {
    if (!selection || !qcAnswers || !chosenGrade || !listingType) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() === "" ? null : description.trim(),
        condition_grade: chosenGrade,
        qc: qcAnswers,
        quantity: Math.max(1, Math.floor(Number(quantity)) || 1),
        hours_of_use: qc.hours_of_use.trim() === "" ? null : Math.floor(Number(qc.hours_of_use)),
        serial_numbers: serialNumbers
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter((s) => s !== ""),
        year_of_manufacture:
          yearOfManufacture.trim() === "" ? null : Math.floor(Number(yearOfManufacture)),
        purchase_year: purchaseYear.trim() === "" ? null : Math.floor(Number(purchaseYear)),
        zip_code: zipCode.trim(),
        asking_price: askingNum,
        reserve_price:
          listingType === "auction" && reservePrice.trim() !== ""
            ? Number(reservePrice)
            : null,
        listing_type: listingType,
        known_issues: knownIssuesText.trim(),
        photos: [],
      };
      if (selection.kind === "catalog") {
        payload.master_equipment_id = selection.equipment.id;
        payload.entry_method = "form";
      } else {
        payload.manufacturer = selection.manufacturer;
        payload.model = selection.model;
        payload.entry_method = "manual";
      }

      const res = await fetch("/api/listings/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as Record<string, unknown>;

      if (res.ok && body.ok === true) {
        setOutcome({
          kind: "success",
          listingId: String(body.listing_id),
          suggestedGrade: String(body.suggested_grade),
          gradeOverride: body.grade_override === true,
        });
      } else if (body.status === "pending_equipment_review") {
        setOutcome({
          kind: "equipment_queued",
          message: String(
            body.message ?? "This product was sent for review — you can submit once it's approved."
          ),
        });
      } else {
        const code = typeof body.error === "string" ? body.error : "submit_failed";
        setSubmitError(
          typeof body.message === "string"
            ? String(body.message)
            : (ERROR_MESSAGES[code] ?? `Something went wrong (${code}). Try again.`)
        );
      }
    } catch {
      setSubmitError("Couldn't reach the server — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Terminal panels ----------------------------------------------------

  if (outcome?.kind === "success") {
    return (
      <div className="rounded-xl border border-[#1a5c38] bg-[#0d2218] p-4">
        <h2 className="text-base font-semibold text-white">Submitted for review</h2>
        <p className="mt-2 text-sm text-[#bbb]">
          <span className="font-medium text-white">{title}</span> is in the admin review queue.
          You&apos;ll be notified when it goes live.
        </p>
        <p className="mt-2 text-xs text-[#888]">
          Grade {chosenGrade} · {chosenGrade ? GRADE_NAMES[chosenGrade] : ""}
          {outcome.gradeOverride &&
            ` (you adjusted from the suggested ${outcome.suggestedGrade} — this gets a second look in review)`}
        </p>
        <div className="mt-4 grid gap-2">
          <Link href="/seller/listings" className={`${primaryBtn} text-center`}>
            View your listings
          </Link>
          <button type="button" onClick={resetAll} className={`${secondaryBtn}`}>
            List another item
          </button>
        </div>
      </div>
    );
  }

  if (outcome?.kind === "equipment_queued") {
    return (
      <div className="rounded-xl border border-[#5c4a1a] bg-[#221d0d] p-4">
        <h2 className="text-base font-semibold text-white">New product — sent for review</h2>
        <p className="mt-2 text-sm text-[#bbb]">{outcome.message}</p>
        <p className="mt-2 text-xs text-[#888]">
          Everything you entered is still here — you can change the product selection, or come back
          and resubmit after it&apos;s approved.
        </p>
        <div className="mt-4 grid gap-2">
          <button
            type="button"
            onClick={() => {
              setOutcome(null);
              setStep(0);
            }}
            className={primaryBtn}
          >
            Back to the form
          </button>
          <Link href="/sell" className={`${secondaryBtn} text-center`}>
            Seller home
          </Link>
        </div>
      </div>
    );
  }

  // ---- Steps --------------------------------------------------------------

  const stepHeader = (
    <p className="mb-4 text-xs text-[#666]">
      Step {step + 1} of {STEPS.length} — {STEPS[step]}
    </p>
  );

  const nav = (canContinue: boolean, onContinue?: () => void) => (
    <div className="mt-5 flex gap-2">
      {step > 0 && (
        <button type="button" onClick={() => setStep(step - 1)} className={secondaryBtn}>
          Back
        </button>
      )}
      <button
        type="button"
        disabled={!canContinue}
        onClick={onContinue ?? (() => setStep(step + 1))}
        className={primaryBtn}
      >
        Continue
      </button>
    </div>
  );

  // Step 0 — equipment
  if (step === 0) {
    return (
      <div>
        {stepHeader}
        <EquipmentTypeahead token={token} selection={selection} onSelect={setSelection} />
        {nav(selection !== null)}
      </div>
    );
  }

  // Step 1 — QC checklist
  if (step === 1) {
    return (
      <div>
        {stepHeader}
        <p className="mb-4 text-sm text-[#bbb]">
          Quick condition check on your{" "}
          <span className="font-medium text-white">{equipmentName}</span>. Your answers set the
          suggested grade.
        </p>
        <label className={labelClass}>
          Powers on and produces full output?
          <YesNo value={qc.powers_on} onChange={(v) => patchQc({ powers_on: v })} />
        </label>
        <label className={labelClass}>
          All original components present?
          <YesNo value={qc.all_components} onChange={(v) => patchQc({ all_components: v })} />
        </label>
        <label className={labelClass}>
          Flight case or road case included?
          <YesNo value={qc.flight_case} onChange={(v) => patchQc({ flight_case: v })} />
        </label>
        <label className={labelClass}>
          Cosmetic damage
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {(["none", "minor", "significant"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => patchQc({ cosmetic_damage: c })}
                className={choiceBtn(qc.cosmetic_damage === c)}
              >
                {c[0].toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>
        </label>
        <label className={labelClass}>
          Any known technical issues?
          <YesNo value={qc.known_issues} onChange={(v) => patchQc({ known_issues: v })} />
        </label>
        {qc.known_issues === true && (
          <label className={labelClass}>
            Describe the issues
            <textarea
              className={inputClass}
              rows={2}
              value={qc.known_issues_description}
              onChange={(e) => patchQc({ known_issues_description: e.target.value })}
              placeholder="e.g. channel 3 fader is scratchy"
            />
          </label>
        )}
        <label className={labelClass}>
          Serviced or repaired?
          <YesNo value={qc.serviced} onChange={(v) => patchQc({ serviced: v })} />
        </label>
        {qc.serviced === true && (
          <label className={labelClass}>
            Describe the service or repair
            <textarea
              className={inputClass}
              rows={2}
              value={qc.service_description}
              onChange={(e) => patchQc({ service_description: e.target.value })}
              placeholder="e.g. power supply replaced by manufacturer, 2024"
            />
          </label>
        )}
        <label className={labelClass}>
          Hours of use (approximate, optional)
          <input
            className={inputClass}
            inputMode="numeric"
            value={qc.hours_of_use}
            onChange={(e) => patchQc({ hours_of_use: e.target.value })}
            placeholder="e.g. 500"
          />
        </label>
        <label className={labelClass}>
          Serial number confirmed on the unit?
          <YesNo value={qc.serial_confirmed} onChange={(v) => patchQc({ serial_confirmed: v })} />
        </label>
        {nav(qcComplete, () => {
          setChosenGrade(null);
          setStep(2);
        })}
      </div>
    );
  }

  // Step 2 — grade
  if (step === 2) {
    if (suggestedGrade === "poor") {
      return (
        <div>
          {stepHeader}
          <div className="rounded-xl border border-[#5c1a1a] bg-[#220d0d] p-4">
            <h2 className="text-base font-semibold text-white">{POOR_NAME}</h2>
            <p className="mt-2 text-sm text-[#bbb]">
              Gear that doesn&apos;t power on and produce full output is graded {POOR_NAME} —
              outside the A–D scale. {POOR_DEFINITION}
            </p>
            <p className="mt-2 text-sm text-[#bbb]">
              For-parts listings aren&apos;t supported yet. For now, only functional gear can be
              listed — if the unit does power on, go back and correct the checklist.
            </p>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="button" onClick={() => setStep(1)} className={secondaryBtn}>
              Back to checklist
            </button>
            <Link href="/sell" className={`${secondaryBtn} text-center`}>
              Seller home
            </Link>
          </div>
        </div>
      );
    }
    const effective = chosenGrade ?? (suggestedGrade as Grade | null);
    return (
      <div>
        {stepHeader}
        {suggestedGrade && (
          <p className="mb-4 text-sm text-[#bbb]">
            Based on your checklist, suggested grade:{" "}
            <span className="font-semibold text-[#22ee77]">
              {suggestedGrade} — {GRADE_NAMES[suggestedGrade as Grade]}
            </span>
          </p>
        )}
        <div className="grid gap-2">
          {GRADES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setChosenGrade(g)}
              className={`${choiceBtn(effective === g)} text-left`}
            >
              <span className="font-semibold">
                {g} — {GRADE_NAMES[g]}
              </span>
              {g === suggestedGrade && (
                <span className="ml-2 text-xs text-[#22ee77]">suggested</span>
              )}
              <span className="mt-1 block text-xs font-normal text-[#888]">
                {GRADE_DEFINITIONS[g]}
              </span>
            </button>
          ))}
        </div>
        {effective && effective !== suggestedGrade && (
          <p className="mt-3 text-xs text-[#c9a227]">
            You&apos;re adjusting the suggested grade — that&apos;s fine, but it gets flagged for a
            second look in admin review.
          </p>
        )}
        {nav(effective !== null, () => {
          setChosenGrade(effective);
          setStep(3);
        })}
      </div>
    );
  }

  // Step 3 — details
  if (step === 3) {
    return (
      <div>
        {stepHeader}
        <label className={labelClass}>
          Listing title
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className={labelClass}>
          Description (optional — AI-assist coming later)
          <textarea
            className={inputClass}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition notes, usage history, what's included…"
          />
        </label>
        <label className={labelClass}>
          Known issues (required — &quot;None disclosed&quot; if none)
          <textarea
            className={inputClass}
            rows={2}
            value={knownIssuesText}
            onChange={(e) => setKnownIssuesText(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className={labelClass}>
            Quantity
            <input
              className={inputClass}
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Zip code (gear location)
            <input
              className={inputClass}
              inputMode="numeric"
              maxLength={5}
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="37203"
            />
          </label>
          <label className={labelClass}>
            Year of manufacture (optional)
            <input
              className={inputClass}
              inputMode="numeric"
              value={yearOfManufacture}
              onChange={(e) => setYearOfManufacture(e.target.value)}
            />
          </label>
          <label className={labelClass}>
            Purchase year (optional)
            <input
              className={inputClass}
              inputMode="numeric"
              value={purchaseYear}
              onChange={(e) => setPurchaseYear(e.target.value)}
            />
          </label>
        </div>
        <label className={labelClass}>
          Serial numbers (optional — comma-separated for multiple units)
          <textarea
            className={inputClass}
            rows={2}
            value={serialNumbers}
            onChange={(e) => setSerialNumbers(e.target.value)}
          />
        </label>
        {nav(detailsValid)}
      </div>
    );
  }

  // Step 4 — photos (deferred stub)
  if (step === 4) {
    return (
      <div>
        {stepHeader}
        <div className="rounded-xl border border-[#222] bg-[#111] p-4">
          <h2 className="text-sm font-semibold text-white">Photos — coming before launch</h2>
          <p className="mt-2 text-xs text-[#888]">
            Guided photo capture (8 shots minimum, powered-on test, serial label) ships with the
            mobile photo flow. During this build phase, listings submit without photos and admin
            review covers the gap.
          </p>
        </div>
        {nav(true)}
      </div>
    );
  }

  // Step 5 — pricing + listing type
  if (step === 5) {
    return (
      <div>
        {stepHeader}
        <label className={labelClass}>
          How do you want to sell it?
          <div className="mt-1.5 grid gap-2">
            <button
              type="button"
              onClick={() => setListingType("auction")}
              className={`${choiceBtn(listingType === "auction")} text-left`}
            >
              <span className="font-semibold">Friday auction</span>
              <span className="mt-1 block text-xs font-normal text-[#888]">
                Competitive bidding, closes Friday. 10% commission on the final sale price.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setListingType("buy_it_now")}
              className={`${choiceBtn(listingType === "buy_it_now")} text-left`}
            >
              <span className="font-semibold">Buy-it-now</span>
              <span className="mt-1 block text-xs font-normal text-[#888]">
                Fixed price, always available. Free for sellers during the launch phase.
              </span>
            </button>
          </div>
        </label>

        <div className="mb-4 rounded-xl border border-[#222] bg-[#111] p-3">
          {priceSuggestion?.has_data ? (
            <p className="text-xs text-[#bbb]">
              Suggested range for grade {chosenGrade}:{" "}
              <span className="font-semibold text-white">
                ${priceSuggestion.suggested_low?.toLocaleString()} — $
                {priceSuggestion.suggested_high?.toLocaleString()}
              </span>{" "}
              <span className="text-[#666]">({priceSuggestion.confidence} confidence)</span>
            </p>
          ) : (
            <p className="text-xs text-[#888]">
              Not enough market data yet for a suggested range — price it how you see fit.
              Suggestions sharpen as sales flow through the platform.
            </p>
          )}
        </div>

        <label className={labelClass}>
          {listingType === "auction"
            ? "Asking price (used as the buy-it-now price if the reserve isn't met)"
            : "Asking price"}
          <input
            className={inputClass}
            inputMode="decimal"
            value={askingPrice}
            onChange={(e) => setAskingPrice(e.target.value)}
            placeholder="USD"
          />
        </label>
        {listingType === "auction" && (
          <label className={labelClass}>
            Reserve price (optional — lowest bid you&apos;ll accept)
            <input
              className={inputClass}
              inputMode="decimal"
              value={reservePrice}
              onChange={(e) => setReservePrice(e.target.value)}
              placeholder="USD"
            />
          </label>
        )}
        {nav(pricingValid)}
      </div>
    );
  }

  // Step 6 — attestation + submit
  return (
    <div>
      {stepHeader}
      <div className="rounded-xl border border-[#222] bg-[#111] p-4 text-sm text-[#bbb]">
        <p>
          <span className="font-medium text-white">{title}</span> · Grade {chosenGrade}
          {chosenGrade ? ` (${GRADE_NAMES[chosenGrade]})` : ""} ·{" "}
          {listingType === "auction" ? "Friday auction" : "Buy-it-now"} · $
          {Number.isFinite(askingNum) ? askingNum.toLocaleString() : "—"}
        </p>
      </div>
      <label className="mt-4 flex items-start gap-3 rounded-xl border border-[#222] bg-[#111] p-4">
        <input
          type="checkbox"
          checked={attested}
          onChange={(e) => setAttested(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#22ee77]"
        />
        <span className="text-xs leading-relaxed text-[#bbb]">
          By listing this item you confirm it is accurately described and in the condition stated.
          You stand behind this listing and accept responsibility if the buyer raises a legitimate
          dispute. Misrepresentation may result in account suspension.
        </span>
      </label>
      {submitError && <p className="mt-3 text-sm text-[#ff4444]">{submitError}</p>}
      <div className="mt-5 flex gap-2">
        <button type="button" onClick={() => setStep(5)} className={secondaryBtn} disabled={submitting}>
          Back
        </button>
        <button
          type="button"
          disabled={!attested || submitting}
          onClick={submit}
          className={primaryBtn}
        >
          {submitting ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </div>
  );
}
