"use client";

import { useEffect, useState } from "react";

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60)
  };
}

export function Countdown({ isoDate }: { isoDate: string }) {
  const target = new Date(isoDate);
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [isoDate]);

  const cells: { label: string; value: number }[] = [
    { label: "ימים", value: t.days },
    { label: "שעות", value: t.hours },
    { label: "דקות", value: t.minutes },
    { label: "שניות", value: t.seconds }
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 4,
        padding: "18px 4px",
        borderTop: "1px solid var(--hair)",
        borderBottom: "1px solid var(--hair)"
      }}
    >
      {cells.map((c) => (
        <div key={c.label} style={{ textAlign: "center" }}>
          <div
            className="display"
            style={{ fontSize: 30, lineHeight: 1, color: "var(--ink)" }}
          >
            <span className="num-flip">
              {String(c.value).padStart(2, "0")}
            </span>
          </div>
          <div className="eyebrow" style={{ marginTop: 6, fontSize: 9 }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
