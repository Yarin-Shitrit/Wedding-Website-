import { Reveal } from "@/components/primitives/Reveal";
import { PhotoPlaceholder } from "@/components/primitives/PhotoPlaceholder";

type Moment = {
  id: string;
  chapter: string;
  year: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
};

export function Moments({ moments }: { moments: Moment[] }) {
  if (!moments.length) return null;
  return (
    <section id="moments" style={{ padding: "60px 0" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 30, padding: "0 22px" }}>
          <div className="eyebrow">רגעים בדרך אלינו</div>
          <h2 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            הגלגול שלנו
          </h2>
          <div className="ornament">· · ·</div>
        </div>
      </Reveal>
      {moments.map((m, i) => {
        const flip = i % 2 === 1;
        const last = i === moments.length - 1;
        return (
          <Reveal key={m.id} delay={i * 60}>
            <div
              style={{
                padding: "26px 22px",
                borderTop: "1px solid var(--hair)",
                ...(last ? { borderBottom: "1px solid var(--hair)" } : {})
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 10,
                  flexDirection: flip ? "row-reverse" : "row",
                  justifyContent: "space-between",
                  marginBottom: 14
                }}
              >
                <span
                  className="display serif-italic"
                  style={{
                    fontSize: 36,
                    color: "var(--accent)",
                    lineHeight: 1
                  }}
                >
                  {m.chapter}
                </span>
                <span className="eyebrow">{m.year}</span>
              </div>
              <PhotoPlaceholder
                label={m.imageAlt ?? m.title}
                src={m.imageUrl}
                alt={m.imageAlt ?? m.title}
                ratio={flip ? "5/4" : "4/5"}
              />
              <div style={{ marginTop: 14, textAlign: flip ? "left" : "right" }}>
                <h3 className="display" style={{ fontSize: 26, margin: "0 0 6px" }}>
                  {m.title}
                </h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.7,
                    color: "var(--ink-2)",
                    margin: 0,
                    maxWidth: 320
                  }}
                >
                  {m.body}
                </p>
              </div>
            </div>
          </Reveal>
        );
      })}
    </section>
  );
}
