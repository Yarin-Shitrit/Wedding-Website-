"use client";

import { useState } from "react";
import { Reveal } from "@/components/primitives/Reveal";

type Item = { id: string; question: string; answer: string };

export function Faq({ items }: { items: Item[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);
  if (!items.length) return null;
  return (
    <section id="faq" style={{ padding: "60px 22px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="eyebrow">לפני שתשאלו</div>
          <h2 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            שאלות נפוצות
          </h2>
          <div className="ornament">· · ·</div>
        </div>
      </Reveal>
      <div>
        {items.map((f, i) => {
          const isOpen = open === f.id;
          return (
            <Reveal key={f.id} delay={i * 50}>
              <div style={{ borderTop: "1px solid var(--hair)" }}>
                <button
                  onClick={() => setOpen(isOpen ? null : f.id)}
                  aria-expanded={isOpen}
                  style={{
                    width: "100%",
                    textAlign: "right",
                    background: "none",
                    border: 0,
                    padding: "16px 0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    color: "var(--ink)",
                    fontFamily: "Heebo",
                    fontSize: 15.5,
                    fontWeight: 500
                  }}
                >
                  <span>{f.question}</span>
                  <span
                    className="display serif-italic"
                    style={{
                      color: "var(--accent)",
                      fontSize: 22,
                      lineHeight: 1,
                      transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                      transition: "transform .3s ease"
                    }}
                  >
                    +
                  </span>
                </button>
                <div
                  style={{
                    maxHeight: isOpen ? 400 : 0,
                    overflow: "hidden",
                    transition: "max-height .35s ease, opacity .35s ease",
                    opacity: isOpen ? 1 : 0
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      lineHeight: 1.7,
                      color: "var(--ink-2)",
                      margin: 0,
                      padding: "0 0 18px"
                    }}
                  >
                    {f.answer}
                  </p>
                </div>
              </div>
            </Reveal>
          );
        })}
        <div style={{ borderTop: "1px solid var(--hair)" }} />
      </div>
    </section>
  );
}
