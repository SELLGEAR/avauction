"use client";

import { useState } from "react";
import type { AuctionSort } from "@/lib/auction/types";

const OPTIONS: { value: AuctionSort; label: string }[] = [
  { value: "ending_soonest", label: "Ending soonest" },
  { value: "most_watched", label: "Most watched" },
  { value: "nearest", label: "Closest to me" },
  { value: "price_low", label: "Price" },
];

interface SortChipsProps {
  sort: AuctionSort;
  hasZip: boolean;
  onSelect: (sort: AuctionSort) => void;
  onSubmitZip: (zip: string) => void;
}

// "Closest to me" needs a buyer zip that search_listings() requires for
// sort=nearest; there's no stored profile zip in the schema (see
// 0006_create_users_sellers.sql — users has no zip field), so this is an
// inline prompt, remembered client-side by the parent page. Clicking the
// chip while nearest is already active reopens the prompt — that's the
// only path to change a stored zip or retry after a failed nearest search.
export function SortChips({ sort, hasZip, onSelect, onSubmitZip }: SortChipsProps) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [zipInput, setZipInput] = useState("");
  const [zipError, setZipError] = useState(false);

  function handleClick(value: AuctionSort) {
    if (value === "nearest" && (!hasZip || sort === "nearest")) {
      setPromptOpen(true);
      return;
    }
    setPromptOpen(false);
    onSelect(value);
  }

  function handleZipSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{5}$/.test(zipInput)) {
      setZipError(true);
      return;
    }
    setZipError(false);
    setPromptOpen(false);
    onSubmitZip(zipInput);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-xs text-[#666]">Sort</span>
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => handleClick(opt.value)}
          className={
            sort === opt.value
              ? "rounded-full border border-[#2563eb] bg-[#1a3a7a] px-[13px] py-1.5 text-xs font-medium text-white"
              : "rounded-full border border-[#2a2a2a] bg-[#141414] px-[13px] py-1.5 text-xs text-[#999] hover:border-[#3a3a3a]"
          }
        >
          {opt.label}
        </button>
      ))}

      {promptOpen && (
        <form onSubmit={handleZipSubmit} className="flex items-center gap-1.5">
          <input
            autoFocus
            inputMode="numeric"
            placeholder="Zip code"
            value={zipInput}
            onChange={(e) => {
              setZipInput(e.target.value);
              setZipError(false);
            }}
            className="w-24 rounded-md border border-[#2a2a2a] bg-[#0a0a0a] px-2.5 py-1.5 text-xs text-white outline-none focus:border-[#2563eb]"
          />
          <button
            type="submit"
            className="rounded-md border border-[#2563eb] bg-[#1a3a7a] px-2.5 py-1.5 text-xs font-medium text-white"
          >
            Go
          </button>
          {zipError && <span className="text-xs text-[#ff4444]">5 digits</span>}
        </form>
      )}
    </div>
  );
}
