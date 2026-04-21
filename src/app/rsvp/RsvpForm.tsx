"use client";

import { useState } from "react";
import type { Guest } from "@prisma/client";

type Status = "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";

export function RsvpForm({ guest }: { guest: Guest | null }) {
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [firstName, setFirstName] = useState(guest?.firstName ?? "");
  const [lastName, setLastName] = useState(guest?.lastName ?? "");
  const [status, setStatus] = useState<Status>((guest?.status as Status) ?? "PENDING");
  const [seats, setSeats] = useState<number>(guest?.seatsConfirmed ?? guest?.seatsInvited ?? 1);
  const [dietary, setDietary] = useState(guest?.dietary ?? "");
  const [notes, setNotes] = useState(guest?.notes ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: guest?.rsvpToken,
          phone,
          firstName,
          lastName,
          status,
          seatsConfirmed: status === "ATTENDING" ? seats : 0,
          dietary,
          notes
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setMessage("Thanks! Your response has been saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  const statuses: { value: Status; label: string }[] = [
    { value: "ATTENDING", label: "Attending" },
    { value: "MAYBE", label: "Maybe" },
    { value: "DECLINED", label: "Can't attend" }
  ];

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">First name</label>
          <input required className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </div>
        <div>
          <label className="label">Last name</label>
          <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="label">Phone</label>
        <input
          required
          type="tel"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+972 50 123 4567"
        />
      </div>

      <div>
        <label className="label">Will you join us?</label>
        <div className="grid grid-cols-3 gap-2">
          {statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setStatus(s.value)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                status === s.value
                  ? "bg-rose-500 text-white border-rose-500"
                  : "bg-white text-stone-700 border-stone-300 hover:border-rose-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {status === "ATTENDING" && (
        <>
          <div>
            <label className="label">Number of seats</label>
            <input
              type="number"
              min={1}
              max={guest?.seatsInvited ?? 10}
              className="input"
              value={seats}
              onChange={(e) => setSeats(Number(e.target.value))}
            />
            {guest?.seatsInvited ? (
              <p className="text-xs text-stone-500 mt-1">You were invited for up to {guest.seatsInvited} seats.</p>
            ) : null}
          </div>
          <div>
            <label className="label">Dietary preferences</label>
            <input
              className="input"
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
              placeholder="Vegetarian, allergies, etc."
            />
          </div>
        </>
      )}

      <div>
        <label className="label">Notes for us</label>
        <textarea className="input min-h-[80px]" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-600">{message}</p>}

      <button disabled={submitting} className="btn-primary w-full">
        {submitting ? "Saving…" : "Save response"}
      </button>
    </form>
  );
}
