"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Values = {
  brideName: string;
  groomName: string;
  weddingDate: string;
  venueName: string;
  venueAddress: string;
  venueMapUrl: string;
  parkingInfo: string;
  dressCode: string;
  welcomeMessage: string;
};

export function SettingsForm({ initial }: { initial: Values }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setV((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, weddingDate: new Date(v.weddingDate).toISOString() })
    });
    setSaving(false);
    setMsg(res.ok ? "Saved." : "Failed to save.");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Bride</label>
          <input className="input" value={v.brideName} onChange={(e) => update("brideName", e.target.value)} />
        </div>
        <div>
          <label className="label">Groom</label>
          <input className="input" value={v.groomName} onChange={(e) => update("groomName", e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Wedding date</label>
        <input
          type="datetime-local"
          className="input"
          value={v.weddingDate}
          onChange={(e) => update("weddingDate", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Venue name</label>
          <input className="input" value={v.venueName} onChange={(e) => update("venueName", e.target.value)} />
        </div>
        <div>
          <label className="label">Venue address</label>
          <input
            className="input"
            value={v.venueAddress}
            onChange={(e) => update("venueAddress", e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="label">Venue map URL</label>
        <input className="input" value={v.venueMapUrl} onChange={(e) => update("venueMapUrl", e.target.value)} />
      </div>
      <div>
        <label className="label">Parking information</label>
        <textarea
          className="input min-h-[100px]"
          value={v.parkingInfo}
          onChange={(e) => update("parkingInfo", e.target.value)}
        />
      </div>
      <div>
        <label className="label">Dress code</label>
        <input className="input" value={v.dressCode} onChange={(e) => update("dressCode", e.target.value)} />
      </div>
      <div>
        <label className="label">Welcome message</label>
        <textarea
          className="input min-h-[80px]"
          value={v.welcomeMessage}
          onChange={(e) => update("welcomeMessage", e.target.value)}
        />
      </div>
      {msg && <p className="text-sm text-stone-600">{msg}</p>}
      <button className="btn-primary" disabled={saving}>
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
