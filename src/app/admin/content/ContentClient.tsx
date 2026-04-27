"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Moment = {
  id: string;
  chapter: string;
  year: string;
  title: string;
  body: string;
  imageUrl: string | null;
  imageAlt: string | null;
  order: number;
};

type GalleryItem = {
  id: string;
  src: string | null;
  alt: string;
  ratio: string;
  span: number;
  order: number;
};

type ScheduleItem = {
  id: string;
  time: string;
  title: string;
  body: string;
  order: number;
};

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  order: number;
};

type Tab = "moments" | "gallery" | "schedule" | "faq";

export function ContentClient({
  initialMoments,
  initialGallery,
  initialSchedule,
  initialFaq
}: {
  initialMoments: Moment[];
  initialGallery: GalleryItem[];
  initialSchedule: ScheduleItem[];
  initialFaq: FaqItem[];
}) {
  const [tab, setTab] = useState<Tab>("moments");
  const router = useRouter();

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "moments", label: "Moments", count: initialMoments.length },
    { key: "gallery", label: "Gallery", count: initialGallery.length },
    { key: "schedule", label: "Schedule", count: initialSchedule.length },
    { key: "faq", label: "FAQ", count: initialFaq.length }
  ];

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: 4,
          borderBottom: "1px solid var(--hair)",
          marginBottom: 24
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: "10px 14px",
              fontFamily: "Heebo",
              fontSize: 13,
              fontWeight: 500,
              background: "none",
              border: 0,
              borderBottom:
                "2px solid " +
                (tab === t.key ? "var(--accent)" : "transparent"),
              color: tab === t.key ? "var(--ink)" : "var(--ink-3)",
              cursor: "pointer",
              marginBottom: -1
            }}
          >
            {t.label}{" "}
            <span style={{ color: "var(--ink-3)", fontSize: 11 }}>
              ({t.count})
            </span>
          </button>
        ))}
      </div>

      {tab === "moments" ? (
        <MomentsAdmin initial={initialMoments} onChange={() => router.refresh()} />
      ) : null}
      {tab === "gallery" ? (
        <GalleryAdmin initial={initialGallery} onChange={() => router.refresh()} />
      ) : null}
      {tab === "schedule" ? (
        <ScheduleAdmin
          initial={initialSchedule}
          onChange={() => router.refresh()}
        />
      ) : null}
      {tab === "faq" ? (
        <FaqAdmin initial={initialFaq} onChange={() => router.refresh()} />
      ) : null}
    </div>
  );
}

function MomentsAdmin({
  initial,
  onChange
}: {
  initial: Moment[];
  onChange: () => void;
}) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState({
    chapter: "I",
    year: "",
    title: "",
    body: "",
    imageUrl: "",
    imageAlt: "",
    order: items.length + 1
  });

  async function add() {
    if (!draft.year || !draft.title || !draft.body) return;
    const res = await fetch("/api/moments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...draft,
        imageUrl: draft.imageUrl || null,
        imageAlt: draft.imageAlt || null
      })
    });
    if (res.ok) {
      const created = await res.json();
      setItems([...items, created]);
      setDraft({
        chapter: "I",
        year: "",
        title: "",
        body: "",
        imageUrl: "",
        imageAlt: "",
        order: items.length + 2
      });
      onChange();
    }
  }

  async function update(id: string, patch: Partial<Moment>) {
    const res = await fetch(`/api/moments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map((i) => (i.id === id ? updated : i)));
      onChange();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this moment?")) return;
    const res = await fetch(`/api/moments/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== id));
      onChange();
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 className="display" style={{ fontSize: 18, margin: "0 0 12px" }}>
          Add a moment
        </h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "80px 100px 1fr" }}>
          <input
            className="input"
            placeholder="Chapter (I, II…)"
            value={draft.chapter}
            onChange={(e) => setDraft({ ...draft, chapter: e.target.value })}
          />
          <input
            className="input"
            placeholder="Year"
            value={draft.year}
            onChange={(e) => setDraft({ ...draft, year: e.target.value })}
          />
          <input
            className="input"
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </div>
        <textarea
          className="input"
          style={{ marginTop: 8, minHeight: 60 }}
          placeholder="Body"
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr", marginTop: 8 }}>
          <input
            className="input"
            placeholder="Image URL (optional)"
            value={draft.imageUrl}
            onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })}
          />
          <input
            className="input"
            placeholder="Image alt text"
            value={draft.imageAlt}
            onChange={(e) => setDraft({ ...draft, imageAlt: e.target.value })}
          />
        </div>
        <button className="btn-primary" onClick={add} style={{ marginTop: 12 }}>
          Add moment
        </button>
      </Card>

      {items.map((m) => (
        <Card key={m.id}>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "80px 100px 1fr 80px" }}>
            <input
              className="input"
              value={m.chapter}
              onChange={(e) => setItems(items.map((i) => i.id === m.id ? { ...i, chapter: e.target.value } : i))}
              onBlur={(e) => update(m.id, { chapter: e.target.value })}
            />
            <input
              className="input"
              value={m.year}
              onChange={(e) => setItems(items.map((i) => i.id === m.id ? { ...i, year: e.target.value } : i))}
              onBlur={(e) => update(m.id, { year: e.target.value })}
            />
            <input
              className="input"
              value={m.title}
              onChange={(e) => setItems(items.map((i) => i.id === m.id ? { ...i, title: e.target.value } : i))}
              onBlur={(e) => update(m.id, { title: e.target.value })}
            />
            <input
              className="input"
              type="number"
              value={m.order}
              onChange={(e) => setItems(items.map((i) => i.id === m.id ? { ...i, order: Number(e.target.value) } : i))}
              onBlur={(e) => update(m.id, { order: Number(e.target.value) })}
            />
          </div>
          <textarea
            className="input"
            style={{ marginTop: 8, minHeight: 60 }}
            value={m.body}
            onChange={(e) => setItems(items.map((i) => i.id === m.id ? { ...i, body: e.target.value } : i))}
            onBlur={(e) => update(m.id, { body: e.target.value })}
          />
          <button
            onClick={() => remove(m.id)}
            style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)", background: "none", border: 0, cursor: "pointer" }}
          >
            Delete
          </button>
        </Card>
      ))}
    </div>
  );
}

function GalleryAdmin({
  initial,
  onChange
}: {
  initial: GalleryItem[];
  onChange: () => void;
}) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState({
    src: "",
    alt: "",
    ratio: "1/1",
    span: 1,
    order: items.length + 1
  });

  async function add() {
    if (!draft.alt) return;
    const res = await fetch("/api/gallery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, src: draft.src || null })
    });
    if (res.ok) {
      const created = await res.json();
      setItems([...items, created]);
      setDraft({ src: "", alt: "", ratio: "1/1", span: 1, order: items.length + 2 });
      onChange();
    }
  }

  async function update(id: string, patch: Partial<GalleryItem>) {
    const res = await fetch(`/api/gallery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map((i) => (i.id === id ? updated : i)));
      onChange();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo?")) return;
    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== id));
      onChange();
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 className="display" style={{ fontSize: 18, margin: "0 0 12px" }}>
          Add a photo
        </h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr" }}>
          <input
            className="input"
            placeholder="Image URL (optional — placeholder otherwise)"
            value={draft.src}
            onChange={(e) => setDraft({ ...draft, src: e.target.value })}
          />
          <input
            className="input"
            placeholder="Alt text / label"
            value={draft.alt}
            onChange={(e) => setDraft({ ...draft, alt: e.target.value })}
          />
        </div>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 100px 100px", marginTop: 8 }}>
          <input
            className="input"
            placeholder="Ratio (e.g. 5/6)"
            value={draft.ratio}
            onChange={(e) => setDraft({ ...draft, ratio: e.target.value })}
          />
          <input
            className="input"
            type="number"
            min={1}
            max={2}
            placeholder="Span (1 or 2)"
            value={draft.span}
            onChange={(e) => setDraft({ ...draft, span: Number(e.target.value) })}
          />
          <input
            className="input"
            type="number"
            placeholder="Order"
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
          />
        </div>
        <button className="btn-primary" onClick={add} style={{ marginTop: 12 }}>
          Add photo
        </button>
      </Card>

      {items.map((g) => (
        <Card key={g.id}>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 1fr 80px 80px 80px" }}>
            <input
              className="input"
              value={g.src ?? ""}
              placeholder="Image URL"
              onChange={(e) => setItems(items.map((i) => i.id === g.id ? { ...i, src: e.target.value } : i))}
              onBlur={(e) => update(g.id, { src: e.target.value || null })}
            />
            <input
              className="input"
              value={g.alt}
              onChange={(e) => setItems(items.map((i) => i.id === g.id ? { ...i, alt: e.target.value } : i))}
              onBlur={(e) => update(g.id, { alt: e.target.value })}
            />
            <input
              className="input"
              value={g.ratio}
              onChange={(e) => setItems(items.map((i) => i.id === g.id ? { ...i, ratio: e.target.value } : i))}
              onBlur={(e) => update(g.id, { ratio: e.target.value })}
            />
            <input
              className="input"
              type="number"
              value={g.span}
              onChange={(e) => setItems(items.map((i) => i.id === g.id ? { ...i, span: Number(e.target.value) } : i))}
              onBlur={(e) => update(g.id, { span: Number(e.target.value) })}
            />
            <input
              className="input"
              type="number"
              value={g.order}
              onChange={(e) => setItems(items.map((i) => i.id === g.id ? { ...i, order: Number(e.target.value) } : i))}
              onBlur={(e) => update(g.id, { order: Number(e.target.value) })}
            />
          </div>
          <button
            onClick={() => remove(g.id)}
            style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)", background: "none", border: 0, cursor: "pointer" }}
          >
            Delete
          </button>
        </Card>
      ))}
    </div>
  );
}

function ScheduleAdmin({
  initial,
  onChange
}: {
  initial: ScheduleItem[];
  onChange: () => void;
}) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState({
    time: "",
    title: "",
    body: "",
    order: items.length + 1
  });

  async function add() {
    if (!draft.time || !draft.title || !draft.body) return;
    const res = await fetch("/api/schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    if (res.ok) {
      const created = await res.json();
      setItems([...items, created]);
      setDraft({ time: "", title: "", body: "", order: items.length + 2 });
      onChange();
    }
  }

  async function update(id: string, patch: Partial<ScheduleItem>) {
    const res = await fetch(`/api/schedule/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map((i) => (i.id === id ? updated : i)));
      onChange();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this schedule item?")) return;
    const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== id));
      onChange();
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 className="display" style={{ fontSize: 18, margin: "0 0 12px" }}>
          Add a schedule item
        </h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "100px 1fr 80px" }}>
          <input
            className="input"
            placeholder="Time"
            value={draft.time}
            onChange={(e) => setDraft({ ...draft, time: e.target.value })}
          />
          <input
            className="input"
            placeholder="Title"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Order"
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
          />
        </div>
        <textarea
          className="input"
          style={{ marginTop: 8, minHeight: 60 }}
          placeholder="Body"
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
        />
        <button className="btn-primary" onClick={add} style={{ marginTop: 12 }}>
          Add item
        </button>
      </Card>

      {items.map((s) => (
        <Card key={s.id}>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "100px 1fr 80px" }}>
            <input
              className="input"
              value={s.time}
              onChange={(e) => setItems(items.map((i) => i.id === s.id ? { ...i, time: e.target.value } : i))}
              onBlur={(e) => update(s.id, { time: e.target.value })}
            />
            <input
              className="input"
              value={s.title}
              onChange={(e) => setItems(items.map((i) => i.id === s.id ? { ...i, title: e.target.value } : i))}
              onBlur={(e) => update(s.id, { title: e.target.value })}
            />
            <input
              className="input"
              type="number"
              value={s.order}
              onChange={(e) => setItems(items.map((i) => i.id === s.id ? { ...i, order: Number(e.target.value) } : i))}
              onBlur={(e) => update(s.id, { order: Number(e.target.value) })}
            />
          </div>
          <textarea
            className="input"
            style={{ marginTop: 8, minHeight: 60 }}
            value={s.body}
            onChange={(e) => setItems(items.map((i) => i.id === s.id ? { ...i, body: e.target.value } : i))}
            onBlur={(e) => update(s.id, { body: e.target.value })}
          />
          <button
            onClick={() => remove(s.id)}
            style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)", background: "none", border: 0, cursor: "pointer" }}
          >
            Delete
          </button>
        </Card>
      ))}
    </div>
  );
}

function FaqAdmin({
  initial,
  onChange
}: {
  initial: FaqItem[];
  onChange: () => void;
}) {
  const [items, setItems] = useState(initial);
  const [draft, setDraft] = useState({
    question: "",
    answer: "",
    order: items.length + 1
  });

  async function add() {
    if (!draft.question || !draft.answer) return;
    const res = await fetch("/api/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft)
    });
    if (res.ok) {
      const created = await res.json();
      setItems([...items, created]);
      setDraft({ question: "", answer: "", order: items.length + 2 });
      onChange();
    }
  }

  async function update(id: string, patch: Partial<FaqItem>) {
    const res = await fetch(`/api/faq/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    if (res.ok) {
      const updated = await res.json();
      setItems(items.map((i) => (i.id === id ? updated : i)));
      onChange();
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this FAQ entry?")) return;
    const res = await fetch(`/api/faq/${id}`, { method: "DELETE" });
    if (res.ok) {
      setItems(items.filter((i) => i.id !== id));
      onChange();
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Card>
        <h3 className="display" style={{ fontSize: 18, margin: "0 0 12px" }}>
          Add an FAQ
        </h3>
        <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 80px" }}>
          <input
            className="input"
            placeholder="Question"
            value={draft.question}
            onChange={(e) => setDraft({ ...draft, question: e.target.value })}
          />
          <input
            className="input"
            type="number"
            placeholder="Order"
            value={draft.order}
            onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
          />
        </div>
        <textarea
          className="input"
          style={{ marginTop: 8, minHeight: 60 }}
          placeholder="Answer"
          value={draft.answer}
          onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
        />
        <button className="btn-primary" onClick={add} style={{ marginTop: 12 }}>
          Add FAQ
        </button>
      </Card>

      {items.map((f) => (
        <Card key={f.id}>
          <div style={{ display: "grid", gap: 8, gridTemplateColumns: "1fr 80px" }}>
            <input
              className="input"
              value={f.question}
              onChange={(e) => setItems(items.map((i) => i.id === f.id ? { ...i, question: e.target.value } : i))}
              onBlur={(e) => update(f.id, { question: e.target.value })}
            />
            <input
              className="input"
              type="number"
              value={f.order}
              onChange={(e) => setItems(items.map((i) => i.id === f.id ? { ...i, order: Number(e.target.value) } : i))}
              onBlur={(e) => update(f.id, { order: Number(e.target.value) })}
            />
          </div>
          <textarea
            className="input"
            style={{ marginTop: 8, minHeight: 60 }}
            value={f.answer}
            onChange={(e) => setItems(items.map((i) => i.id === f.id ? { ...i, answer: e.target.value } : i))}
            onBlur={(e) => update(f.id, { answer: e.target.value })}
          />
          <button
            onClick={() => remove(f.id)}
            style={{ marginTop: 8, fontSize: 12, color: "var(--ink-3)", background: "none", border: 0, cursor: "pointer" }}
          >
            Delete
          </button>
        </Card>
      ))}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--paper)",
        border: "1px solid var(--hair)",
        padding: 16
      }}
    >
      {children}
    </div>
  );
}
