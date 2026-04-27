"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "@/components/primitives/Reveal";
import { PhotoPlaceholder } from "@/components/primitives/PhotoPlaceholder";

type Item = {
  id: string;
  src: string | null;
  alt: string;
  ratio: string;
  span: number;
};

export function Gallery({ items }: { items: Item[] }) {
  const [active, setActive] = useState<Item | null>(null);
  if (!items.length) return null;

  return (
    <section id="gallery" style={{ padding: "60px 22px" }}>
      <Reveal>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div className="eyebrow">אלבום משותף</div>
          <h2 className="display" style={{ fontSize: 38, margin: "10px 0 6px" }}>
            הגלריה שלנו
          </h2>
          <div className="ornament">· · ·</div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: "var(--ink-3)",
              margin: "10px auto 0",
              maxWidth: 280
            }}
          >
            רגעים אהובים מאוסף החיים שאנחנו בונים ביחד
          </p>
        </div>
      </Reveal>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6
        }}
      >
        {items.map((g, i) => (
          <Reveal key={g.id} delay={i * 40}>
            <button
              onClick={() => setActive(g)}
              style={{
                border: 0,
                padding: 0,
                background: "none",
                display: "block",
                width: "100%",
                gridColumn: g.span === 2 ? "span 2" : "auto",
                cursor: "pointer"
              }}
            >
              <PhotoPlaceholder
                label={g.alt}
                src={g.src}
                alt={g.alt}
                ratio={g.span === 2 ? "5/4" : g.ratio}
              />
            </button>
          </Reveal>
        ))}
      </div>

      <Reveal delay={120}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            marginTop: 28
          }}
        >
          <div className="ornament">· · ·</div>
          <Link
            href="/photos"
            style={{
              display: "inline-block",
              padding: "10px 22px",
              fontFamily: "Heebo",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ivory)",
              background: "var(--accent)",
              borderRadius: 9999,
              textDecoration: "none",
              whiteSpace: "nowrap",
              letterSpacing: "0.02em"
            }}
          >
            מצא את עצמך בתמונות
          </Link>
        </div>
      </Reveal>

      {active ? (
        <div className="lightbox" onClick={() => setActive(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 360 }}
          >
            <PhotoPlaceholder
              label={active.alt}
              src={active.src}
              alt={active.alt}
              ratio="4/5"
            />
            <div
              className="eyebrow"
              style={{
                textAlign: "center",
                color: "var(--paper)",
                marginTop: 12
              }}
            >
              {active.alt}
            </div>
          </div>
          <button
            onClick={() => setActive(null)}
            style={{
              position: "absolute",
              top: 22,
              insetInlineEnd: 22,
              background: "rgba(245,239,228,0.95)",
              border: 0,
              padding: "8px 14px",
              color: "var(--ink)",
              fontFamily: "JetBrains Mono",
              fontSize: 11,
              letterSpacing: "0.15em",
              cursor: "pointer"
            }}
          >
            סגירה ✕
          </button>
        </div>
      ) : null}
    </section>
  );
}
