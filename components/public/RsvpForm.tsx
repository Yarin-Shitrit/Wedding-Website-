"use client";

import { useState } from "react";
import { RsvpStatus } from "@prisma/client";
import { he } from "@/messages/he";
import { cn } from "@/lib/utils";

type Props = {
  guest: {
    invitedCount: number;
    rsvpStatus: RsvpStatus;
    attendingCount: number | null;
    dietary: string | null;
    notes: string | null;
  };
};

export function RsvpForm({ guest }: Props) {
  const [status, setStatus] = useState<RsvpStatus>(guest.rsvpStatus);
  const [count, setCount] = useState<number>(
    guest.attendingCount ?? guest.invitedCount
  );
  const [dietary, setDietary] = useState(guest.dietary ?? "");
  const [notes, setNotes] = useState(guest.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/rsvp", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rsvpStatus: status,
          attendingCount: status === "ATTENDING" ? count : null,
          dietary: dietary.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "failed");
      setOk(true);
    } catch {
      setError(he.common.error);
    } finally {
      setSaving(false);
    }
  }

  const options: { key: RsvpStatus; label: string; tone: string }[] = [
    { key: "ATTENDING", label: he.rsvp.willAttend, tone: "bg-sage-600 text-white" },
    { key: "MAYBE", label: he.rsvp.undecided, tone: "bg-blush-300 text-ink" },
    { key: "DECLINED", label: he.rsvp.willDecline, tone: "bg-ink/10 text-ink" },
  ];

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            type="button"
            key={o.key}
            className={cn(
              "btn h-12 text-sm",
              status === o.key ? o.tone : "bg-ivory border border-sage-100 text-ink"
            )}
            onClick={() => setStatus(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      {status === "ATTENDING" && guest.invitedCount > 1 && (
        <div>
          <label className="label" htmlFor="count">
            {he.rsvp.howMany}
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="btn-secondary h-11 w-11 text-lg"
              onClick={() => setCount(Math.max(1, count - 1))}
              aria-label="להפחית"
            >
              −
            </button>
            <input
              id="count"
              className="input text-center text-lg w-20"
              inputMode="numeric"
              type="number"
              min={1}
              max={guest.invitedCount}
              value={count}
              onChange={(e) =>
                setCount(
                  Math.max(
                    1,
                    Math.min(guest.invitedCount, parseInt(e.target.value, 10) || 1)
                  )
                )
              }
            />
            <button
              type="button"
              className="btn-secondary h-11 w-11 text-lg"
              onClick={() => setCount(Math.min(guest.invitedCount, count + 1))}
              aria-label="להוסיף"
            >
              +
            </button>
            <span className="text-xs text-ink/60">
              מתוך {guest.invitedCount}
            </span>
          </div>
        </div>
      )}

      <div>
        <label className="label" htmlFor="dietary">
          {he.rsvp.dietary}
        </label>
        <input
          id="dietary"
          className="input"
          value={dietary}
          onChange={(e) => setDietary(e.target.value)}
          placeholder="צמחוני / טבעוני / ללא גלוטן..."
        />
      </div>

      <div>
        <label className="label" htmlFor="notes">
          {he.rsvp.notes}
        </label>
        <textarea
          id="notes"
          className="input min-h-[80px]"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-blush-700">{error}</p>}
      {ok && <p className="text-sm text-sage-700">{he.rsvp.updated}</p>}

      <button className="btn-primary w-full h-12 text-base" disabled={saving}>
        {saving ? he.common.loading : he.rsvp.submit}
      </button>
    </form>
  );
}
