"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Guest = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  side: "BRIDE" | "GROOM" | "SHARED";
  group: string | null;
  seatsInvited: number;
  seatsConfirmed: number;
  status: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
  rsvpToken: string;
  tableId: string | null;
  table: { id: string; name: string } | null;
};

type Table = { id: string; name: string; capacity: number };

const statusColors: Record<Guest["status"], string> = {
  PENDING: "bg-stone-100 text-stone-600",
  ATTENDING: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-red-100 text-red-700",
  MAYBE: "bg-amber-100 text-amber-700"
};

export function GuestsClient({
  initialGuests,
  tables
}: {
  initialGuests: Guest[];
  tables: Table[];
}) {
  const router = useRouter();
  const [guests, setGuests] = useState(initialGuests);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | Guest["status"]>("");
  const [showAdd, setShowAdd] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return guests.filter((g) => {
      if (statusFilter && g.status !== statusFilter) return false;
      if (!q) return true;
      return (
        g.firstName.toLowerCase().includes(q) ||
        (g.lastName ?? "").toLowerCase().includes(q) ||
        (g.phone ?? "").toLowerCase().includes(q) ||
        (g.group ?? "").toLowerCase().includes(q)
      );
    });
  }, [guests, query, statusFilter]);

  async function refresh() {
    const res = await fetch("/api/guests");
    if (res.ok) setGuests(await res.json());
  }

  async function updateField(id: string, patch: Partial<Guest>) {
    setGuests((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
    await fetch(`/api/guests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    router.refresh();
  }

  async function deleteGuest(id: string) {
    if (!confirm("Delete this guest?")) return;
    setGuests((prev) => prev.filter((g) => g.id !== id));
    await fetch(`/api/guests/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function importCsv(file: File) {
    setImporting(true);
    setImportMsg(null);
    const text = await file.text();
    const res = await fetch("/api/guests/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: text
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) {
      setImportMsg(data.error ?? "Import failed");
      return;
    }
    setImportMsg(`Imported ${data.created} new, updated ${data.updated}, skipped ${data.skipped}.`);
    await refresh();
    router.refresh();
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="input max-w-xs"
          placeholder="Search by name, phone, group…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="input max-w-[160px]"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="ATTENDING">Attending</option>
          <option value="DECLINED">Declined</option>
          <option value="MAYBE">Maybe</option>
        </select>

        <div className="flex-1" />

        <a
          href="/api/guests/export"
          className="btn-secondary"
          target="_blank"
          rel="noreferrer"
        >
          Export CSV
        </a>
        <button onClick={() => fileRef.current?.click()} className="btn-secondary" disabled={importing}>
          {importing ? "Importing…" : "Import CSV"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importCsv(f);
            e.target.value = "";
          }}
        />
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          Add guest
        </button>
      </div>

      {importMsg && <p className="text-sm text-stone-600">{importMsg}</p>}

      <div className="card p-0 overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-stone-500 uppercase text-xs">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3">Side</th>
              <th className="text-left p-3">Group</th>
              <th className="text-left p-3">Seats</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Table</th>
              <th className="text-left p-3">RSVP link</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr key={g.id} className="border-t border-stone-100">
                <td className="p-3">
                  {g.firstName} {g.lastName}
                </td>
                <td className="p-3 text-stone-600">{g.phone}</td>
                <td className="p-3">
                  <select
                    className="input py-1"
                    value={g.side}
                    onChange={(e) => updateField(g.id, { side: e.target.value as Guest["side"] })}
                  >
                    <option value="BRIDE">Bride</option>
                    <option value="GROOM">Groom</option>
                    <option value="SHARED">Shared</option>
                  </select>
                </td>
                <td className="p-3 text-stone-600">{g.group ?? "—"}</td>
                <td className="p-3">
                  <span className="text-stone-600">
                    {g.seatsConfirmed}/{g.seatsInvited}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`rounded-full text-xs px-2 py-1 ${statusColors[g.status]}`}>{g.status}</span>
                </td>
                <td className="p-3">
                  <select
                    className="input py-1"
                    value={g.tableId ?? ""}
                    onChange={(e) => updateField(g.id, { tableId: e.target.value || null })}
                  >
                    <option value="">Unassigned</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="p-3">
                  <button
                    className="text-rose-600 hover:underline text-xs"
                    onClick={() => {
                      const url = `${location.origin}/rsvp?token=${g.rsvpToken}`;
                      navigator.clipboard.writeText(url);
                      alert("Copied RSVP link");
                    }}
                  >
                    Copy link
                  </button>
                </td>
                <td className="p-3 text-right">
                  <button className="text-stone-400 hover:text-red-600" onClick={() => deleteGuest(g.id)}>
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="p-8 text-center text-stone-500">
                  No guests match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && <AddGuestModal onClose={() => setShowAdd(false)} onCreated={refresh} />}
    </div>
  );
}

function AddGuestModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [side, setSide] = useState<"BRIDE" | "GROOM" | "SHARED">("SHARED");
  const [seatsInvited, setSeatsInvited] = useState(1);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phone, side, seatsInvited })
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return;
    }
    onClose();
    onCreated();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 bg-stone-900/50 grid place-items-center p-6 z-50">
      <div className="card w-full max-w-md">
        <h2 className="font-display text-2xl text-stone-800">Add guest</h2>
        <form onSubmit={submit} className="mt-4 space-y-3">
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
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Side</label>
              <select className="input" value={side} onChange={(e) => setSide(e.target.value as typeof side)}>
                <option value="SHARED">Shared</option>
                <option value="BRIDE">Bride</option>
                <option value="GROOM">Groom</option>
              </select>
            </div>
            <div>
              <label className="label">Seats invited</label>
              <input
                type="number"
                min={1}
                className="input"
                value={seatsInvited}
                onChange={(e) => setSeatsInvited(Number(e.target.value))}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button className="btn-primary">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}
