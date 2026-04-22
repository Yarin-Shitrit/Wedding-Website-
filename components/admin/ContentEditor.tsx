"use client";

import { useState } from "react";
import { he } from "@/messages/he";
import { ImageUploader } from "./ImageUploader";

type Field = {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "image";
};

const SCHEMAS: Record<string, { title: string; fields: Field[] }> = {
  hero: {
    title: "כותרת ראשית",
    fields: [
      { key: "title", label: "כותרת", type: "text" },
      { key: "subtitle", label: "כותרת משנה", type: "text" },
      { key: "heroImageUrl", label: "תמונת כותרת של בני הזוג", type: "image" },
    ],
  },
  story: {
    title: "הסיפור שלנו",
    fields: [
      { key: "title", label: "כותרת", type: "text" },
      { key: "body", label: "טקסט", type: "textarea" },
    ],
  },
  venue: {
    title: "מקום האירוע",
    fields: [
      { key: "name", label: "שם המקום", type: "text" },
      { key: "address", label: "כתובת", type: "text" },
      { key: "embedUrl", label: "כתובת Google Maps embed", type: "url" },
      { key: "wazeUrl", label: "קישור Waze", type: "url" },
      { key: "description", label: "תיאור / הערות", type: "textarea" },
    ],
  },
  parking: {
    title: "חניה ומידע שימושי",
    fields: [
      { key: "title", label: "כותרת", type: "text" },
      { key: "body", label: "טקסט (תומך Markdown)", type: "textarea" },
    ],
  },
  gift: {
    title: "מתנה",
    fields: [
      { key: "title", label: "כותרת", type: "text" },
      { key: "body", label: "טקסט", type: "textarea" },
    ],
  },
};

export function ContentEditor({
  blockKey,
  initial,
}: {
  blockKey: keyof typeof SCHEMAS | string;
  initial: Record<string, unknown>;
}) {
  const schema = SCHEMAS[blockKey as keyof typeof SCHEMAS];
  const [value, setValue] = useState<Record<string, string>>(() => {
    const out: Record<string, string> = {};
    for (const f of schema?.fields ?? []) {
      out[f.key] = (initial?.[f.key] as string) ?? "";
    }
    return out;
  });
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  if (!schema) return null;

  async function save() {
    setSaving(true);
    setOk(false);
    const res = await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: blockKey, valueJson: value }),
    });
    if (res.ok) setOk(true);
    setSaving(false);
  }

  return (
    <div className="card">
      <h2 className="font-semibold mb-3">{schema.title}</h2>
      <div className="space-y-3">
        {schema.fields.map((f) => (
          <div key={f.key}>
            <label className="label">{f.label}</label>
            {f.type === "textarea" ? (
              <textarea
                className="input min-h-[100px]"
                value={value[f.key]}
                onChange={(e) => setValue({ ...value, [f.key]: e.target.value })}
              />
            ) : f.type === "image" ? (
              <div className="max-w-sm">
                <ImageUploader
                  value={value[f.key] || null}
                  onChange={(dataUrl) =>
                    setValue({ ...value, [f.key]: dataUrl })
                  }
                  shape="portrait"
                  label="בחרו תמונה"
                />
                {value[f.key] && (
                  <button
                    type="button"
                    className="mt-2 text-xs text-blush-700 hover:underline"
                    onClick={() => setValue({ ...value, [f.key]: "" })}
                  >
                    הסרת תמונה
                  </button>
                )}
              </div>
            ) : (
              <input
                className="input"
                type={f.type === "url" ? "url" : "text"}
                value={value[f.key]}
                onChange={(e) => setValue({ ...value, [f.key]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? he.common.loading : he.common.save}
        </button>
        {ok && <span className="text-xs text-sage-700">נשמר ✓</span>}
      </div>
    </div>
  );
}
