"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { he } from "@/messages/he";

export function SeedButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function seed() {
    if (!confirm("לטעון נתוני דוגמה? פעולה חד־פעמית על מסד ריק.")) return;
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/admin/seed", { method: "POST" });
    const data = await res.json();
    if (res.ok && data.ok) {
      setMsg(`נטענו ${data.tables} שולחנות ו־${data.guests} מוזמנים`);
      router.refresh();
    } else if (data.error === "already_populated") {
      setMsg("מסד הנתונים כבר מאוכלס — לא נבוצעה פעולה.");
    } else {
      setMsg(he.common.error);
    }
    setLoading(false);
  }

  return (
    <div className="card bg-blush-100/60 border border-blush-300/60">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">מסד הנתונים ריק</h3>
          <p className="text-sm text-ink/70 mt-1">
            טענו כמה מוזמנים ושולחנות לדוגמה כדי לראות את המערכת בפעולה.
          </p>
        </div>
        <button className="btn-primary" onClick={seed} disabled={loading}>
          {loading ? he.common.loading : "טעינת נתוני דוגמה"}
        </button>
      </div>
      {msg && <p className="text-sm mt-3 text-ink/80">{msg}</p>}
    </div>
  );
}
