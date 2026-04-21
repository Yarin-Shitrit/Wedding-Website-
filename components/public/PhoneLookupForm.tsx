"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { he } from "@/messages/he";

export function PhoneLookupForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (data.error === "not_found") setError(he.rsvp.notFound);
        else if (data.error === "invalid_phone") setError("מספר הטלפון לא תקין");
        else setError(he.common.error);
        return;
      }
      router.push(`/rsvp/${encodeURIComponent(data.phone)}`);
      router.refresh();
    } catch {
      setError(he.common.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label" htmlFor="phone">
          טלפון
        </label>
        <input
          id="phone"
          className="input text-lg"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={he.rsvp.phonePlaceholder}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-blush-700">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? he.common.loading : he.rsvp.continue}
      </button>
    </form>
  );
}
