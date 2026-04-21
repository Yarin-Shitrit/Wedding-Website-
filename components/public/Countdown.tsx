"use client";

import { useEffect, useState } from "react";

function diff(target: number) {
  const now = Date.now();
  const ms = Math.max(0, target - now);
  const s = Math.floor(ms / 1000);
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function Countdown({ dateIso }: { dateIso: string }) {
  const target = new Date(dateIso).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const cells: [string, number][] = [
    ["ימים", t.days],
    ["שעות", t.hours],
    ["דקות", t.minutes],
    ["שניות", t.seconds],
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-4 max-w-lg mx-auto">
      {cells.map(([label, value]) => (
        <div
          key={label}
          className="card flex flex-col items-center justify-center py-3 sm:py-4"
        >
          <span className="text-2xl sm:text-4xl font-semibold text-sage-700 tabular-nums">
            {value}
          </span>
          <span className="text-xs sm:text-sm text-ink/60 mt-1">{label}</span>
        </div>
      ))}
    </div>
  );
}
