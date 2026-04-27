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
  shuttleInfo: string;
  dressCode: string;
  welcomeMessage: string;
  storyTitle: string;
  storyEyebrow: string;
  storyBody: string;
  storyQuote: string;
  heroLayout: "centered" | "split";
  palette: string;
  rsvpDeadline: string;
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
      body: JSON.stringify({
        ...v,
        weddingDate: new Date(v.weddingDate).toISOString()
      })
    });
    setSaving(false);
    setMsg(res.ok ? "Saved." : "Failed to save.");
    router.refresh();
  }

  return (
    <form
      onSubmit={submit}
      className="card"
      style={{ display: "grid", gap: 16, maxWidth: 720 }}
    >
      <Section title="Couple">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Bride">
            <input
              className="input"
              value={v.brideName}
              onChange={(e) => update("brideName", e.target.value)}
            />
          </Field>
          <Field label="Groom">
            <input
              className="input"
              value={v.groomName}
              onChange={(e) => update("groomName", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Wedding date">
          <input
            type="datetime-local"
            className="input"
            value={v.weddingDate}
            onChange={(e) => update("weddingDate", e.target.value)}
          />
        </Field>
        <Field label="RSVP deadline (display label, e.g. 12.10)">
          <input
            className="input"
            value={v.rsvpDeadline}
            onChange={(e) => update("rsvpDeadline", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Venue">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Venue name">
            <input
              className="input"
              value={v.venueName}
              onChange={(e) => update("venueName", e.target.value)}
            />
          </Field>
          <Field label="Venue address">
            <input
              className="input"
              value={v.venueAddress}
              onChange={(e) => update("venueAddress", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Venue map URL (optional)">
          <input
            className="input"
            value={v.venueMapUrl}
            onChange={(e) => update("venueMapUrl", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Story section (home page)">
        <Field label="Eyebrow">
          <input
            className="input"
            value={v.storyEyebrow}
            onChange={(e) => update("storyEyebrow", e.target.value)}
          />
        </Field>
        <Field label="Title">
          <input
            className="input"
            value={v.storyTitle}
            onChange={(e) => update("storyTitle", e.target.value)}
          />
        </Field>
        <Field label="Body">
          <textarea
            className="input"
            style={{ minHeight: 120 }}
            value={v.storyBody}
            onChange={(e) => update("storyBody", e.target.value)}
          />
        </Field>
        <Field label="Italic quote (optional)">
          <input
            className="input"
            value={v.storyQuote}
            onChange={(e) => update("storyQuote", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Parking / Shuttles / Dress code">
        <Field label="Parking info">
          <textarea
            className="input"
            style={{ minHeight: 80 }}
            value={v.parkingInfo}
            onChange={(e) => update("parkingInfo", e.target.value)}
          />
        </Field>
        <Field label="Shuttle info">
          <textarea
            className="input"
            style={{ minHeight: 80 }}
            value={v.shuttleInfo}
            onChange={(e) => update("shuttleInfo", e.target.value)}
          />
        </Field>
        <Field label="Dress code">
          <input
            className="input"
            value={v.dressCode}
            onChange={(e) => update("dressCode", e.target.value)}
          />
        </Field>
      </Section>

      <Section title="Misc">
        <Field label="Welcome message (legacy, unused on new layout)">
          <textarea
            className="input"
            style={{ minHeight: 60 }}
            value={v.welcomeMessage}
            onChange={(e) => update("welcomeMessage", e.target.value)}
          />
        </Field>
        <Field label="Hero layout">
          <select
            className="input"
            value={v.heroLayout}
            onChange={(e) =>
              update("heroLayout", e.target.value as "centered" | "split")
            }
          >
            <option value="centered">Centered (full-bleed photo)</option>
            <option value="split">Split (photo + title)</option>
          </select>
        </Field>
        <Field label="Palette">
          <input
            className="input"
            value={v.palette}
            onChange={(e) => update("palette", e.target.value)}
          />
        </Field>
      </Section>

      {msg ? (
        <p style={{ fontSize: 13, color: "var(--ink-2)" }}>{msg}</p>
      ) : null}
      <button className="btn-primary" disabled={saving} style={{ width: "fit-content" }}>
        {saving ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}

function Section({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset
      style={{
        border: "1px solid var(--hair)",
        padding: 16,
        margin: 0,
        display: "grid",
        gap: 12
      }}
    >
      <legend
        className="eyebrow"
        style={{ padding: "0 8px", color: "var(--ink-2)" }}
      >
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}
