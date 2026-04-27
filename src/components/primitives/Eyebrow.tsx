import type { ReactNode } from "react";

export function Eyebrow({
  children,
  style
}: {
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div className="eyebrow" style={style}>
      {children}
    </div>
  );
}
