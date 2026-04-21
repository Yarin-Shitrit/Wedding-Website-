"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { Plus, Trash2, Users } from "lucide-react";
import type { Guest, Table as PrismaTable } from "@prisma/client";
import { he } from "@/messages/he";
import { cn } from "@/lib/utils";

type TableWithCount = PrismaTable & { assigned?: number };

export function TablesManager({
  initialTables,
  initialGuests,
}: {
  initialTables: PrismaTable[];
  initialGuests: Guest[];
}) {
  const router = useRouter();
  const [tables, setTables] = useState<PrismaTable[]>(initialTables);
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [q, setQ] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const unassigned = useMemo(
    () =>
      guests
        .filter((g) => !g.tableId)
        .filter((g) =>
          q
            ? `${g.firstName} ${g.lastName} ${g.phone}`
                .toLowerCase()
                .includes(q.toLowerCase())
            : true
        ),
    [guests, q]
  );

  const byTable = useMemo(() => {
    const map = new Map<string, Guest[]>();
    guests.forEach((g) => {
      if (!g.tableId) return;
      if (!map.has(g.tableId)) map.set(g.tableId, []);
      map.get(g.tableId)!.push(g);
    });
    return map;
  }, [guests]);

  async function assign(guestId: string, tableId: string | null) {
    // Capacity check
    if (tableId) {
      const table = tables.find((t) => t.id === tableId);
      const assigned = byTable.get(tableId)?.length ?? 0;
      if (table && assigned >= table.capacity) {
        setWarning(`השולחן "${table.label}" מלא (${table.capacity}). הקצאה בוצעה, בדקו קיבולת.`);
      }
    }
    // Optimistic
    setGuests((prev) =>
      prev.map((g) => (g.id === guestId ? { ...g, tableId: tableId ?? null } : g))
    );
    const res = await fetch("/api/admin/tables/assign", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ guestId, tableId }),
    });
    if (!res.ok) {
      // revert
      setGuests(initialGuests);
      setWarning(he.common.error);
    }
    router.refresh();
  }

  function onDragEnd(ev: DragEndEvent) {
    const guestId = String(ev.active.id);
    const overId = ev.over?.id ? String(ev.over.id) : null;
    if (overId === null) return;
    const tableId = overId === "unassigned" ? null : overId;
    assign(guestId, tableId);
  }

  async function addTable() {
    const label = prompt("שם השולחן:", `שולחן ${tables.length + 1}`);
    if (!label) return;
    const capacityStr = prompt("קיבולת:", "10");
    const capacity = Math.max(1, parseInt(capacityStr ?? "10", 10) || 10);
    const res = await fetch("/api/admin/tables", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label, capacity }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      setTables((prev) => [...prev, data.table]);
    }
    router.refresh();
  }

  async function deleteTable(id: string) {
    if (!confirm("למחוק את השולחן? (המוזמנים יועברו ללא שולחן)")) return;
    await fetch(`/api/admin/tables/${id}`, { method: "DELETE" });
    setTables((prev) => prev.filter((t) => t.id !== id));
    setGuests((prev) => prev.map((g) => (g.tableId === id ? { ...g, tableId: null } : g)));
    router.refresh();
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      {warning && (
        <div className="card bg-blush-100 border border-blush-300 text-blush-700 text-sm">
          {warning}
          <button className="btn-ghost text-xs ms-2" onClick={() => setWarning(null)}>
            {he.common.close}
          </button>
        </div>
      )}
      <div className="grid md:grid-cols-[280px_1fr] gap-4">
        <UnassignedColumn
          guests={unassigned}
          q={q}
          setQ={setQ}
          totalUnassigned={guests.filter((g) => !g.tableId).length}
        />
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">שולחנות</h2>
            <button className="btn-primary" onClick={addTable}>
              <Plus size={16} /> שולחן חדש
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tables.map((t) => (
              <TableCard
                key={t.id}
                table={t}
                guests={byTable.get(t.id) ?? []}
                onDelete={() => deleteTable(t.id)}
                onUnassign={(id) => assign(id, null)}
              />
            ))}
            {tables.length === 0 && (
              <p className="text-sm text-ink/50 col-span-full">
                אין שולחנות. הוסיפו אחד להתחלה.
              </p>
            )}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

function UnassignedColumn({
  guests,
  q,
  setQ,
  totalUnassigned,
}: {
  guests: Guest[];
  q: string;
  setQ: (v: string) => void;
  totalUnassigned: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "unassigned" });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "card sticky top-2 self-start max-h-[calc(100dvh-120px)] overflow-y-auto",
        isOver && "ring-2 ring-sage-500"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">לא משובצים ({totalUnassigned})</h2>
      </div>
      <input
        className="input mb-3"
        placeholder={he.common.search}
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <ul className="space-y-2">
        {guests.map((g) => (
          <GuestChip key={g.id} guest={g} />
        ))}
        {guests.length === 0 && (
          <li className="text-xs text-ink/40 text-center py-6">{he.common.empty}</li>
        )}
      </ul>
    </div>
  );
}

function GuestChip({ guest }: { guest: Guest }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: guest.id,
  });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        "rounded-xl2 border border-sage-100 bg-ivory px-3 py-2 text-sm cursor-grab active:cursor-grabbing touch-manipulation",
        isDragging && "opacity-50"
      )}
    >
      <div className="font-medium">
        {guest.firstName} {guest.lastName}
      </div>
      <div className="text-xs text-ink/50">
        {guest.invitedCount > 1 ? `${guest.invitedCount} מוזמנים` : "מוזמן"}
      </div>
    </li>
  );
}

function TableCard({
  table,
  guests,
  onDelete,
  onUnassign,
}: {
  table: TableWithCount;
  guests: Guest[];
  onDelete: () => void;
  onUnassign: (guestId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: table.id });
  const headcount = guests.reduce(
    (acc, g) => acc + (g.attendingCount ?? g.invitedCount),
    0
  );
  const over = headcount > table.capacity;
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "card p-4 flex flex-col gap-2 transition",
        isOver && "ring-2 ring-sage-500",
        over && "border-blush-300 border"
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold">{table.label}</h3>
          <div className="text-xs text-ink/60 flex items-center gap-1">
            <Users size={12} /> {headcount} / {table.capacity}
          </div>
        </div>
        <button className="btn-ghost p-1 text-blush-700" onClick={onDelete} aria-label={he.common.delete}>
          <Trash2 size={14} />
        </button>
      </div>
      <ul className="space-y-1">
        {guests.map((g) => (
          <li
            key={g.id}
            className="flex items-center justify-between rounded-lg bg-sage-50 px-2 py-1 text-xs"
          >
            <span>
              {g.firstName} {g.lastName}
              {g.invitedCount > 1 ? (
                <span className="text-ink/50"> × {g.invitedCount}</span>
              ) : null}
            </span>
            <button
              className="text-ink/50 hover:text-blush-700"
              onClick={() => onUnassign(g.id)}
              aria-label="הסר"
            >
              ×
            </button>
          </li>
        ))}
        {guests.length === 0 && (
          <li className="text-xs text-ink/40 text-center py-3">
            גררו מוזמן לכאן
          </li>
        )}
      </ul>
    </div>
  );
}
