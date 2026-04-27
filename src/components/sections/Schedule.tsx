import { Reveal } from "@/components/primitives/Reveal";

type Item = { id: string; time: string; title: string; body: string };

export function Schedule({ items }: { items: Item[] }) {
  if (!items.length) return null;
  return (
    <section id="schedule" style={{ padding: "60px 22px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="eyebrow">הערב הזה</div>
          <h2 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            סדר היום
          </h2>
          <div className="ornament">· · ·</div>
        </div>
      </Reveal>
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            insetInlineStart: 64,
            top: 4,
            bottom: 4,
            width: 1,
            background: "var(--hair)"
          }}
        />
        {items.map((s, i) => (
          <Reveal key={s.id} delay={i * 70}>
            <div
              style={{
                display: "flex",
                gap: 18,
                padding: "10px 0",
                position: "relative"
              }}
            >
              <div style={{ width: 56, textAlign: "left", flex: "none" }}>
                <div
                  className="display"
                  style={{ fontSize: 18, lineHeight: 1.1, color: "var(--ink)" }}
                >
                  {s.time}
                </div>
              </div>
              <div
                style={{
                  width: 17,
                  flex: "none",
                  display: "flex",
                  justifyContent: "center",
                  paddingTop: 7
                }}
              >
                <div
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 999,
                    background: "var(--accent)",
                    boxShadow:
                      "0 0 0 4px var(--ivory), 0 0 0 5px var(--hair-strong)"
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <h3 className="display" style={{ fontSize: 18, margin: 0 }}>
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.7,
                    color: "var(--ink-2)",
                    margin: "2px 0 0"
                  }}
                >
                  {s.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
