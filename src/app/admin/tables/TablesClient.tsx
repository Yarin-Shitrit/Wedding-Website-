"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type GuestLite = {
  id: string;
  firstName: string;
  lastName: string | null;
  status: "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE";
  seatsConfirmed: number;
  seatsInvited: number;
};

type Table = {
  id: string;
  name: string;
  capacity: number;
  notes: string | null;
  guests: GuestLite[];
};

export function TablesClient({
  initialTables,
  unassigned
}: {
  initialTables: Table[];
  unassigned: GuestLite[];
}) {
  const router = useRouter();
  const [tables, setTables] = useState(initialTables);
  const [pool, setPool] = useState(unassigned);
  const [dragging, setDragging] = useState<string | null>(null);

  async function moveGuest(guestId: string, tableId: string | null) {
    const originTable = tables.find((t) => t.guests.some((g) => g.id === guestId));
    const guest =
      originTable?.guests.find((g) => g.id === guestId) ?? pool.find((g) => g.id === guestId);
    if (!guest) return;

    if (originTable) {
      setTables((ts) =>
        ts.map((t) =>
          t.id === originTable.id ? { ...t, guests: t.guests.filter((g) => g.id !== guestId) } : t
        )
      );
    } else {
      setPool((p) => p.filter((g) => g.id !== guestId));
    }

    if (tableId === null) {
      setPool((p) => [...p, guest]);
    } else {
      setTables((ts) => ts.map((t) => (t.id === tableId ? { ...t, guests: [...t.guests, guest] } : t)));
    }

    await fetch(`/api/guests/${guestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId })
    });
    router.refresh();
  }

  async function addTable() {
    const name = prompt("Table name (e.g. 'Table 5')");
    if (!name) return;
    const capacity = Number(prompt("Capacity", "10") ?? "10");
    const res = await fetch("/api/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, capacity })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "Failed");
      return;
    }
    setTables((ts) => [...ts, { ...data, guests: [] }]);
    router.refresh();
  }

  async function updateTable(id: string, patch: Partial<Table>) {
    setTables((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await fetch(`/api/tables/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    router.refresh();
  }

  async function deleteTable(id: string) {
    if (!confirm("Delete this table? Guests will move to unassigned.")) return;
    const table = tables.find((t) => t.id === id);
    if (table) setPool((p) => [...p, ...table.guests]);
    setTables((ts) => ts.filter((t) => t.id !== id));
    await fetch(`/api/tables/${id}`, { method: "DELETE" });
    router.refresh();
  }

  function onDropTo(tableId: string | null) {
    if (dragging) moveGuest(dragging, tableId);
    setDragging(null);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
      <div className="grid gap-4 sm:grid-cols-2">
        {tables.map((t) => {
          const seated = t.guests.reduce((a, g) => a + Math.max(g.seatsConfirmed, 1), 0);
          const over = seated > t.capacity;
          return (
            <div
              key={t.id}
              className="card"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropTo(t.id)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <input
                    className="font-display text-xl text-stone-800 bg-transparent w-full focus:outline-none"
                    value={t.name}
                    onChange={(e) => updateTable(t.id, { name: e.target.value })}
                  />
                  <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                    <span>Capacity</span>
                    <input
                      type="number"
                      min={1}
                      className="w-14 input py-0.5 text-xs"
                      value={t.capacity}
                      onChange={(e) => updateTable(t.id, { capacity: Number(e.target.value) })}
                    />
                    <span className={over ? "text-red-600 font-medium" : ""}>
                      · {seated}/{t.capacity} seated
                    </span>
                  </div>
                </div>
                <button
                  className="text-stone-400 hover:text-red-600 text-sm"
                  onClick={() => deleteTable(t.id)}
                >
                  ✕
                </button>
              </div>

              <ul className="mt-3 space-y-1 min-h-[80px]">
                {t.guests.map((g) => (
                  <li
                    key={g.id}
                    draggable
                    onDragStart={() => setDragging(g.id)}
                    className="flex items-center justify-between rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-sm cursor-move"
                  >
                    <span>
                      {g.firstName} {g.lastName ?? ""}
                      <span className="text-xs text-stone-400">
                        {" "}
                        ({g.status === "ATTENDING" ? g.seatsConfirmed : g.seatsInvited} seats)
                      </span>
                    </span>
                    <button
                      className="text-stone-400 hover:text-rose-600"
                      onClick={() => moveGuest(g.id, null)}
                    >
                      →
                    </button>
                  </li>
                ))}
                {t.guests.length === 0 && (
                  <li className="text-xs text-stone-400 italic py-4 text-center">Drop guests here</li>
                )}
              </ul>
            </div>
          );
        })}

        <button
          onClick={addTable}
          className="card border-dashed border-2 border-stone-200 text-stone-500 hover:border-rose-300 hover:text-rose-600 grid place-items-center min-h-[180px]"
        >
          + Add table
        </button>
      </div>

      <aside
        className="card sticky top-6 h-fit"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => onDropTo(null)}
      >
        <h3 className="font-display text-lg text-stone-800">Unassigned ({pool.length})</h3>
        <ul className="mt-3 space-y-1 max-h-[60vh] overflow-auto">
          {pool.map((g) => (
            <li
              key={g.id}
              draggable
              onDragStart={() => setDragging(g.id)}
              className="rounded-md border border-stone-200 bg-stone-50 px-2 py-1 text-sm cursor-move"
            >
              {g.firstName} {g.lastName ?? ""}
              <span className="text-xs text-stone-400">
                {" "}
                · {g.status.toLowerCase()}
              </span>
            </li>
          ))}
          {pool.length === 0 && <li className="text-xs text-stone-400 italic">Everyone is seated.</li>}
        </ul>
      </aside>
    </div>
  );
}
