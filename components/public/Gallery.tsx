"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Photo = { id: string; dataUrl: string; caption: string | null };

export function Gallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState<Photo | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
        {photos.map((p, i) => (
          <li
            key={p.id}
            className={
              i % 5 === 0
                ? "col-span-2 row-span-2 sm:col-span-2 sm:row-span-2"
                : ""
            }
          >
            <button
              onClick={() => setActive(p)}
              className="group block w-full aspect-square overflow-hidden rounded-xl2 bg-sage-50"
              aria-label={p.caption ?? "תמונה"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.dataUrl}
                alt={p.caption ?? ""}
                loading="lazy"
                className="w-full h-full object-cover transition duration-300 group-hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-ink/80 flex items-center justify-center p-4"
          onClick={() => setActive(null)}
        >
          <button
            className="absolute top-4 end-4 p-2 rounded-full bg-white/90 text-ink"
            onClick={(e) => {
              e.stopPropagation();
              setActive(null);
            }}
            aria-label="סגירה"
          >
            <X size={20} />
          </button>
          <figure
            className="max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.dataUrl}
              alt={active.caption ?? ""}
              className="w-full max-h-[85dvh] object-contain rounded-xl2"
            />
            {active.caption && (
              <figcaption className="mt-3 text-center text-sm text-ivory/90">
                {active.caption}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </>
  );
}
