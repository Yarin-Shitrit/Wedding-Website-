"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { he } from "@/messages/he";

export function AdminLoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(he.admin.wrongPassword);
        return;
      }
      router.push(next || "/admin/dashboard");
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
        <label className="label" htmlFor="password">
          {he.admin.password}
        </label>
        <input
          id="password"
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-blush-700">{error}</p>}
      <button className="btn-primary w-full" disabled={loading}>
        {loading ? he.common.loading : he.admin.signIn}
      </button>
    </form>
  );
}
