"use client";

import { useEffect, useState } from "react";

function diff(target: Date) {
  const now = Date.now();
  const ms = Math.max(0, target.getTime() - now);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const seconds = Math.floor((ms / 1000) % 60);
  return { days, hours, minutes, seconds };
}

export function Countdown({ isoDate }: { isoDate: string }) {
  const target = new Date(isoDate);
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [isoDate]);

  const cells = [
    { label: "Days", value: t.days },
    { label: "Hours", value: t.hours },
    { label: "Minutes", value: t.minutes },
    { label: "Seconds", value: t.seconds }
  ];

  return (
    <div className="flex gap-3 sm:gap-6 justify-center">
      {cells.map((c) => (
        <div key={c.label} className="bg-white rounded-xl px-4 py-3 shadow-sm min-w-[72px] text-center">
          <div className="text-3xl font-display text-rose-600">{c.value}</div>
          <div className="text-xs uppercase tracking-wider text-stone-500">{c.label}</div>
        </div>
      ))}
    </div>
  );
}
