"use client";

import { useCallback, useMemo, useRef, useState } from "react";

// ---- Types ----------------------------------------------------------------

interface MatchedItem {
  id: string;
  url: string;
  type: "image" | "video";
  caption: string | null;
  uploaderName: string | null;
  distance: number;
}

type Phase = "idle" | "uploading" | "no-face" | "no-matches" | "results" | "error";

interface MatchApiResponse {
  phase: "results" | "no-matches" | "no-face" | "error";
  items: MatchedItem[];
}

// ---- Constants ------------------------------------------------------------

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);
const FILE_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";
// The selfie only needs to carry a recognizable face — downscaling keeps the
// request tiny (well under Vercel's ~4.5MB body limit) and speeds detection.
const SELFIE_MAX_DIM = 1024;
const SELFIE_JPEG_QUALITY = 0.9;

// ---- Helpers (download — mirrors ShareClient) -----------------------------

function downloadHrefFor(url: string): string {
  return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
}

function filenameFor(item: MatchedItem): string {
  try {
    const tail = new URL(item.url).pathname.split("/").pop();
    if (tail && tail.includes(".")) return decodeURIComponent(tail);
  } catch {
    // fall through
  }
  const ext = item.type === "video" ? "mp4" : "jpg";
  return `${item.id}.${ext}`;
}

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Downscale a selfie to <=SELFIE_MAX_DIM via canvas, returning a JPEG Blob.
// Falls back to the original File if decoding isn't supported (e.g. HEIC on
// some browsers) — a raw selfie is usually small enough to send as-is.
async function downscaleSelfie(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, SELFIE_MAX_DIM / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", SELFIE_JPEG_QUALITY)
    );
    return blob ?? file;
  } catch {
    return file;
  }
}

// ---- Component ------------------------------------------------------------

export function FindMyPhotosClient({ guestFirstName }: { guestFirstName: string | null }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [items, setItems] = useState<MatchedItem[]>([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Selection + bulk download.
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

  const reset = useCallback(() => {
    setPhase("idle");
    setItems([]);
    setErrorMessage("");
    setSelectMode(false);
    setSelected(new Set());
  }, []);

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    if (file.type && !ALLOWED_MIME.has(file.type)) {
      setErrorMessage("אפשר להעלות רק תמונה (JPEG, PNG, WebP, HEIC).");
      setPhase("error");
      return;
    }

    setPhase("uploading");
    setErrorMessage("");
    setItems([]);
    setSelected(new Set());
    setSelectMode(false);

    try {
      const selfie = await downscaleSelfie(file);
      const form = new FormData();
      form.append("files", selfie, "selfie.jpg");

      const resp = await fetch("/api/find-my-photos", { method: "POST", body: form });
      if (!resp.ok && resp.status !== 200) {
        // 4xx/5xx without a usable body → generic error.
        let handled = false;
        try {
          const data = (await resp.json()) as MatchApiResponse;
          if (data?.phase === "no-face") {
            setPhase("no-face");
            handled = true;
          }
        } catch {
          // ignore
        }
        if (!handled) {
          setErrorMessage("נתקלנו בתקלה בחיפוש. נסו שוב בבקשה.");
          setPhase("error");
        }
        return;
      }

      const data = (await resp.json()) as MatchApiResponse;
      if (data.phase === "no-face") {
        setPhase("no-face");
        return;
      }
      if (data.phase === "error") {
        setErrorMessage("נתקלנו בתקלה בחיפוש. נסו שוב בבקשה.");
        setPhase("error");
        return;
      }
      setItems(data.items);
      setPhase(data.items.length === 0 ? "no-matches" : "results");
    } catch {
      setErrorMessage("לא הצלחנו להגיע לשרת. בדקו את החיבור ונסו שוב.");
      setPhase("error");
    }
  }, []);

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
    setSelected(new Set(items.map((p) => p.id)));
  }, [items]);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  // -- Bulk download (mirrors ShareClient) ----------------------------------

  const sequentialDownload = useCallback(
    async (list: MatchedItem[]) => {
      if (list.length === 0 || bulkBusy) return;
      setBulkBusy(true);
      setBulkLabel("מוריד…");
      try {
        for (let i = 0; i < list.length; i++) {
          triggerDownload(downloadHrefFor(list[i].url), filenameFor(list[i]));
          if (i < list.length - 1) await new Promise((r) => setTimeout(r, 250));
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
      if (ids.length === 0 || bulkBusy) return;
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
        setTimeout(() => URL.revokeObjectURL(objectUrl), 4000);
      } catch {
        setErrorMessage("לא הצלחנו להכין קובץ ZIP. בדקו את החיבור ונסו שוב.");
        setPhase("error");
      } finally {
        setBulkBusy(false);
        setBulkLabel("");
      }
    },
    [bulkBusy]
  );

  const selectedItems = useMemo(
    () => items.filter((p) => selected.has(p.id)),
    [items, selected]
  );
  const hasSelection = selectMode && selected.size > 0;

  // -- Subviews -------------------------------------------------------------

  const filePicker = (
    <input
      ref={inputRef}
      type="file"
      accept={FILE_ACCEPT}
      capture="user"
      onChange={onFile}
      style={{ display: "none" }}
    />
  );

  const renderIdle = () => (
    <div style={centerCol}>
      <button type="button" onClick={openPicker} style={primaryBtn}>
        צלמו או בחרו סלפי
      </button>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
        JPEG · PNG · WebP · HEIC
      </div>
    </div>
  );

  const renderUploading = () => (
    <div style={centerCol}>
      <div style={spinnerBig} aria-hidden="true" />
      <p style={{ color: "var(--ink-3)" }}>מחפשים אתכם בגלריה…</p>
    </div>
  );

  const renderNoFace = () => (
    <div style={emptyStyle}>
      <h2 style={emptyTitle}>לא זיהינו פנים בתמונה</h2>
      <p style={emptyBody}>
        נסו סלפי חד ומואר, כשהפנים במרכז הפריים ופונות למצלמה.
      </p>
      <button type="button" onClick={openPicker} style={primaryBtn}>
        נסו תמונה אחרת
      </button>
    </div>
  );

  const renderNoMatches = () => (
    <div style={emptyStyle}>
      <h2 style={emptyTitle}>עדיין לא מצאנו תמונות שלכם</h2>
      <p style={emptyBody}>
        ייתכן שעוד לא הועלו תמונות שאתם מופיעים בהן. נסו שוב מאוחר יותר.
      </p>
      <button type="button" onClick={openPicker} style={primaryBtn}>
        חיפוש חוזר
      </button>
    </div>
  );

  const renderError = () => (
    <div style={emptyStyle}>
      <h2 style={{ ...emptyTitle, color: "var(--accent-deep)" }}>משהו השתבש</h2>
      <p style={emptyBody}>{errorMessage || "נסו שוב בבקשה."}</p>
      <button type="button" onClick={reset} style={primaryBtn}>
        חזרה
      </button>
    </div>
  );

  const renderResults = () => (
    <div>
      <div style={resultsHeader}>
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
          {items.length === 1 ? "מצאנו תמונה אחת שלכם" : `מצאנו ${items.length} תמונות שלכם`}
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
          <button type="button" onClick={reset} style={secondaryBtn}>
            חיפוש מחדש
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      <div style={actionBarStyle}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <span style={scopeLabelStyle}>הורדת הכול</span>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => sequentialDownload(items)}
              disabled={bulkBusy}
              style={groupBtn}
            >
              הורדה בודדת
            </button>
            <button
              type="button"
              onClick={() => zipDownload(items.map((p) => p.id))}
              disabled={bulkBusy}
              style={groupBtn}
            >
              ZIP
            </button>
          </div>
        </div>

        {hasSelection && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={scopeLabelStyle}>הורדת הנבחרים ({selected.size})</span>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--ink-3)", fontSize: 13 }}>
            <div style={spinnerSmall} aria-hidden="true" />
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
        {items.map((photo) => {
          const isSelected = selected.has(photo.id);
          return (
            <div
              key={photo.id}
              style={{ ...tileStyle, ...(selectMode && isSelected ? tileSelectedStyle : null) }}
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
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.url}
                    alt={photo.caption ?? ""}
                    loading="lazy"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                )}

                {selectMode && (
                  <span
                    style={{ ...checkboxStyle, ...(isSelected ? checkboxCheckedStyle : null) }}
                    aria-hidden="true"
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                )}

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

              {photo.uploaderName && <span style={attributionStyle}>{photo.uploaderName}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div className="eyebrow">גלריית האורחים</div>
        <h1 className="display" style={{ fontSize: 34, margin: "10px 0 6px" }}>
          {guestFirstName ? `שלום ${guestFirstName}` : "מצאו את התמונות שלכם"}
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
          העלו סלפי ונאתר עבורכם את כל התמונות מהאירוע שאתם מופיעים בהן
        </p>
      </div>

      {filePicker}

      <div style={cardStyle}>
        {phase === "idle" && renderIdle()}
        {phase === "uploading" && renderUploading()}
        {phase === "no-face" && renderNoFace()}
        {phase === "no-matches" && renderNoMatches()}
        {phase === "error" && renderError()}
        {phase === "results" && renderResults()}
      </div>
    </div>
  );
}

// ---- Inline styles (shared vocabulary with ShareClient) -------------------

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

const spinnerBig: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "3px solid var(--hair-strong)",
  borderTopColor: "var(--accent)",
  animation: "sf-spin 900ms linear infinite"
};

const spinnerSmall: React.CSSProperties = {
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

const centerCol: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 14,
  padding: "32px 16px",
  textAlign: "center"
};

const resultsHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14
};

const actionBarStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  gap: 20,
  flexWrap: "wrap",
  background: "var(--paper)",
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

const emptyTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "var(--ink)",
  margin: 0
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
