"use client";

// A beautiful, seamless, infinite auto-scrolling strip of the uploaded photos.
// Pure CSS (no dependency): the tile list is rendered TWICE inside a flex track
// and the track animates translateX(0 -> -50%) linearly forever, so the second
// copy slides into exactly where the first started — no visible jump. The
// keyframes/animation + pause-on-hover + reduced-motion rules live in globals.css
// (`@keyframes marquee`, `.marquee-track`).

interface MarqueeImage {
  url: string;
  caption: string | null;
}

// With very few photos the doubled track can be narrower than the viewport,
// which leaves a gap and makes the loop stutter. Repeat the source list until we
// have a comfortable minimum before doubling.
const MIN_TILES = 6;

function fill(images: MarqueeImage[]): MarqueeImage[] {
  if (images.length === 0) return [];
  const out: MarqueeImage[] = [];
  while (out.length < MIN_TILES) out.push(...images);
  return out;
}

export function PhotoMarquee({ images }: { images: MarqueeImage[] }) {
  if (images.length === 0) return null;

  const base = fill(images);
  // Two identical halves — translateX(-50%) lands the loop back at the start.
  const tiles = [...base, ...base];

  return (
    <section
      aria-label="רצועת תמונות מהחתונה"
      style={{
        // Break out of the centered 880px <main> to a full-bleed band.
        width: "100vw",
        marginInline: "calc(50% - 50vw)",
        marginTop: 44,
        overflow: "hidden",
        // Soft fade at both edges so tiles ease in/out instead of hard-cutting.
        WebkitMaskImage:
          "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        maskImage:
          "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)"
      }}
    >
      <div
        className="marquee-track"
        style={{
          display: "flex",
          gap: 14,
          width: "max-content",
          paddingBlock: 6
        }}
      >
        {tiles.map((img, i) => (
          <div
            key={i}
            // The duplicate half is decorative for a screen reader.
            aria-hidden={i >= base.length ? true : undefined}
            style={{
              height: "clamp(150px, 26vw, 230px)",
              borderRadius: 12,
              overflow: "hidden",
              flex: "0 0 auto",
              boxShadow: "var(--shadow)",
              background: "var(--ivory-2)"
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url}
              alt={img.caption ?? ""}
              loading="lazy"
              draggable={false}
              style={{
                height: "100%",
                width: "auto",
                objectFit: "cover",
                display: "block",
                userSelect: "none"
              }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
