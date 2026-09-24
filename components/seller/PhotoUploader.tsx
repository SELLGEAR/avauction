"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BlurEditor } from "@/components/seller/BlurEditor";
import {
  GUIDED_SHOT_ORDER,
  MAX_PHOTO_BYTES,
  MAX_PHOTOS,
  MIN_PHOTOS,
  PHOTO_TYPES,
  REJECTION_MESSAGES,
  REQUIRED_PHOTO_TYPES,
  missingRequiredTypes,
  validateFile,
  type BlurRegion,
  type DetectionRecord,
  type PhotoType,
  type UploadedPhoto,
} from "@/lib/photos/rules";

// Drag-and-drop multi-photo uploader for the gear entry form.
//
// Each file: browser-side validation (type/size) -> POST /api/photos for a
// signature -> XHR straight to Cloudinary with progress -> tile. Nothing
// binary touches our server. Failures are per-file: an oversized or
// wrong-type file is rejected before any request, a network/Cloudinary
// failure keeps the File in the tile with a Retry button, and the rest of
// the batch carries on. Continue is gated by the parent on the rules
// (min count + required shot types) over SUCCESSFUL uploads only.
//
// Order is the seller's: drag tiles (desktop) or use the arrows (phone).
// Position 0 is the cover — the browse card and the listing hero both
// read the first approved photo by position. "Make cover" moves to front.
// Thumbnails are signed, watermarked delivery URLs (type=authenticated —
// nothing is viewable without a server signature), so the seller sees
// exactly what buyers will see; the original upload is never altered.
//
// Anonymity layer: once a photo lands, POST /api/photos/analyze runs a
// vision scan for seller-identifying marks (company names, logos, asset
// tags, stencils, spray paint) and returns suggested blur boxes. They
// appear on the tile immediately; the seller can edit them in the
// BlurEditor before submitting. The scan is fail-open — if it errors,
// times out or isn't configured, the tile just shows "scan unavailable"
// and the seller draws boxes by hand. Regions ride along with the photo
// at submit and are applied on delivery.

interface SignResponse {
  cloud_name: string;
  api_key: string;
  upload_url: string;
  timestamp: number;
  signature: string;
  public_id: string;
  type: string;
  allowed_formats: string;
  moderation?: string;
}

interface PreviewResponse {
  thumb_url: string;
  editor_url: string;
}

interface CloudinaryUploadResponse {
  public_id: string;
  version: number;
  signature: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  secure_url: string;
  moderation?: { status: string; kind: string }[];
}

type TileStatus = "queued" | "uploading" | "done" | "error";

export interface PhotoTile {
  key: string;
  file: File | null; // kept until upload succeeds so Retry can resend
  name: string;
  previewUrl: string; // object URL while uploading, thumb URL once done
  status: TileStatus;
  progress: number; // 0–100
  error: string | null;
  photoType: PhotoType;
  // Clean, capped-size signed URL for the blur editor (owner only)
  editorUrl: string | null;
  uploaded: Omit<UploadedPhoto, "photo_type" | "position" | "blur_regions" | "detection"> | null;
  // Anonymity blur: current boxes (seller-edited) + what the scan said
  blurRegions: BlurRegion[];
  detection: DetectionRecord | null; // null = scan not finished yet
}

interface Props {
  token: string;
  tiles: PhotoTile[];
  onChange: (next: PhotoTile[] | ((prev: PhotoTile[]) => PhotoTile[])) => void;
}

const MAX_CONCURRENT = 3;

const SIGN_ERRORS: Record<string, string> = {
  unauthorized: "Your session expired — sign in again.",
  not_a_seller: "Your account isn't set up to sell yet.",
  rate_limited: "Too many uploads at once — wait a moment and retry.",
  photos_not_configured: "Photo uploads aren't available right now. Try again later.",
};

// The next guided shot type that isn't already assigned
function suggestType(existing: PhotoTile[]): PhotoType {
  const used = new Set(existing.map((t) => t.photoType));
  return GUIDED_SHOT_ORDER.find((t) => !used.has(t)) ?? "other";
}

let keyCounter = 0;
const nextKey = () => `p${Date.now().toString(36)}-${keyCounter++}`;

export function uploadedPhotosFromTiles(tiles: PhotoTile[]): UploadedPhoto[] {
  return tiles
    .filter((t) => t.status === "done" && t.uploaded)
    .map((t, i) => ({
      ...t.uploaded!,
      photo_type: t.photoType,
      position: i,
      blur_regions: t.blurRegions,
      detection: t.detection ?? { status: "skipped", suggested: [], model: null, note: "scan not finished" },
    }));
}

// ok = enough successful uploads, every required shot type present, and
// nothing still in flight (a Continue mid-upload would silently drop the
// unfinished photo from the payload)
export function photoRulesSatisfied(tiles: PhotoTile[]): {
  ok: boolean;
  count: number;
  missing: string[];
  busy: number;
} {
  const done = tiles.filter((t) => t.status === "done");
  const busy = tiles.filter((t) => t.status === "uploading" || t.status === "queued").length;
  const missing = missingRequiredTypes(done.map((t) => ({ photo_type: t.photoType })));
  return { ok: done.length >= MIN_PHOTOS && missing.length === 0 && busy === 0, count: done.length, missing, busy };
}

export function PhotoUploader({ token, tiles, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);
  const inFlight = useRef(0);
  const xhrs = useRef(new Map<string, XMLHttpRequest>());
  const [editing, setEditing] = useState<string | null>(null); // tile key in the BlurEditor
  const previewTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  // Latest tiles for timers/async callbacks that outlive a render
  const tilesRef = useRef(tiles);
  tilesRef.current = tiles;

  const patch = useCallback(
    (key: string, p: Partial<PhotoTile>) =>
      onChange((prev) => prev.map((t) => (t.key === key ? { ...t, ...p } : t))),
    [onChange]
  );

  // Warn before leaving mid-upload
  useEffect(() => {
    const busy = tiles.some((t) => t.status === "uploading" || t.status === "queued");
    if (!busy) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [tiles]);

  const uploadOne = useCallback(
    async (tile: PhotoTile) => {
      if (!tile.file) return;
      inFlight.current++;
      patch(tile.key, { status: "uploading", progress: 0, error: null });
      try {
        const signRes = await fetch("/api/photos", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        const signBody = (await signRes.json().catch(() => ({}))) as SignResponse & { error?: string };
        if (!signRes.ok) {
          throw new Error(SIGN_ERRORS[signBody.error ?? ""] ?? "Couldn't start the upload. Retry.");
        }

        const form = new FormData();
        form.append("file", tile.file);
        form.append("api_key", signBody.api_key);
        form.append("timestamp", String(signBody.timestamp));
        form.append("signature", signBody.signature);
        form.append("public_id", signBody.public_id);
        form.append("type", signBody.type);
        form.append("allowed_formats", signBody.allowed_formats);
        if (signBody.moderation) form.append("moderation", signBody.moderation);

        const result = await new Promise<CloudinaryUploadResponse>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrs.current.set(tile.key, xhr);
          xhr.open("POST", signBody.upload_url);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              patch(tile.key, { progress: Math.round((ev.loaded / ev.total) * 100) });
            }
          };
          xhr.onload = () => {
            xhrs.current.delete(tile.key);
            let body: unknown = null;
            try {
              body = JSON.parse(xhr.responseText);
            } catch {
              /* non-JSON */
            }
            if (xhr.status >= 200 && xhr.status < 300 && body) {
              resolve(body as CloudinaryUploadResponse);
            } else {
              const msg =
                (body as { error?: { message?: string } } | null)?.error?.message ??
                `Upload failed (${xhr.status || "network"}).`;
              // Cloudinary's allowed_formats rejection reads like
              // "Invalid image file" / "...format not allowed" — surface it
              reject(new Error(msg));
            }
          };
          xhr.onerror = () => {
            xhrs.current.delete(tile.key);
            reject(new Error("Upload failed — check your connection and retry."));
          };
          xhr.onabort = () => {
            xhrs.current.delete(tile.key);
            reject(new Error("aborted"));
          };
          xhr.send(form);
        });

        // Moderation add-on (when enabled): a rejected image is never
        // shown or submitted. CLAUDE.md wording.
        const modStatus = result.moderation?.[0]?.status;
        if (modStatus === "rejected") {
          void fetch("/api/photos", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ public_id: result.public_id }),
          }).catch(() => undefined);
          throw new Error("This image was rejected. Please upload appropriate photos of your gear only.");
        }

        // type=authenticated: the upload response's secure_url is not
        // viewable without a server signature — ask for signed previews
        const previewRes = await fetch("/api/photos/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            public_id: result.public_id,
            version: result.version,
            format: result.format,
            width: result.width,
            height: result.height,
            blur_regions: [],
          }),
        });
        const preview = (await previewRes.json().catch(() => ({}))) as Partial<PreviewResponse>;
        if (!previewRes.ok || !preview.thumb_url || !preview.editor_url) {
          throw new Error("Uploaded, but the preview couldn't be prepared. Retry.");
        }

        if (tile.previewUrl.startsWith("blob:")) URL.revokeObjectURL(tile.previewUrl);
        patch(tile.key, {
          status: "done",
          progress: 100,
          file: null,
          previewUrl: preview.thumb_url,
          editorUrl: preview.editor_url,
          uploaded: {
            public_id: result.public_id,
            version: result.version,
            signature: result.signature,
            format: result.format,
            width: result.width,
            height: result.height,
            bytes: result.bytes,
          },
        });
        void analyze(tile.key, result, tile.photoType);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg !== "aborted") patch(tile.key, { status: "error", error: msg });
      } finally {
        inFlight.current--;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [patch, token]
  );

  // Vision scan for seller-identifying marks. Fail-open: any non-200 or
  // thrown error becomes a "failed" record and the seller carries on.
  async function analyze(key: string, result: CloudinaryUploadResponse, photoType: PhotoType) {
    let record: DetectionRecord = { status: "failed", suggested: [], model: null, note: "scan unavailable" };
    try {
      const res = await fetch("/api/photos/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          public_id: result.public_id, version: result.version, format: result.format, photo_type: photoType,
        }),
      });
      if (res.ok) {
        const body = (await res.json()) as Partial<DetectionRecord>;
        if (body && typeof body.status === "string") {
          record = {
            status: body.status,
            suggested: Array.isArray(body.suggested) ? body.suggested : [],
            model: body.model ?? null,
            note: body.note ?? null,
          };
        }
      }
    } catch {
      /* fail-open */
    }
    onChange((prev) => {
      const t = prev.find((x) => x.key === key);
      if (!t) return prev; // removed meanwhile
      // Suggested boxes become the starting set unless the seller already drew some
      const regions = t.blurRegions.length === 0 ? record.suggested : t.blurRegions;
      return prev.map((x) => (x.key === key ? { ...x, detection: record, blurRegions: regions } : x));
    });
    if (record.suggested.length > 0) schedulePreview(key);
  }

  // Refresh a tile's watermarked thumb to reflect its current blur boxes
  // (debounced — the editor fires on every drag move)
  function schedulePreview(key: string) {
    const existing = previewTimers.current.get(key);
    if (existing) clearTimeout(existing);
    previewTimers.current.set(
      key,
      setTimeout(async () => {
        previewTimers.current.delete(key);
        const snapshot = tilesRef.current.find((x) => x.key === key);
        if (!snapshot?.uploaded) return;
        try {
          const res = await fetch("/api/photos/preview", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              public_id: snapshot.uploaded.public_id,
              version: snapshot.uploaded.version,
              format: snapshot.uploaded.format,
              width: snapshot.uploaded.width,
              height: snapshot.uploaded.height,
              blur_regions: snapshot.blurRegions,
            }),
          });
          const body = (await res.json().catch(() => ({}))) as Partial<PreviewResponse>;
          if (res.ok && body.thumb_url) patch(key, { previewUrl: body.thumb_url });
        } catch {
          /* keep the old thumb */
        }
      }, 400)
    );
  }

  function setRegions(key: string, regions: BlurRegion[]) {
    patch(key, { blurRegions: regions });
    schedulePreview(key);
  }

  // Pump the queue: at most MAX_CONCURRENT uploads in flight
  useEffect(() => {
    const queued = tiles.filter((t) => t.status === "queued");
    const slots = MAX_CONCURRENT - inFlight.current;
    if (queued.length === 0 || slots <= 0) return;
    for (const t of queued.slice(0, slots)) void uploadOne(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles]);

  function addFiles(list: FileList | File[]) {
    const files = Array.from(list);
    if (files.length === 0) return;
    setBatchNotice(null);
    onChange((prev) => {
      const room = MAX_PHOTOS - prev.length;
      const accepted = files.slice(0, Math.max(room, 0));
      const notices: string[] = [];
      if (files.length > accepted.length) {
        notices.push(`Only ${MAX_PHOTOS} photos per listing — ${files.length - accepted.length} skipped.`);
      }
      const next = [...prev];
      let rejected = 0;
      for (const file of accepted) {
        const why = validateFile(file);
        const photoType = suggestType(next);
        if (why) {
          rejected++;
          next.push({
            key: nextKey(),
            file: null,
            name: file.name,
            previewUrl: "",
            status: "error",
            progress: 0,
            error: REJECTION_MESSAGES[why],
            photoType,
            editorUrl: null,
            uploaded: null,
            blurRegions: [],
            detection: null,
          });
          continue;
        }
        next.push({
          key: nextKey(),
          file,
          name: file.name,
          previewUrl: URL.createObjectURL(file),
          status: "queued",
          progress: 0,
          error: null,
          photoType,
          editorUrl: null,
          uploaded: null,
          blurRegions: [],
          detection: null,
        });
      }
      if (rejected > 0) notices.push(`${rejected} file${rejected === 1 ? "" : "s"} couldn't be added.`);
      if (notices.length > 0) setBatchNotice(notices.join(" "));
      return next;
    });
  }

  function remove(tile: PhotoTile) {
    xhrs.current.get(tile.key)?.abort();
    if (tile.previewUrl.startsWith("blob:")) URL.revokeObjectURL(tile.previewUrl);
    onChange((prev) => prev.filter((t) => t.key !== tile.key));
    if (tile.uploaded) {
      // Best effort: the asset is orphaned otherwise. Failure is harmless
      // (the row was never created) — it's swept later by namespace.
      void fetch("/api/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ public_id: tile.uploaded.public_id }),
      }).catch(() => undefined);
    }
  }

  function retry(tile: PhotoTile) {
    patch(tile.key, { status: "queued", error: null, progress: 0 });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= tiles.length || from === to) return;
    onChange((prev) => {
      const next = [...prev];
      const [t] = next.splice(from, 1);
      next.splice(to, 0, t);
      return next;
    });
  }

  const rules = photoRulesSatisfied(tiles);
  const failed = tiles.filter((t) => t.status === "error").length;
  const busy = rules.busy;

  return (
    <div>
      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!dragKey) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (dragKey) return; // tile reorder, not a file drop
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        className={`cursor-pointer rounded-xl border border-dashed p-5 text-center transition-colors ${
          dragOver ? "border-[#22ee77] bg-[#0d2218]" : "border-[#2a2a2a] bg-[#0a0a0a] hover:border-[#3a3a3a]"
        }`}
      >
        <p className="text-sm font-medium text-white">Drop photos here, or tap to choose</p>
        <p className="mt-1 text-xs text-[#888]">
          JPG, PNG, WEBP or HEIC · up to {Math.round(MAX_PHOTO_BYTES / 1024 / 1024)} MB each ·{" "}
          {MIN_PHOTOS} minimum
        </p>
        {/* Picker: multiple, gallery or files. No `capture` here — iOS
            ignores `multiple` and jumps straight to the camera when it's set */}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {/* Camera: one shot at a time, straight from the phone camera */}
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <button
        type="button"
        onClick={() => cameraRef.current?.click()}
        className="mt-2 w-full rounded-lg border border-[#2a2a2a] px-3 py-2 text-xs font-medium text-[#999] hover:border-[#3a3a3a] hover:text-white sm:hidden"
      >
        Take a photo with the camera
      </button>

      {batchNotice && <p className="mt-2 text-xs text-[#c9a227]">{batchNotice}</p>}

      {/* Progress against the rules */}
      <div className="mt-3 rounded-xl border border-[#222] bg-[#111] p-3 text-xs">
        <p className={rules.count >= MIN_PHOTOS ? "text-[#22ee77]" : "text-[#bbb]"}>
          {rules.count} of {MIN_PHOTOS} required photos
          {busy > 0 && <span className="text-[#888]"> · {busy} uploading</span>}
          {failed > 0 && <span className="text-[#ff4444]"> · {failed} failed</span>}
        </p>
        <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[#888]">
          {PHOTO_TYPES.filter((t) => t.value !== "other").map((t) => {
            const have = tiles.some((x) => x.status === "done" && x.photoType === t.value);
            const required = (REQUIRED_PHOTO_TYPES as readonly string[]).includes(t.value);
            return (
              <li key={t.value} className={have ? "text-[#22ee77]" : required ? "text-[#c9a227]" : ""}>
                {have ? "✓" : "○"} {t.label}
                {required && !have && " (required)"}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Tiles */}
      {tiles.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {tiles.map((tile, i) => (
            <li
              key={tile.key}
              draggable={tile.status === "done"}
              onDragStart={() => setDragKey(tile.key)}
              onDragEnd={() => setDragKey(null)}
              onDragOver={(e) => {
                if (dragKey && dragKey !== tile.key) e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (!dragKey) return;
                const from = tiles.findIndex((t) => t.key === dragKey);
                move(from, i);
                setDragKey(null);
              }}
              className={`relative overflow-hidden rounded-lg border bg-[#0a0a0a] ${
                dragKey === tile.key ? "border-[#22ee77] opacity-60" : "border-[#2a2a2a]"
              }`}
            >
              <div className="relative aspect-[4/3] bg-[#181818]">
                {tile.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tile.previewUrl}
                    alt={tile.name}
                    className="h-full w-full object-cover"
                    // HEIC object URLs don't render in most desktop browsers;
                    // the Cloudinary thumb replaces it once the upload lands
                    onError={() => patch(tile.key, { previewUrl: "" })}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#333]">▦</div>
                )}
                {tile.status === "done" &&
                  tile.blurRegions.map((r, j) => (
                    <div
                      key={j}
                      style={{ left: `${r.x * 100}%`, top: `${r.y * 100}%`, width: `${r.w * 100}%`, height: `${r.h * 100}%` }}
                      className="pointer-events-none absolute border border-[#22ee77]/80"
                    />
                  ))}
                {i === 0 && tile.status === "done" && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-[#22ee77] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#0a0a0a]">
                    Cover
                  </span>
                )}
                {tile.status === "uploading" && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-[#222]">
                    <div className="h-full bg-[#22ee77]" style={{ width: `${tile.progress}%` }} />
                  </div>
                )}
                {tile.status === "queued" && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1.5 py-0.5 text-[10px] text-[#bbb]">
                    Waiting…
                  </span>
                )}
                {tile.status === "error" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 p-2 text-center">
                    <p className="text-[11px] leading-snug text-[#ff6b6b]">{tile.error}</p>
                    {tile.file && (
                      <button
                        type="button"
                        onClick={() => retry(tile)}
                        className="mt-1.5 rounded bg-[#22ee77] px-2 py-0.5 text-[11px] font-semibold text-[#0a0a0a]"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="p-1.5">
                <select
                  value={tile.photoType}
                  onChange={(e) => patch(tile.key, { photoType: e.target.value as PhotoType })}
                  disabled={tile.status === "error" && !tile.file}
                  className="w-full rounded border border-[#2a2a2a] bg-[#0a0a0a] px-1.5 py-1 text-[11px] text-white"
                  aria-label={`Shot type for photo ${i + 1}`}
                >
                  {PHOTO_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {tile.status === "done" && (
                  <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                    <span className={tile.detection === null ? "text-[#888]" : tile.blurRegions.length > 0 ? "text-[#22ee77]" : tile.detection.status === "done" ? "text-[#888]" : "text-[#c9a227]"}>
                      {tile.detection === null
                        ? "Scanning for identifying marks…"
                        : tile.blurRegions.length > 0
                          ? `${tile.blurRegions.length} blur box${tile.blurRegions.length === 1 ? "" : "es"}`
                          : tile.detection.status === "done"
                            ? "No identifying marks found"
                            : "Scan unavailable — check the photo yourself"}
                    </span>
                    <button
                      type="button"
                      disabled={!tile.editorUrl}
                      onClick={() => setEditing(tile.key)}
                      className="rounded border border-[#2a2a2a] px-1.5 py-0.5 text-[#999] hover:text-white disabled:opacity-30"
                    >
                      Blur
                    </button>
                  </div>
                )}
                <div className="mt-1 flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, i - 1)}
                      disabled={i === 0}
                      className="rounded border border-[#2a2a2a] px-1.5 py-0.5 text-[#999] disabled:opacity-30"
                      aria-label="Move earlier"
                    >
                      ◀
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      disabled={i === tiles.length - 1}
                      className="rounded border border-[#2a2a2a] px-1.5 py-0.5 text-[#999] disabled:opacity-30"
                      aria-label="Move later"
                    >
                      ▶
                    </button>
                    {i !== 0 && tile.status === "done" && (
                      <button
                        type="button"
                        onClick={() => move(i, 0)}
                        className="rounded border border-[#2a2a2a] px-1.5 py-0.5 text-[#999] hover:text-white"
                      >
                        Make cover
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(tile)}
                    className="rounded border border-[#2a2a2a] px-1.5 py-0.5 text-[#999] hover:border-[#5c1a1a] hover:text-[#ff6b6b]"
                    aria-label="Remove photo"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {editing !== null && (() => {
        const t = tiles.find((x) => x.key === editing);
        if (!t || !t.editorUrl) return null;
        return (
          <BlurEditor
            imageUrl={t.editorUrl}
            regions={t.blurRegions}
            suggested={t.detection?.suggested ?? []}
            detectionNote={
              t.detection && t.detection.status !== "done"
                ? "The automatic scan didn't run for this photo — look it over yourself."
                : null
            }
            isSerialShot={t.photoType === "serial_label"}
            onChange={(regions) => setRegions(t.key, regions)}
            onClose={() => setEditing(null)}
          />
        );
      })()}

      {!rules.ok && tiles.length > 0 && (
        <p className="mt-3 text-xs text-[#888]">
          {rules.count < MIN_PHOTOS
            ? `Add ${MIN_PHOTOS - rules.count} more photo${MIN_PHOTOS - rules.count === 1 ? "" : "s"}. `
            : ""}
          {rules.missing.length > 0 &&
            `Still needed: ${rules.missing
              .map((m) => PHOTO_TYPES.find((t) => t.value === m)?.label ?? m)
              .join(", ")} — pick the shot type on the matching photo.`}
        </p>
      )}
    </div>
  );
}
