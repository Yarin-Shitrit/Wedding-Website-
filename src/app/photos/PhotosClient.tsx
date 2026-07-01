"use client";

import { useCallback, useRef, useState } from "react";

// ---- Types ----------------------------------------------------------------

interface MatchedPhoto {
  photo_id: string;
  best_distance: number;
  faces: { face_id: string; bbox: [number, number, number, number]; distance: number }[];
  thumb_url: string | null;
  full_url: string;
}

interface MatchResponse {
  query_faces_detected: number;
  results: MatchedPhoto[];
}

type Phase = "idle" | "uploading" | "no-face" | "no-matches" | "results" | "error";

// ---- Helpers --------------------------------------------------------------

function formatSimilarity(distance: number): string {
  // pgvector cosine distance lives in [0, 2]; map to a friendly 0..1 label.
  const sim = Math.max(0, Math.min(1, 1 - distance));
  return sim.toFixed(2);
}

function downloadHrefFor(fullUrl: string, photoId: string): string {
  // Route the download through our Next.js proxy so we can force
  // Content-Disposition: attachment (cross-origin presigned URLs render
  // inline by default — clicking just navigates to the JPG).
  const u = new URLSearchParams({ url: fullUrl, name: `${photoId}.jpg` });
  return `/api/photos/download?${u.toString()}`;
}

// Force-trigger a download via a transient anchor click. Same-origin URL
// (our /api/photos/download proxy), so the `download` attribute is honored.
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

export function PhotosClient({
  apiBase,
  eventId,
  eventToken,
  guestFirstName
}: {
  apiBase: string;
  eventId: string;
  eventToken: string;
  guestFirstName: string | null;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [results, setResults] = useState<MatchedPhoto[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const openPicker = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.click();
    }
  }, []);

  const reset = useCallback(() => {
    setPhase("idle");
    setResults([]);
    setErrorMessage("");
  }, []);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];

      setPhase("uploading");
      setErrorMessage("");
      setResults([]);

      // Cancel any in-flight upload (e.g. user double-tapped).
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      const fd = new FormData();
      fd.append("files", file, file.name);

      try {
        const resp = await fetch(`${apiBase}/events/${eventId}/match`, {
          method: "POST",
          headers: { Authorization: `Bearer ${eventToken}` },
          body: fd,
          signal: abortRef.current.signal
        });

        if (resp.status === 422) {
          setPhase("no-face");
          return;
        }
        if (resp.status === 401 || resp.status === 403) {
          setErrorMessage("פג תוקף ההזמנה — בקשי קישור חדש מהמארחים.");
          setPhase("error");
          return;
        }
        if (!resp.ok) {
          setErrorMessage("נתקלנו בתקלה בחיפוש בגלריה. נסי שוב בבקשה.");
          setPhase("error");
          return;
        }

        const data = (await resp.json()) as MatchResponse;
        const list = data.results ?? [];
        setResults(list);
        setPhase(list.length === 0 ? "no-matches" : "results");
      } catch (err) {
        if ((err as DOMException)?.name === "AbortError") return;
        setErrorMessage("לא הצלחנו להגיע לשרת. בדקי את החיבור ונסי שוב.");
        setPhase("error");
      }
    },
    [apiBase, eventId, eventToken]
  );

  const downloadAll = useCallback(async () => {
    if (results.length === 0 || bulkBusy) return;
    setBulkBusy(true);
    try {
      // Sequential with a small gap so the browser doesn't drop the later
      // clicks. Some browsers cap "rapid downloads" — 250ms is conservative.
      for (let i = 0; i < results.length; i++) {
        const r = results[i];
        triggerDownload(downloadHrefFor(r.full_url, r.photo_id), `${r.photo_id}.jpg`);
        if (i < results.length - 1) {
          await new Promise((r) => setTimeout(r, 250));
        }
      }
    } finally {
      setBulkBusy(false);
    }
  }, [results, bulkBusy]);

  // -- Subviews ------------------------------------------------------------

  const Header = () => (
    <div style={{ textAlign: "center", marginBottom: 22 }}>
      <div className="eyebrow">גלריית האירוע</div>
      <h1 className="display" style={{ fontSize: 34, margin: "10px 0 6px" }}>
        {guestFirstName ? `שלום ${guestFirstName}` : "התמונות שלך"}
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
        העלי סלפי כדי שנמצא עבורך את כל התמונות מהאירוע שאת מופיעה בהן
      </p>
    </div>
  );

  const FilePicker = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
      capture="user"
      onChange={onFile}
      style={{ display: "none" }}
    />
  );

  const renderIdle = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        padding: "32px 16px",
        textAlign: "center"
      }}
    >
      <button type="button" onClick={openPicker} style={primaryBtn}>
        מצא את התמונות שלי
      </button>
      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
        JPEG · PNG · WebP · HEIC · עד ‎25 MB
      </div>
    </div>
  );

  const renderUploading = () => (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        padding: "32px 16px",
        textAlign: "center"
      }}
    >
      <div style={spinnerStyle} aria-hidden="true" />
      <p style={{ color: "var(--ink-3)" }}>מחפש בגלריה…</p>
    </div>
  );

  const renderNoFace = () => (
    <div style={emptyStyle}>
      <h2 style={emptyTitle}>לא הצלחנו לזהות פנים בתמונה</h2>
      <p style={emptyBody}>נסי סלפי חד יותר ומואר היטב, כשהפנים שלך במרכז הפריים ופונות למצלמה.</p>
      <button type="button" onClick={openPicker} style={primaryBtn}>
        נסי תמונה אחרת
      </button>
    </div>
  );

  const renderNoMatches = () => (
    <div style={emptyStyle}>
      <h2 style={emptyTitle}>עדיין אין תמונות שלך</h2>
      <p style={emptyBody}>לא נמצאו תמונות שלך עדיין — נסי שוב לאחר שהצלם יעלה תמונות נוספות.</p>
      <button type="button" onClick={openPicker} style={primaryBtn}>
        ניסיון חוזר
      </button>
    </div>
  );

  const renderError = () => (
    <div style={emptyStyle}>
      <h2 style={{ ...emptyTitle, color: "var(--accent-deep)" }}>משהו השתבש</h2>
      <p style={emptyBody}>{errorMessage || "נסי שוב בבקשה."}</p>
      <button type="button" onClick={reset} style={primaryBtn}>
        ניסיון חוזר
      </button>
    </div>
  );

  const renderResults = () => (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: "var(--ink)" }}>
          {results.length === 1
            ? "מצאנו תמונה אחת שלך"
            : `מצאנו ${results.length} תמונות שלך`}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={downloadAll}
            disabled={bulkBusy}
            style={{ ...primaryBtn, padding: "10px 20px", fontSize: 14 }}
          >
            {bulkBusy ? "מוריד…" : "הורידי הכול"}
          </button>
          <button type="button" onClick={reset} style={secondaryBtn}>
            חיפוש מחדש
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 10
        }}
      >
        {results.map((r) => {
          const thumbSrc = r.thumb_url ?? r.full_url;
          const sim = formatSimilarity(r.best_distance);
          const dlHref = downloadHrefFor(r.full_url, r.photo_id);
          return (
            <div key={r.photo_id} style={tileStyle}>
              <a
                href={r.full_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", aspectRatio: "1 / 1", overflow: "hidden" }}
                aria-label="פתח תמונה בגודל מלא"
              >
                <img
                  src={thumbSrc}
                  alt=""
                  loading="lazy"
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </a>
              <span style={badgeStyle} aria-hidden="true">
                דמיון {sim}
              </span>
              <a href={dlHref} download={`${r.photo_id}.jpg`} style={tileDlBtn}>
                הורידי תמונה
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div>
      <Header />
      {FilePicker}
      <div
        style={{
          background: "var(--ivory)",
          border: "1px solid var(--hair-strong)",
          borderRadius: 12,
          padding: 16
        }}
      >
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
  padding: "10px 18px",
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "inherit"
};

const spinnerStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "3px solid var(--hair-strong)",
  borderTopColor: "var(--accent)",
  animation: "sf-spin 900ms linear infinite"
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

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  insetInlineStart: 8,
  top: 8,
  background: "rgba(15, 23, 42, 0.72)",
  color: "#fff",
  padding: "3px 8px",
  borderRadius: 9999,
  fontSize: 11,
  fontWeight: 600
};

const tileDlBtn: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  textDecoration: "none",
  background: "var(--paper)",
  color: "var(--ink-2)",
  padding: "8px 6px",
  fontSize: 12,
  fontWeight: 500,
  borderTop: "1px solid var(--hair-strong)",
  fontFamily: "inherit"
};
