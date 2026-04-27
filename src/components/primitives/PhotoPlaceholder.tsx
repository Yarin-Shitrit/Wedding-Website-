import type { CSSProperties } from "react";

export function PhotoPlaceholder({
  label,
  ratio = "4/5",
  src,
  alt,
  style
}: {
  label: string;
  ratio?: string;
  src?: string | null;
  alt?: string;
  style?: CSSProperties;
}) {
  if (src) {
    return (
      <div
        className="ph"
        style={{ aspectRatio: ratio, width: "100%", padding: 0, ...style }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? label}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            position: "absolute",
            inset: 0
          }}
        />
      </div>
    );
  }
  return (
    <div className="ph" style={{ aspectRatio: ratio, width: "100%", ...style }}>
      <span className="ph-label">{label}</span>
    </div>
  );
}
