"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { he } from "@/messages/he";

type Station = {
  id: string;
  title: string;
  description: string;
  dataUrl: string;
  sortOrder: number;
};

export function StationsManager({ initial }: { initial: Station[] }) {
  const [stations, setStations] = useState<Station[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [draft, setDraft] = useState<{
    title: string;
    description: string;
    dataUrl: string | null;
  }>({ title: "", description: "", dataUrl: null });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function addStation() {
    setErr(null);
    if (!draft.title.trim() || !draft.description.trim() || !draft.dataUrl) {
      setErr(he.admin.stations.validation);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/stations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const body = await res.json();
    setSaving(false);
    if (body.ok) {
      setStations((s) => [...s, body.station]);
      setDraft({ title: "", description: "", dataUrl: null });
    } else {
      setErr(he.common.error);
    }
  }

  async function removeStation(id: string) {
    setPending(id);
    const res = await fetch(`/api/admin/stations/${id}`, { method: "DELETE" });
    setPending(null);
    if (res.ok) setStations((s) => s.filter((x) => x.id !== id));
  }

  async function patchStation(id: string, patch: Partial<Station>) {
    setStations((s) => s.map((x) => (x.id === id ? { ...x, ...patch } : x)));
    await fetch(`/api/admin/stations/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold mb-3">{he.admin.stations.addTitle}</h2>
        <div className="grid sm:grid-cols-[260px_1fr] gap-4">
          <ImageUploader
            value={draft.dataUrl}
            onChange={(dataUrl) => setDraft((d) => ({ ...d, dataUrl }))}
            label={he.admin.stations.pickPhoto}
            shape="wide"
          />
          <div className="space-y-3">
            <div>
              <label className="label">{he.admin.stations.title}</label>
              <input
                className="input"
                value={draft.title}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, title: e.target.value }))
                }
                placeholder={he.admin.stations.titlePlaceholder}
              />
            </div>
            <div>
              <label className="label">{he.admin.stations.description}</label>
              <textarea
                className="input min-h-[100px]"
                value={draft.description}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
                placeholder={he.admin.stations.descriptionPlaceholder}
              />
            </div>
            {err && <p className="text-sm text-blush-700">{err}</p>}
            <button
              className="btn-primary"
              onClick={addStation}
              disabled={saving}
            >
              {saving ? he.common.loading : he.admin.stations.addCta}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">{he.admin.stations.existing}</h2>
        {stations.length === 0 ? (
          <p className="text-sm text-ink/50">{he.common.empty}</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4">
            {stations.map((s) => (
              <li
                key={s.id}
                className="rounded-xl2 overflow-hidden border border-sage-100 bg-white"
              >
                <div className="relative aspect-[4/3]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.dataUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute top-2 end-2 p-2 rounded-full bg-white/90 text-blush-700 hover:bg-white shadow-soft"
                    onClick={() => removeStation(s.id)}
                    disabled={pending === s.id}
                    aria-label={he.common.delete}
                  >
                    {pending === s.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
                <div className="p-3 space-y-2">
                  <input
                    className="input"
                    defaultValue={s.title}
                    onBlur={(e) => patchStation(s.id, { title: e.target.value })}
                  />
                  <textarea
                    className="input min-h-[70px]"
                    defaultValue={s.description}
                    onBlur={(e) =>
                      patchStation(s.id, { description: e.target.value })
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
