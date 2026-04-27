import Link from "next/link";
import { Reveal } from "@/components/primitives/Reveal";

export function RsvpCta({ deadline }: { deadline: string }) {
  return (
    <section id="rsvp-cta" style={{ padding: "30px 22px 60px" }}>
      <Reveal>
        <div
          style={{
            border: "1px solid var(--hair-strong)",
            background: "var(--paper)",
            padding: "32px 22px",
            textAlign: "center"
          }}
        >
          <div className="eyebrow" style={{ marginBottom: 8 }}>
            השיבו עד {deadline}
          </div>
          <h2 className="display" style={{ fontSize: 32, margin: "6px 0 8px" }}>
            R · S · V · P
          </h2>
          <div className="ornament" style={{ marginBottom: 14 }}>
            · · ·
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--ink-2)",
              margin: "0 auto 20px",
              maxWidth: 280
            }}
          >
            נשמח לדעת אם תוכלו להגיע. אפשר לעדכן בכל עת עד למועד האחרון.
          </p>
          <Link
            href="/rsvp"
            className="btn btn-accent"
            style={{ textDecoration: "none" }}
          >
            לאישור הגעה ←
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
