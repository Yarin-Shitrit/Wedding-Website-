"use client";

import { useCallback, useRef, useState } from "react";

// ---- Types ----------------------------------------------------------------

interface GuestPhoto {
  id: string;
  url: string;
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
  "image/heif"
]);
const MAX_BYTES = 15 * 1024 * 1024;

// ---- Component ------------------------------------------------------------

export function ShareClient({
  initialPhotos,
  token,
  guestFirstName
}: {
  initialPhotos: GuestPhoto[];
  token: string | null;
  guestFirstName: string | null;
}) {
  const [photos, setPhotos] = useState<GuestPhoto[]>(initialPhotos);
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploaderName, setUploaderName] = useState(guestFirstName ?? "");
  const [caption, setCaption] = useState("");
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

      for (const file of files) {
        // Client-side preflight: skip files that fail validation.
        if (!ALLOWED_MIME.has(file.type)) {
          setErrorMessage("פורמט לא נתמך — אפשר רק JPEG, PNG, WebP או HEIC.");
          setPhase("error");
          continue;
        }
        if (file.size > MAX_BYTES) {
          setErrorMessage("הקובץ גדול מדי — עד ‎15MB לתמונה.");
          setPhase("error");
          continue;
        }

        const fd = new FormData();
        fd.append("file", file, file.name);
        if (caption) fd.append("caption", caption);
        if (uploaderName) fd.append("uploaderName", uploaderName);
        if (token) fd.append("token", token);

        try {
          const resp = await fetch("/api/guest-photos", {
            method: "POST",
            body: fd
          });

          if (!resp.ok) {
            let msg = "לא הצלחנו להעלות את התמונה. נסו שוב בבקשה.";
            try {
              const data = (await resp.json()) as { error?: string };
              if (data?.error) msg = data.error;
            } catch {
              // ignore non-JSON error bodies
            }
            setErrorMessage(msg);
            setPhase("error");
            continue;
          }

          const record = (await resp.json()) as GuestPhoto;
          // Optimistic prepend — newest first.
          setPhotos((prev) => [record, ...prev]);
        } catch {
          setErrorMessage("לא הצלחנו להעלות. בדקו את החיבור ונסו שוב.");
          setPhase("error");
        }
      }

      // Reset to idle if no error was raised during this batch.
      setPhase((prev) => (prev === "error" ? "error" : "idle"));
    },
    [caption, uploaderName, token]
  );

  return (
    <div>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div className="eyebrow">גלריית האורחים</div>
        <h1 className="display" style={{ fontSize: 34, margin: "10px 0 6px" }}>
          {guestFirstName ? `שלום ${guestFirstName}` : "שתפו את הרגעים שלכם"}
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
          העלו תמונות מהאירוע כדי שכולם ייהנו מהן
        </p>
      </div>

      {/* Hidden file picker */}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
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
          placeholder="כיתוב לתמונה (לא חובה)"
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
            שתפו את התמונות שלכם
          </button>
          <div style={{ fontSize: 12, color: "var(--ink-3)" }}>
            JPEG · PNG · WebP · HEIC · עד ‎15MB
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
              <span>מעלה…</span>
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
            <p style={emptyBody}>עדיין אין תמונות — היו הראשונים לשתף!</p>
          </div>
        ) : (
          <>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 600,
                margin: "0 0 16px",
                color: "var(--ink)"
              }}
            >
              התמונות של האורחים
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                gap: 10
              }}
            >
              {photos.map((photo) => (
                <div key={photo.id} style={tileStyle}>
                  <div style={{ aspectRatio: "1 / 1", overflow: "hidden" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
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
                  </div>
                  {photo.uploaderName && (
                    <span style={attributionStyle}>{photo.uploaderName}</span>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
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

const attributionStyle: React.CSSProperties = {
  display: "block",
  padding: "6px 8px",
  fontSize: 11,
  color: "var(--ink-3)",
  borderTop: "1px solid var(--hair-strong)"
};
