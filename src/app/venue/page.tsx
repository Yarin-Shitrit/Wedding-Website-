import { SiteNav } from "@/components/SiteNav";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export default async function VenuePage() {
  const s = await getSettings();
  const mapSrc = s.venueAddress
    ? `https://www.google.com/maps?q=${encodeURIComponent(s.venueAddress)}&output=embed`
    : null;
  const wazeHref = `https://waze.com/ul?q=${encodeURIComponent(
    s.venueAddress || s.venueName
  )}`;
  const mapsHref =
    s.venueMapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      s.venueAddress || s.venueName
    )}`;

  return (
    <>
      <SiteNav />
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "30px 22px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="eyebrow">היכן נחגוג</div>
          <h1 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            {s.venueName}
          </h1>
          <div className="ornament">· · ·</div>
        </div>

        <div
          style={{
            border: "1px solid var(--hair)",
            background: "var(--paper)",
            overflow: "hidden",
            aspectRatio: "16/12"
          }}
        >
          {mapSrc ? (
            <iframe
              title="Venue map"
              src={mapSrc}
              style={{ width: "100%", height: "100%", border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div
              style={{
                padding: 40,
                textAlign: "center",
                color: "var(--ink-3)",
                fontSize: 14
              }}
            >
              הוסיפו כתובת בעמוד ההגדרות כדי להציג מפה.
            </div>
          )}
        </div>

        <div
          style={{
            marginTop: 18,
            padding: "16px 0",
            borderTop: "1px solid var(--hair)",
            borderBottom: "1px solid var(--hair)",
            textAlign: "center"
          }}
        >
          <h2 className="display" style={{ fontSize: 22, margin: "0 0 4px" }}>
            {s.venueName}
          </h2>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
            {s.venueAddress}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 8,
            marginTop: 16
          }}
        >
          <a
            href={wazeHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ textDecoration: "none" }}
          >
            פתח ב-Waze
          </a>
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            style={{ textDecoration: "none" }}
          >
            Google Maps
          </a>
        </div>
      </main>
    </>
  );
}
