"use client";

import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { ImageUploader } from "./ImageUploader";
import { he } from "@/messages/he";

type Photo = {
  id: string;
  dataUrl: string;
  caption: string | null;
  sortOrder: number;
};

export function GalleryManager({ initial }: { initial: Photo[] }) {
  const [photos, setPhotos] = useState<Photo[]>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function addPhoto() {
    if (!draft) return;
    setSaving(true);
    const res = await fetch("/api/admin/photos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ dataUrl: draft, caption: caption || null }),
    });
    const body = await res.json();
    setSaving(false);
    if (body.ok) {
      setPhotos((p) => [...p, body.photo]);
      setDraft(null);
      setCaption("");
    }
  }

  async function removePhoto(id: string) {
    setPending(id);
    const res = await fetch(`/api/admin/photos/${id}`, { method: "DELETE" });
    setPending(null);
    if (res.ok) setPhotos((p) => p.filter((x) => x.id !== id));
  }

  async function updateCaption(id: string, text: string) {
    setPhotos((p) =>
      p.map((x) => (x.id === id ? { ...x, caption: text } : x))
    );
    await fetch(`/api/admin/photos/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ caption: text || null }),
    });
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="font-semibold mb-3">{he.admin.gallery.addTitle}</h2>
        <div className="grid sm:grid-cols-[260px_1fr] gap-4">
          <ImageUploader
            value={draft}
            onChange={setDraft}
            label={he.admin.gallery.pickPhoto}
            shape="square"
          />
          <div className="space-y-3">
            <div>
              <label className="label">{he.admin.gallery.caption}</label>
              <input
                className="input"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder={he.admin.gallery.captionPlaceholder}
              />
            </div>
            <button
              className="btn-primary"
              onClick={addPhoto}
              disabled={!draft || saving}
            >
              {saving ? he.common.loading : he.admin.gallery.addCta}
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">{he.admin.gallery.existing}</h2>
        {photos.length === 0 ? (
          <p className="text-sm text-ink/50">{he.common.empty}</p>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((p) => (
              <li
                key={p.id}
                className="rounded-xl2 overflow-hidden border border-sage-100 bg-white"
              >
                <div className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.dataUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    className="absolute top-2 end-2 p-2 rounded-full bg-white/90 text-blush-700 hover:bg-white shadow-soft"
                    onClick={() => removePhoto(p.id)}
                    disabled={pending === p.id}
                    aria-label={he.common.delete}
                  >
                    {pending === p.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
                <input
                  className="input rounded-none border-0 border-t border-sage-100"
                  defaultValue={p.caption ?? ""}
                  placeholder={he.admin.gallery.caption}
                  onBlur={(e) => updateCaption(p.id, e.target.value)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
