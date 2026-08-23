"use client";

import { useState } from "react";

// Seller onboarding: account type, business details, agreement, submit.
// Calls POST /api/auth/upgrade-to-seller; on success the parent re-routes
// (the user is now a seller). Functional-but-plain — design polish is a
// later phase.

const BUSINESS_TYPES = [
  { value: "rental_house", label: "Rental house" },
  { value: "integrator", label: "Integrator" },
  { value: "production_company", label: "Production company" },
  { value: "dealer", label: "Dealer" },
  { value: "other", label: "Other" },
] as const;

// ⚠️ PLACEHOLDER TEXT — pending attorney review (see legal-security.md,
// the 9 attorney questions). Do NOT treat this draft as final terms.
const AGREEMENT_PLACEHOLDER = [
  "You will describe every item accurately and stand behind the condition stated in your listings.",
  "Auction sales carry a 10% seller commission on the final sale price. Buy-it-now listings are free for sellers during the launch phase.",
  "Buyers and sellers may not transact directly outside the platform for 24 months after being introduced through it (non-circumvention).",
  "Misrepresenting gear, failing to fulfill a sale, or selling around the platform can lead to strikes, restrictions, or account suspension.",
  "Payouts run through Stripe. Funds from a sale are held in escrow until the buyer's inspection window closes.",
];

interface Props {
  token: string;
  // Login email, prefilled as the contact email (editable — a rental
  // house's ops contact often isn't the login account)
  defaultEmail?: string;
  onUpgraded: (anonymousUsername: string | null) => void;
}

export function OnboardingForm({ token, defaultEmail, onUpgraded }: Props) {
  const [accountType, setAccountType] = useState<"individual" | "business">("business");
  const [businessName, setBusinessName] = useState("");
  const [ein, setEin] = useState("");
  const [businessType, setBusinessType] = useState<string>("rental_house");
  const [website, setWebsite] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [displayLocation, setDisplayLocation] = useState("");
  // Contact identity — required for all sellers (0032), never buyer-visible
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState(defaultEmail ?? "");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("US");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusiness = accountType === "business";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);

    if (!agreed) {
      setError("You need to accept the seller agreement to continue.");
      return;
    }
    if (isBusiness && (businessName.trim() === "" || ein.trim() === "")) {
      setError("Business name and EIN are required for a business account.");
      return;
    }
    const contactComplete = [contactName, contactEmail, phone, addressLine1, city, stateRegion, postalCode]
      .every((v) => v.trim() !== "");
    if (!contactComplete) {
      setError("Contact name, email, phone, and address are required.");
      return;
    }

    setSubmitting(true);
    try {
      const years = parseInt(yearsInBusiness, 10);
      const res = await fetch("/api/auth/upgrade-to-seller", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
        body: JSON.stringify({
          account_type: accountType,
          agreement_accepted: true,
          contact_name: contactName.trim(),
          contact_email: contactEmail.trim(),
          phone: phone.trim(),
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() !== "" ? addressLine2.trim() : null,
          city: city.trim(),
          state: stateRegion.trim(),
          postal_code: postalCode.trim(),
          country: country.trim() !== "" ? country.trim() : "US",
          business_name: isBusiness ? businessName.trim() : null,
          ein: isBusiness ? ein.trim() : null,
          business_type: isBusiness ? businessType : null,
          website: isBusiness && website.trim() !== "" ? website.trim() : null,
          years_in_business: isBusiness && Number.isInteger(years) && years >= 0 ? years : null,
          display_location: displayLocation.trim() !== "" ? displayLocation.trim() : null,
        }),
      });
      const result = (await res.json()) as {
        ok?: boolean;
        error?: string;
        anonymous_username?: string;
      };

      if (!res.ok || !result.ok) {
        if (result.error === "already_seller") {
          // Parent re-routes to the seller view; nothing went wrong
          onUpgraded(null);
          return;
        }
        setError(
          result.error === "business_name_and_ein_required"
            ? "Business name and EIN are required for a business account."
            : result.error === "contact_details_required"
              ? "Contact name, email, phone, and address are required."
              : result.error === "rate_limited"
                ? "Too many attempts — give it a moment and try again."
                : "Something went wrong setting up your seller account. Try again."
        );
        return;
      }
      onUpgraded(result.anonymous_username ?? null);
    } catch (e) {
      console.error("upgrade-to-seller failed:", e);
      setError("Something went wrong setting up your seller account. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm normal-case text-white placeholder-[#444] outline-none focus:border-[#3a3a3a]";
  const labelClass = "mb-3 block text-xs font-medium uppercase tracking-wider text-[#999]";

  return (
    <form onSubmit={submit} className="rounded-xl border border-[#222] bg-[#111] p-4">
      {/* Account type */}
      <div className={labelClass}>
        Account type
        <div className="mt-1.5 grid grid-cols-2 gap-2 normal-case">
          {(["business", "individual"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setAccountType(t)}
              aria-pressed={accountType === t}
              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                accountType === t
                  ? "border-[#22ee77] bg-[#0d2218] text-white"
                  : "border-[#2a2a2a] text-[#999] hover:border-[#3a3a3a]"
              }`}
            >
              {t === "business" ? "Business" : "Individual"}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] normal-case tracking-normal text-[#666]">
          {isBusiness
            ? "Verified businesses start at a higher trust tier and get higher listing limits."
            : "Individual accounts can sell up to 5 active listings at a time."}
        </p>
      </div>

      {isBusiness && (
        <>
          <label className={labelClass}>
            Business name <span className="text-[#ff4444]">*</span>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              required
              autoComplete="organization"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            EIN <span className="text-[#ff4444]">*</span>
            <input
              value={ein}
              onChange={(e) => setEin(e.target.value)}
              required
              placeholder="12-3456789"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Business type
            <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={inputClass}>
              {BUSINESS_TYPES.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Website <span className="text-[#555]">(optional)</span>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              autoComplete="url"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Years in business <span className="text-[#555]">(optional)</span>
            <input
              value={yearsInBusiness}
              onChange={(e) => setYearsInBusiness(e.target.value)}
              inputMode="numeric"
              className={inputClass}
            />
          </label>
        </>
      )}

      {/* Contact identity — required for all sellers. autocomplete attrs
          let the browser fill the whole block in one tap. */}
      <div className="mb-3 mt-4 border-t border-[#222] pt-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-white">
          Contact details
        </h2>
        <p className="mb-3 mt-1 text-[11px] leading-relaxed text-[#666]">
          Required for a verified marketplace — buyers and sellers moving serious gear through
          escrow expect it. Never shown to buyers until a sale is funded.
        </p>

        <label className={labelClass}>
          Full name <span className="text-[#ff4444]">*</span>
          <input
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
            required
            autoComplete="name"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Contact email <span className="text-[#ff4444]">*</span>
          <input
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            required
            type="email"
            autoComplete="email"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Phone <span className="text-[#ff4444]">*</span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            type="tel"
            autoComplete="tel"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Street address <span className="text-[#ff4444]">*</span>
          <input
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
            autoComplete="address-line1"
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Suite / unit <span className="text-[#555]">(optional)</span>
          <input
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            autoComplete="address-line2"
            className={inputClass}
          />
        </label>
        <div className="grid grid-cols-[2fr_1fr_1fr] gap-2">
          <label className={labelClass}>
            City <span className="text-[#ff4444]">*</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              autoComplete="address-level2"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            State <span className="text-[#ff4444]">*</span>
            <input
              value={stateRegion}
              onChange={(e) => setStateRegion(e.target.value)}
              required
              autoComplete="address-level1"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            ZIP <span className="text-[#ff4444]">*</span>
            <input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              autoComplete="postal-code"
              className={inputClass}
            />
          </label>
        </div>
        <label className={labelClass}>
          Country
          <input
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            autoComplete="country"
            className={inputClass}
          />
        </label>
      </div>

      <label className={labelClass}>
        General location shown to buyers <span className="text-[#555]">(optional)</span>
        <input
          value={displayLocation}
          onChange={(e) => setDisplayLocation(e.target.value)}
          placeholder={'e.g. "Nashville, TN rental house"'}
          className={inputClass}
        />
        <p className="mt-1.5 text-[11px] normal-case tracking-normal text-[#666]">
          Your company name and exact address are never shown to buyers. You&apos;ll get a
          platform-assigned username; a general location is optional and earns a small trust boost.
        </p>
      </label>

      {/* Seller agreement — PLACEHOLDER pending attorney review */}
      <div className="mb-3 mt-4 rounded-lg border border-[#2a2a2a] bg-[#0a0a0a]">
        <div className="border-b border-[#2a2a2a] px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#999]">
            Seller agreement
          </span>
          <span className="ml-2 rounded bg-[#3a2a00] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#ffb020]">
            Placeholder — pending attorney review
          </span>
        </div>
        <div className="max-h-44 overflow-y-auto px-3 py-2.5">
          <p className="mb-2 text-[11px] italic text-[#ffb020]">
            This is draft summary language, not final terms. The binding seller agreement is being
            prepared with counsel and will replace this text before launch.
          </p>
          <ul className="list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[#999]">
            {AGREEMENT_PLACEHOLDER.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>

      <label className="mb-4 flex items-start gap-2.5 text-xs leading-relaxed text-[#bbb]">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[#22ee77]"
        />
        <span>I have read and accept the seller agreement.</span>
      </label>

      <button
        type="submit"
        disabled={submitting || !agreed}
        className="w-full rounded-lg bg-[#22ee77] px-5 py-2.5 text-sm font-semibold text-[#0a0a0a] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Setting up…" : "Start selling"}
      </button>

      {error && (
        <div
          role="alert"
          className="mt-3 rounded-lg border border-[#6a1515] bg-[#2a0a0a] px-3 py-2 text-xs text-[#ff4444]"
        >
          {error}
        </div>
      )}
    </form>
  );
}
