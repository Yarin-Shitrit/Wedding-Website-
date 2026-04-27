import { Reveal } from "@/components/primitives/Reveal";

export function Story({
  eyebrow,
  title,
  body,
  quote
}: {
  eyebrow: string;
  title: string;
  body: string;
  quote?: string;
}) {
  return (
    <section id="story" style={{ padding: "60px 22px" }}>
      <Reveal>
        <div style={{ textAlign: "center" }}>
          <div className="eyebrow">{eyebrow}</div>
          <h2 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            {title}
          </h2>
          <div className="ornament" style={{ textAlign: "center", marginBottom: 22 }}>
            · · ·
          </div>
        </div>
      </Reveal>
      <Reveal delay={120}>
        <p
          style={{
            fontSize: 16.5,
            lineHeight: 1.7,
            color: "var(--ink-2)",
            textAlign: "right",
            maxWidth: 360,
            margin: "0 auto",
            textWrap: "pretty"
          }}
        >
          {body}
        </p>
      </Reveal>
      {quote ? (
        <Reveal delay={220}>
          <div style={{ marginTop: 28, textAlign: "center" }}>
            <span
              className="display serif-italic"
              style={{
                fontSize: 22,
                color: "var(--accent)"
              }}
            >
              “{quote}”
            </span>
          </div>
        </Reveal>
      ) : null}
    </section>
  );
}
