import Link from "next/link";
import { Countdown } from "@/components/Countdown";

export function Hero({
  bride,
  groom,
  dateLabel,
  dateIso,
  venueLine
}: {
  bride: string;
  groom: string;
  dateLabel: string;
  dateIso: string;
  venueLine?: string;
}) {
  return (
    <section style={{ position: "relative", padding: "0 0 28px" }}>
      <div style={{ position: "relative", height: 540, overflow: "hidden" }}>
        <div
          className="ph"
          style={{ position: "absolute", inset: -20, border: "none" }}
        >
          <span className="ph-label" style={{ position: "absolute", top: 70, insetInlineEnd: 18 }}>
            engagement portrait — golden-hour
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(245,239,228,0) 40%, var(--ivory) 96%)"
          }}
        />
        <div
          style={{
            position: "absolute",
            insetInlineStart: 0,
            insetInlineEnd: 0,
            bottom: 0,
            padding: "0 22px 14px",
            textAlign: "center"
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 6 }}>
            · התחתנים ·
          </div>
          <h1
            className="display"
            style={{
              fontSize: 64,
              margin: 0,
              color: "var(--ink)",
              textShadow: "0 1px 0 rgba(245,239,228,0.4)"
            }}
          >
            {bride}
          </h1>
          <div
            className="serif-italic"
            style={{
              fontSize: 22,
              color: "var(--accent)",
              margin: "-4px 0"
            }}
          >
            and
          </div>
          <h1
            className="display"
            style={{ fontSize: 64, margin: 0, color: "var(--ink)" }}
          >
            {groom}
          </h1>
        </div>
      </div>

      <div style={{ padding: "18px 22px 0" }}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 13,
              color: "var(--ink-2)",
              letterSpacing: ".05em",
              lineHeight: 1.7
            }}
          >
            {dateLabel}
          </div>
          {venueLine ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--ink-3)",
                marginTop: 2,
                lineHeight: 1.7
              }}
            >
              {venueLine}
            </div>
          ) : null}
        </div>
        <div style={{ marginTop: 18 }}>
          <Countdown isoDate={dateIso} />
        </div>
        <Link
          href="/rsvp"
          className="btn btn-accent"
          style={{ marginTop: 18, textDecoration: "none" }}
        >
          לאישור הגעה ←
        </Link>
        <Link
          href="#story"
          className="btn btn-ghost"
          style={{ marginTop: 8, textDecoration: "none" }}
        >
          לסיפור שלנו ↓
        </Link>
      </div>
    </section>
  );
}

