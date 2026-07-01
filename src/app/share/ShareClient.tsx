"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { PhotoMarquee } from "@/components/PhotoMarquee";

// ---- Types ----------------------------------------------------------------

interface GalleryItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  uploaderName: string | null;
}

type Phase = "idle" | "uploading" | "error";

// ---- Constants ------------------------------------------------------------

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
  "video/webm"
]);
const MAX_BYTES = 500 * 1024 * 1024;
const MULTIPART_THRESHOLD = 8_000_000;
const FILE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/quicktime,video/webm";

// ---- Helpers --------------------------------------------------------------

// iPhones shoot HEIC by default. HEIC is NOT renderable in <img> on any
// non-Apple browser (Chrome/Firefox/Edge/Android), so a HEIC stored as-is
// shows a broken-image icon for most guests. Detect it by MIME type OR by
// filename extension — some browsers report an empty `type` for HEIC files.
function isHeic(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif") return true;
  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

// Convert a HEIC/HEIF file to a JPEG File in the browser so what lands in Blob
// is universally viewable + downloadable. heic2any wraps libheif (WASM, ~1.3MB)
// and is dynamically imported so the cost is only paid when a HEIC is picked.
async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
  // Multi-image HEIC (e.g. Live Photos / bursts) yields an array — take the first.
  const blob = Array.isArray(out) ? out[0] : out;
  const base = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

// Append the download flag Vercel Blob honors (Content-Disposition: attachment)
// without clobbering any query string the URL may already carry.
function downloadHrefFor(url: string): string {
  return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
}

// Derive a sensible filename for a downloaded item — prefer the blob pathname
// tail, fall back to `${id}.${ext}`.
function filenameFor(item: GalleryItem): string {
  try {
    const tail = new URL(item.url).pathname.split("/").pop();
    if (tail && tail.includes(".")) return decodeURIComponent(tail);
  } catch {
    // ignore malformed URLs — fall through to the id-based name.
  }
  const ext = item.type === "video" ? "mp4" : "jpg";
  return `${item.id}.${ext}`;
}

// Force-trigger a download via a transient anchor click. The `download`
// attribute plus `?download=1` (honored by Vercel Blob) yields a save.
function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  // Some browsers won't honor download without the anchor being in the DOM.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ---- Component ------------------------------------------------------------

export function ShareClient({
  initialPhotos,
  token,
  guestFirstName,
  coupleName,
  dateLabel
}: {
  initialPhotos: GalleryItem[];
  token: string | null;
  guestFirstName: string | null;
  coupleName: string;
  dateLabel: string;
}) {
  const [photos, setPhotos] = useState<GalleryItem[]>(initialPhotos);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [converting, setConverting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploaderName, setUploaderName] = useState(guestFirstName ?? "");
  const [caption, setCaption] = useState("");

  // Selection + bulk-download state.
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkLabel, setBulkLabel] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }, []);

  const onFiles = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const fileList = e.target.files;
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);

      setPhase("uploading");
      setErrorMessage("");

      for (const rawFile of files) {
        setProgress(0);

        // Transcode HEIC/HEIF → JPEG up front so it renders everywhere. Must run
        // BEFORE the MIME check: some browsers report an empty `type` for HEIC,
        // which would otherwise be rejected as "unsupported format".
        let file = rawFile;
        if (isHeic(rawFile)) {
          setConverting(true);
          try {
            file = await convertHeicToJpeg(rawFile);
          } catch {
            setErrorMessage(
              "לא הצלחנו להמיר תמונת HEIC. נסו לצלם במצב 'תואם ביותר' או להעלות JPEG."
            );
            setPhase("error");
            setConverting(false);
            continue;
          }
          setConverting(false);
        }

        // Client-side preflight: skip files that fail validation.
        if (!ALLOWED_MIME.has(file.type)) {
          setErrorMessage(
            "פורמט לא נתמך — אפשר רק תמונות (JPEG, PNG, WebP, HEIC) או וידאו (MP4, MOV, WebM)."
          );
          setPhase("error");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setErrorMessage("הקובץ גדול מדי — עד ‎500MB לקובץ.");
          setPhase("error");
          continue;
        }

        try {
          // 1) Upload straight to Vercel Blob from the browser — bypasses the
          //    ~4.5MB serverless body limit so large photos + videos work.
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/guest-photos/upload",
            contentType: file.type,
            multipart: file.size > MULTIPART_THRESHOLD,
            clientPayload: JSON.stringify({ caption, uploaderName, token }),
            onUploadProgress: (ev) => setProgress(Math.round(ev.percentage))
          });

          // 2) Record the DB row now that the file lives in Blob.
          const kind = file.type.startsWith("video/") ? "video" : "image";
          const resp = await fetch("/api/guest-photos", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              url: blob.url,
              pathname: blob.pathname,
              type: kind,
              caption,
              uploaderName,
              token
            })
          });

          if (!resp.ok) {
            let msg = "לא הצלחנו לשמור את הקובץ. נסו שוב בבקשה.";
            try {
              const data = (await resp.json()) as { error?: unknown };
              // Only surface string errors. The record route can return a
              // structured Zod error object ({formErrors, fieldErrors}); setting
              // that as errorMessage and rendering it as a React child throws
              // (Minified React error #31) and crashes the whole page.
              if (typeof data?.error === "string") msg = data.error;
            } catch {
              // ignore non-JSON error bodies
            }
            setErrorMessage(msg);
            setPhase("error");
            continue;
          }

          const record = (await resp.json()) as GalleryItem;
          // Optimistic prepend — newest first.
          setPhotos((prev) => [record, ...prev]);
        } catch {
          setErrorMessage("לא הצלחנו להעלות. בדקו את החיבור ונסו שוב.");
          setPhase("error");
        }
      }

      setProgress(0);
      // Reset to idle if no error was raised during this batch.
      setPhase((prev) => (prev === "error" ? "error" : "idle"));
    },
    [caption, uploaderName, token]
  );

  // -- Selection ------------------------------------------------------------

  const toggleSelectMode = useCallback(() => {
    setSelectMode((prev) => {
      if (prev) setSelected(new Set());
      return !prev;
    });
  }, []);

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelected(new Set(photos.map((p) => p.id)));
  }, [photos]);

  const clearSelection = useCallback(() => {
    setSelected(new Set());
  }, []);

  // -- Bulk download --------------------------------------------------------

  const sequentialDownload = useCallback(
    async (items: GalleryItem[]) => {
      if (items.length === 0 || bulkBusy) return;
      setBulkBusy(true);
      setBulkLabel("מוריד…");
      try {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          triggerDownload(downloadHrefFor(item.url), filenameFor(item));
          // Small gap so browsers don't drop the later clicks.
          if (i < items.length - 1) {
            await new Promise((r) => setTimeout(r, 250));
          }
        }
      } finally {
        setBulkBusy(false);
        setBulkLabel("");
      }
    },
    [bulkBusy]
  );

  const zipDownload = useCallback(
    async (ids: string[]) => {
      if (photos.length === 0 || bulkBusy) return;
      setBulkBusy(true);
      setBulkLabel("מכינים ZIP…");
      try {
        const resp = await fetch("/api/guest-photos/zip", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ids })
        });
        if (!resp.ok) {
          setErrorMessage("לא הצלחנו להכין קובץ ZIP. נסו שוב בבקשה.");
          setPhase("error");
          return;
        }
        const blob = await resp.blob();
        const objectUrl = URL.createObjectURL(blob);
        triggerDownload(objectUrl, "wedding-gallery.zip");
        // Release the object URL after the click has been dispatched.
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      } catch {
        setErrorMessage("לא הצלחנו להכין קובץ ZIP. בדקו את החיבור ונסו שוב.");
        setPhase("error");
      } finally {
        setBulkBusy(false);
        setBulkLabel("");
      }
    },
    [photos.length, bulkBusy]
  );

  const selectedItems = useMemo(
    () => photos.filter((p) => selected.has(p.id)),
    [photos, selected]
  );
  const hasSelection = selectMode && selected.size > 0;

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div className="eyebrow">{dateLabel}</div>
        <h1 className="display" style={{ fontSize: 34, margin: "10px 0 6px" }}>
          החתונה של {coupleName}
        </h1>
        <div className="ornament">· · ·</div>
        <p
          style={{
            fontSize: 13,
            lineHeight: 1.7,
            color: "var(--ink-3)",
            margin: "10px auto 0",
            maxWidth: 360
          }}
        >
          {guestFirstName
            ? `שלום ${guestFirstName}, העלו את התמונות והסרטונים שלכם כדי שכולם ייהנו מהם`
            : "העלו תמונות וסרטונים מהאירוע כדי שכולם ייהנו מהם"}
        </p>
      </div>

      {/* Hidden file picker */}
      <input
        ref={inputRef}
        type="file"
        accept={FILE_ACCEPT}
        multiple
        onChange={onFiles}
        style={{ display: "none" }}
      />

      {/* Upload card */}
      <div style={cardStyle}>
        <input
          className="field"
          type="text"
          value={uploaderName}
          onChange={(e) => setUploaderName(e.target.value)}
          placeholder="השם שלכם (לא חובה)"
          style={{ marginBottom: 8 }}
        />
        <input
          className="field"
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="כיתוב לקובץ (לא חובה)"
          style={{ marginBottom: 16 }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
            textAlign: "center"
          }}
        >
          <button
            type="button"
            onClick={openPicker}
            disabled={phase === "uploading"}
            style={primaryBtn}
          >
            שתפו תמונות וסרטונים
          </button>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            תמונות ווידאו · עד ‎500MB
          </div>

          {phase === "uploading" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                color: "var(--ink-3)"
              }}
            >
              <div style={spinnerStyle} aria-hidden="true" />
              <span>{converting ? "ממיר תמונה…" : `מעלה… ${progress}%`}</span>
            </div>
          )}

          {phase === "error" && errorMessage && (
            <p style={{ margin: 0, color: "var(--accent-deep)", fontSize: 13 }}>
              {errorMessage}
            </p>
          )}
        </div>
      </div>

      {/* Gallery */}
      <div style={{ marginTop: 28 }}>
        {photos.length === 0 ? (
          <div style={emptyStyle}>
            <p style={emptyBody}>עדיין אין תמונות או סרטונים — היו הראשונים לשתף!</p>
          </div>
        ) : (
          <>
            {/* Toolbar: title + selection controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 14
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                  color: "var(--ink)"
                }}
              >
                הגלריה של האורחים
              </h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={toggleSelectMode} style={secondaryBtn}>
                  {selectMode ? "ביטול בחירה" : "בחירה"}
                </button>
                {selectMode && (
                  <>
                    <button type="button" onClick={selectAll} style={secondaryBtn}>
                      בחר הכול
                    </button>
                    <button type="button" onClick={clearSelection} style={secondaryBtn}>
                      נקה
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bulk action bar */}
            <div style={actionBarStyle}>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={scopeLabelStyle}>הורדת הכול</span>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => sequentialDownload(photos)}
                    disabled={bulkBusy}
                    style={groupBtn}
                  >
                    הורדה בודדת
                  </button>
                  <button
                    type="button"
                    onClick={() => zipDownload(photos.map((p) => p.id))}
                    disabled={bulkBusy}
                    style={groupBtn}
                  >
                    ZIP
                  </button>
                </div>
              </div>

              {hasSelection && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={scopeLabelStyle}>
                    הורדת הנבחרים ({selected.size})
                  </span>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => sequentialDownload(selectedItems)}
                      disabled={bulkBusy}
                      style={groupBtn}
                    >
                      הורדה בודדת
                    </button>
                    <button
                      type="button"
                      onClick={() => zipDownload(selectedItems.map((p) => p.id))}
                      disabled={bulkBusy}
                      style={groupBtn}
                    >
                      ZIP
                    </button>
                  </div>
                </div>
              )}

              {bulkBusy && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "var(--ink-3)",
                    fontSize: 13
                  }}
                >
                  <div style={spinnerStyle} aria-hidden="true" />
                  <span>{bulkLabel || "מוריד…"}</span>
                </div>
              )}
            </div>

            {/* Grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 10
              }}
            >
              {photos.map((photo) => {
                const isSelected = selected.has(photo.id);
                return (
                  <div
                    key={photo.id}
                    style={{
                      ...tileStyle,
                      ...(selectMode && isSelected ? tileSelectedStyle : null)
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        aspectRatio: "1 / 1",
                        overflow: "hidden",
                        cursor: selectMode ? "pointer" : "default"
                      }}
                      onClick={selectMode ? () => toggleOne(photo.id) : undefined}
                    >
                      {photo.type === "video" ? (
                        <video
                          src={photo.url}
                          controls={!selectMode}
                          playsInline
                          preload="metadata"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block"
                          }}
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={photo.url}
                          alt={photo.caption ?? ""}
                          loading="lazy"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block"
                          }}
                        />
                      )}

                      {/* Selection checkbox (top corner) */}
                      {selectMode && (
                        <span
                          style={{
                            ...checkboxStyle,
                            ...(isSelected ? checkboxCheckedStyle : null)
                          }}
                          aria-hidden="true"
                        >
                          {isSelected ? "✓" : ""}
                        </span>
                      )}

                      {/* Per-item download (top corner, opposite the checkbox) */}
                      {!selectMode && (
                        <a
                          href={downloadHrefFor(photo.url)}
                          download={filenameFor(photo)}
                          onClick={(e) => e.stopPropagation()}
                          aria-label="הורדה"
                          title="הורדה"
                          style={tileDlBtn}
                        >
                          ↓
                        </a>
                      )}
                    </div>

                    {photo.uploaderName && (
                      <span style={attributionStyle}>{photo.uploaderName}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Infinite auto-scrolling strip of the uploaded photos (images only). */}
      {photos.some((p) => p.type === "image") && (
        <div style={{ marginTop: 44 }}>
          <div className="eyebrow" style={{ textAlign: "center" }}>
            רגעים מהחתונה
          </div>
          <PhotoMarquee
            images={photos
              .filter((p) => p.type === "image")
              .map((p) => ({ url: p.url, caption: p.caption }))}
          />
        </div>
      )}
    </div>
  );
}

// ---- Inline styles --------------------------------------------------------

const primaryBtn: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--ivory)",
  border: 0,
  borderRadius: 9999,
  padding: "14px 28px",
  fontSize: 15,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit"
};

const secondaryBtn: React.CSSProperties = {
  background: "transparent",
  color: "var(--ink-2)",
  border: "1px solid var(--hair-strong)",
  borderRadius: 9999,
  padding: "8px 16px",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit"
};

const groupBtn: React.CSSProperties = {
  background: "var(--accent)",
  color: "var(--ivory)",
  border: 0,
  borderRadius: 9999,
  padding: "9px 18px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "inherit"
};

const spinnerStyle: React.CSSProperties = {
  width: 20,
  height: 20,
  borderRadius: "50%",
  border: "3px solid var(--hair-strong)",
  borderTopColor: "var(--accent)",
  animation: "sf-spin 900ms linear infinite"
};

const cardStyle: React.CSSProperties = {
  background: "var(--ivory)",
  border: "1px solid var(--hair-strong)",
  borderRadius: 12,
  padding: 16
};

const actionBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 20,
  flexWrap: "wrap",
  background: "var(--ivory)",
  border: "1px solid var(--hair-strong)",
  borderRadius: 12,
  padding: "12px 16px",
  marginBottom: 16
};

const scopeLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--ink-2)"
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  padding: "28px 16px",
  textAlign: "center"
};

const emptyBody: React.CSSProperties = {
  margin: 0,
  maxWidth: "42ch",
  color: "var(--ink-3)",
  lineHeight: 1.7
};

const tileStyle: React.CSSProperties = {
  position: "relative",
  borderRadius: 10,
  overflow: "hidden",
  border: "1px solid var(--hair-strong)",
  background: "var(--paper)"
};

const tileSelectedStyle: React.CSSProperties = {
  borderColor: "var(--accent)",
  boxShadow: "0 0 0 2px var(--accent)"
};

const checkboxStyle: React.CSSProperties = {
  position: "absolute",
  insetInlineStart: 8,
  top: 8,
  width: 24,
  height: 24,
  borderRadius: "50%",
  border: "2px solid #fff",
  background: "rgba(15, 23, 42, 0.45)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1
};

const checkboxCheckedStyle: React.CSSProperties = {
  background: "var(--accent)",
  borderColor: "var(--accent)"
};

const tileDlBtn: React.CSSProperties = {
  position: "absolute",
  insetInlineEnd: 8,
  top: 8,
  width: 30,
  height: 30,
  borderRadius: "50%",
  background: "rgba(15, 23, 42, 0.55)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  fontWeight: 700,
  textDecoration: "none",
  lineHeight: 1,
  fontFamily: "inherit"
};

const attributionStyle: React.CSSProperties = {
  display: "block",
  padding: "6px 8px",
  fontSize: 11,
  color: "var(--ink-3)",
  borderTop: "1px solid var(--hair-strong)"
};
