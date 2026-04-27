import { Reveal } from "@/components/primitives/Reveal";

export function Venue({
  venueName,
  venueAddress,
  venueMapUrl
}: {
  venueName: string;
  venueAddress: string;
  venueMapUrl: string;
}) {
  const wazeHref = `https://waze.com/ul?q=${encodeURIComponent(venueAddress || venueName)}`;
  const mapsHref =
    venueMapUrl ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      venueAddress || venueName
    )}`;

  return (
    <section id="venue" style={{ padding: "60px 22px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="eyebrow">היכן נחגוג</div>
          <h2 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            {venueName}
          </h2>
          <div className="ornament">· · ·</div>
        </div>
      </Reveal>
      <Reveal delay={80}>
        <div
          style={{
            position: "relative",
            aspectRatio: "4/3",
            background: "var(--paper)",
            border: "1px solid var(--hair)",
            overflow: "hidden"
          }}
        >
          <svg
            viewBox="0 0 320 240"
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid slice"
            style={{ display: "block" }}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="var(--hair)"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="320" height="240" fill="url(#grid)" />
            <path
              d="M0 90 Q120 70 200 110 T320 130"
              stroke="var(--hair-strong)"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M40 0 Q70 80 140 130 T220 240"
              stroke="var(--hair-strong)"
              strokeWidth="2"
              fill="none"
            />
            <path
              d="M0 200 L320 180"
              stroke="var(--hair)"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="240"
              cy="60"
              r="38"
              fill="rgba(120,140,90,0.18)"
              stroke="var(--hair)"
            />
            <g transform="translate(160 130)">
              <circle r="22" fill="var(--accent)" fillOpacity="0.18" />
              <circle r="12" fill="var(--accent)" fillOpacity="0.32" />
              <circle r="5" fill="var(--accent)" />
            </g>
          </svg>
          <div
            style={{
              position: "absolute",
              bottom: 10,
              insetInlineStart: 10,
              background: "var(--ivory)",
              border: "1px solid var(--hair)",
              padding: "6px 10px",
              fontFamily: "JetBrains Mono",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "var(--ink-2)"
            }}
          >
            32.184 N · 34.871 E
          </div>
        </div>
      </Reveal>
      <Reveal delay={140}>
        <div
          style={{
            marginTop: 18,
            padding: "16px 0",
            borderTop: "1px solid var(--hair)",
            borderBottom: "1px solid var(--hair)",
            textAlign: "center"
          }}
        >
          <h3 className="display" style={{ fontSize: 22, margin: "0 0 4px" }}>
            {venueName}
          </h3>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--ink-2)", margin: 0 }}>
            {venueAddress}
          </p>
          <p
            style={{
              fontSize: 12,
              lineHeight: 1.7,
              color: "var(--ink-3)",
              margin: "4px 0 0"
            }}
          >
            כניסה דרך החניון התת־קרקעי
          </p>
        </div>
      </Reveal>
      <Reveal delay={200}>
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
      </Reveal>
    </section>
  );
}
