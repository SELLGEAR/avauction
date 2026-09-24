"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_BLUR_REGIONS, MIN_BLUR_REGION_SIZE, type BlurRegion } from "@/lib/photos/rules";

// Blur box editor for one photo. Shows the CLEAN editor image (signed,
// owner only) with the current regions as boxes the seller can move,
// resize, add (drag on empty space) or delete. Coordinates are kept
// normalized 0..1 the whole time, so nothing depends on the rendered
// size. Pointer events, so it works with a finger on the warehouse floor.

interface Props {
  imageUrl: string;
  regions: BlurRegion[];
  suggested: BlurRegion[]; // what detection proposed, for the "restore" action
  detectionNote: string | null;
  isSerialShot: boolean;
  onChange: (regions: BlurRegion[]) => void;
  onClose: () => void;
}

type Drag =
  | { kind: "move"; index: number; startX: number; startY: number; orig: BlurRegion }
  | { kind: "resize"; index: number; orig: BlurRegion }
  | { kind: "draw"; startX: number; startY: number; index: number };

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function BlurEditor({ imageUrl, regions, suggested, detectionNote, isSerialShot, onChange, onClose }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [imgError, setImgError] = useState(false);

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if ((e.key === "Delete" || e.key === "Backspace") && selected !== null) {
        onChange(regions.filter((_, i) => i !== selected));
        setSelected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onChange, regions, selected]);

  // Pointer position -> normalized coords within the image frame
  function norm(e: { clientX: number; clientY: number }) {
    const r = frameRef.current?.getBoundingClientRect();
    if (!r || r.width === 0 || r.height === 0) return { x: 0, y: 0 };
    return { x: clamp01((e.clientX - r.left) / r.width), y: clamp01((e.clientY - r.top) / r.height) };
  }

  function update(index: number, next: BlurRegion) {
    onChange(regions.map((r, i) => (i === index ? next : r)));
  }

  function onFramePointerDown(e: React.PointerEvent) {
    if (e.button !== 0) return;
    if (regions.length >= MAX_BLUR_REGIONS) return;
    const p = norm(e);
    const index = regions.length;
    onChange([...regions, { x: p.x, y: p.y, w: 0, h: 0, label: "manual" }]);
    setSelected(index);
    setDrag({ kind: "draw", startX: p.x, startY: p.y, index });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = norm(e);
    if (drag.kind === "draw") {
      const x = Math.min(drag.startX, p.x);
      const y = Math.min(drag.startY, p.y);
      update(drag.index, { ...regions[drag.index], x, y, w: Math.abs(p.x - drag.startX), h: Math.abs(p.y - drag.startY) });
    } else if (drag.kind === "move") {
      const dx = p.x - drag.startX;
      const dy = p.y - drag.startY;
      const x = clamp01(Math.min(drag.orig.x + dx, 1 - drag.orig.w));
      const y = clamp01(Math.min(drag.orig.y + dy, 1 - drag.orig.h));
      update(drag.index, { ...drag.orig, x, y });
    } else if (drag.kind === "resize") {
      const w = clamp01(p.x - drag.orig.x);
      const h = clamp01(p.y - drag.orig.y);
      update(drag.index, { ...drag.orig, w: Math.max(w, MIN_BLUR_REGION_SIZE), h: Math.max(h, MIN_BLUR_REGION_SIZE) });
    }
  }

  function onPointerUp() {
    if (!drag) return;
    // Drop a draw that never became a box
    if (drag.kind === "draw") {
      const r = regions[drag.index];
      if (!r || r.w < MIN_BLUR_REGION_SIZE * 2 || r.h < MIN_BLUR_REGION_SIZE * 2) {
        onChange(regions.filter((_, i) => i !== drag.index));
        setSelected(null);
      }
    }
    setDrag(null);
  }

  const pct = (v: number) => `${v * 100}%`;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Edit blur boxes">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-white">Blur anything that identifies you</h2>
          <p className="mt-0.5 text-xs text-[#999]">
            Company names, logos, asset tags, stencils, spray paint, phone numbers. Drag on the photo to
            add a box. Drag a box to move it, the corner to resize, ✕ to remove.
            {isSerialShot && (
              <span className="text-[#c9a227]"> This is the serial-label shot: keep the serial plate itself readable.</span>
            )}
          </p>
          {detectionNote && <p className="mt-0.5 text-xs text-[#c9a227]">{detectionNote}</p>}
        </div>
        <button type="button" onClick={onClose} className="rounded-lg bg-[#22ee77] px-4 py-2 text-sm font-semibold text-[#0a0a0a]">
          Done
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center">
        <div
          ref={frameRef}
          className="relative max-h-full max-w-full select-none touch-none"
          onPointerDown={onFramePointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {imgError ? (
            <div className="flex h-64 w-80 items-center justify-center text-xs text-[#888]">Preview unavailable</div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt=""
              draggable={false}
              onError={() => setImgError(true)}
              className="block max-h-[70vh] max-w-full object-contain"
            />
          )}
          {regions.map((r, i) => (
            <div
              key={i}
              onPointerDown={(e) => {
                e.stopPropagation();
                setSelected(i);
                const p = norm(e);
                setDrag({ kind: "move", index: i, startX: p.x, startY: p.y, orig: r });
                (frameRef.current as HTMLElement | null)?.setPointerCapture(e.pointerId);
              }}
              style={{ left: pct(r.x), top: pct(r.y), width: pct(r.w), height: pct(r.h) }}
              className={`absolute cursor-move border-2 bg-[#22ee77]/20 backdrop-blur-sm ${
                selected === i ? "border-[#22ee77]" : "border-white/70"
              }`}
              title={r.label ?? ""}
            >
              {r.label && r.label !== "manual" && (
                <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-black/70 px-1 text-[10px] text-white">
                  {r.label}
                </span>
              )}
              <button
                type="button"
                aria-label="Remove box"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(regions.filter((_, j) => j !== i));
                  setSelected(null);
                }}
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[#ff4444] text-[11px] font-bold leading-5 text-white"
              >
                ✕
              </button>
              <div
                aria-label="Resize"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSelected(i);
                  setDrag({ kind: "resize", index: i, orig: r });
                  (frameRef.current as HTMLElement | null)?.setPointerCapture(e.pointerId);
                }}
                className="absolute -bottom-2 -right-2 h-5 w-5 cursor-nwse-resize rounded-sm border-2 border-[#22ee77] bg-[#0a0a0a]"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#999]">
        <span>
          {regions.length} box{regions.length === 1 ? "" : "es"} · max {MAX_BLUR_REGIONS}
        </span>
        {suggested.length > 0 && (
          <button
            type="button"
            onClick={() => onChange(suggested)}
            className="rounded border border-[#2a2a2a] px-2 py-1 hover:text-white"
          >
            Restore {suggested.length} suggested
          </button>
        )}
        {regions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onChange([]);
              setSelected(null);
            }}
            className="rounded border border-[#2a2a2a] px-2 py-1 hover:text-white"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}
