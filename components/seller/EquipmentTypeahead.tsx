"use client";

import { useEffect, useRef, useState } from "react";

// Master-catalog typeahead — step 1 of the gear entry form. Debounced
// search against GET /api/equipment/search; selecting a result locks in a
// master_equipment_id. "Can't find it?" opens manual manufacturer/model
// entry (the match_or_queue path at submit time). Functional-but-plain —
// design polish is a later phase.

export interface EquipmentResult {
  id: string;
  manufacturer: string;
  model: string;
  category: string;
  score: number;
}

export type EquipmentSelection =
  | { kind: "catalog"; equipment: EquipmentResult }
  | { kind: "manual"; manufacturer: string; model: string };

interface Props {
  token: string;
  selection: EquipmentSelection | null;
  onSelect: (selection: EquipmentSelection | null) => void;
}

const inputClass =
  "mt-1.5 w-full rounded-lg border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-[#444] outline-none focus:border-[#3a3a3a]";
const labelClass = "mb-3 block text-xs font-medium uppercase tracking-wider text-[#999]";

export function EquipmentTypeahead({ token, selection, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EquipmentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  // Distinguishes "haven't searched" from "searched, nothing found"
  const [searched, setSearched] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualMfr, setManualMfr] = useState("");
  const [manualModel, setManualModel] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearched(false);
      setSearching(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/equipment/search?q=${encodeURIComponent(q)}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const body = (await res.json()) as { results?: EquipmentResult[] };
        setResults(body.results ?? []);
        setSearchError(false);
        setSearched(true);
        setSearching(false);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setSearchError(true);
        setSearched(true);
        setSearching(false);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, token]);

  // ---- Locked-in state --------------------------------------------------
  if (selection) {
    return (
      <div className="rounded-xl border border-[#1a5c38] bg-[#0d2218] p-4">
        {selection.kind === "catalog" ? (
          <>
            <p className="text-sm font-semibold text-white">
              {selection.equipment.manufacturer} {selection.equipment.model}
            </p>
            <p className="mt-0.5 text-xs text-[#888]">
              From the equipment database · {selection.equipment.category}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-white">
              {selection.manufacturer} {selection.model}
            </p>
            <p className="mt-0.5 text-xs text-[#c9a227]">
              Not matched to the database yet — we&apos;ll try to match it when you submit. If
              it&apos;s a new product, it goes to review first.
            </p>
          </>
        )}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="mt-3 rounded-lg border border-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#999] hover:border-[#3a3a3a] hover:text-white"
        >
          Change
        </button>
      </div>
    );
  }

  // ---- Manual entry ("can't find it?") ----------------------------------
  if (manualMode) {
    return (
      <div className="rounded-xl border border-[#222] bg-[#111] p-4">
        <p className="text-sm font-semibold text-white">Enter it manually</p>
        <p className="mt-1 text-xs text-[#888]">
          We&apos;ll match it against the database when you submit. New products go through admin
          review before the listing can be created.
        </p>
        <label className={`${labelClass} mt-4`}>
          Manufacturer
          <input
            className={inputClass}
            value={manualMfr}
            onChange={(e) => setManualMfr(e.target.value)}
            placeholder="e.g. DiGiCo"
          />
        </label>
        <label className={labelClass}>
          Model
          <input
            className={inputClass}
            value={manualModel}
            onChange={(e) => setManualModel(e.target.value)}
            placeholder="e.g. SD12"
          />
        </label>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            disabled={manualMfr.trim() === "" || manualModel.trim() === ""}
            onClick={() =>
              onSelect({
                kind: "manual",
                manufacturer: manualMfr.trim(),
                model: manualModel.trim(),
              })
            }
            className="rounded-lg bg-[#22ee77] px-4 py-2 text-sm font-semibold text-[#0a0a0a] disabled:opacity-40"
          >
            Use this
          </button>
          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="rounded-lg border border-[#2a2a2a] px-4 py-2 text-sm font-medium text-[#999] hover:border-[#3a3a3a] hover:text-white"
          >
            Back to search
          </button>
        </div>
      </div>
    );
  }

  // ---- Search ------------------------------------------------------------
  return (
    <div>
      <label className={labelClass}>
        What are you selling?
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search manufacturer or model — e.g. DiGiCo SD12"
          autoFocus
        />
      </label>

      {searching && <p className="mt-2 text-xs text-[#666]">Searching…</p>}
      {searchError && !searching && (
        <p className="mt-2 text-xs text-[#ff4444]">
          Search isn&apos;t responding — try again, or enter it manually below.
        </p>
      )}

      {!searching && !searchError && results.length > 0 && (
        <ul className="mt-2 overflow-hidden rounded-xl border border-[#222] bg-[#111]">
          {results.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect({ kind: "catalog", equipment: r })}
                className="block w-full border-b border-[#1a1a1a] px-4 py-2.5 text-left last:border-b-0 hover:bg-[#181818]"
              >
                <span className="text-sm text-white">
                  {r.manufacturer} <span className="font-semibold">{r.model}</span>
                </span>
                <span className="ml-2 text-xs text-[#666]">{r.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!searching && !searchError && searched && results.length === 0 && (
        <p className="mt-2 text-xs text-[#888]">No matches for “{query.trim()}”.</p>
      )}

      {(searched || query.trim().length >= 2) && (
        <button
          type="button"
          onClick={() => setManualMode(true)}
          className="mt-3 text-xs font-medium text-[#22ee77] hover:underline"
        >
          Can&apos;t find it? Enter it manually →
        </button>
      )}
    </div>
  );
}
