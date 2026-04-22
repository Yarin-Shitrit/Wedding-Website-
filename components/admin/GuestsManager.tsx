"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Upload, Plus, Search, Pencil, Trash2 } from "lucide-react";
import type { Guest, RsvpStatus, Side } from "@prisma/client";
import { he } from "@/messages/he";
import { cn } from "@/lib/utils";
import { GuestEditDialog } from "./GuestEditDialog";
import { CsvImportDialog } from "./CsvImportDialog";

type GuestWithTable = Guest & { table: { id: string; label: string } | null };
type TableLite = { id: string; label: string; capacity: number };

export function GuestsManager({
  initialGuests,
  tables,
}: {
  initialGuests: GuestWithTable[];
  tables: TableLite[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<RsvpStatus | "ALL">("ALL");
  const [editing, setEditing] = useState<GuestWithTable | null>(null);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return initialGuests.filter((g) => {
      if (statusFilter !== "ALL" && g.rsvpStatus !== statusFilter) return false;
      if (!needle) return true;
      return (
        `${g.firstName} ${g.lastName}`.toLowerCase().includes(needle) ||
        (g.phone ?? "").includes(needle) ||
        (g.relation ?? "").toLowerCase().includes(needle)
      );
    });
  }, [initialGuests, q, statusFilter]);

  async function deleteGuest(id: string) {
    if (!confirm("למחוק את המוזמן?")) return;
    await fetch(`/api/admin/guests/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40"
            size={16}
          />
          <input
            className="input ps-9"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={he.common.search}
          />
        </div>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RsvpStatus | "ALL")}
        >
          <option value="ALL">כל הסטטוסים</option>
          <option value="PENDING">{he.admin.status.PENDING}</option>
          <option value="ATTENDING">{he.admin.status.ATTENDING}</option>
          <option value="DECLINED">{he.admin.status.DECLINED}</option>
          <option value="MAYBE">{he.admin.status.MAYBE}</option>
        </select>
        <button className="btn-secondary" onClick={() => setImporting(true)}>
          <Upload size={16} /> {he.admin.csv.import}
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a className="btn-secondary" href="/api/admin/guests/export" download>
          <Download size={16} /> {he.admin.csv.export}
        </a>
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus size={16} /> {he.common.add}
        </button>
      </div>

      {/* Desktop table */}
      <div className="card p-0 hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-right bg-sage-50/50 text-ink/70">
            <tr>
              <th className="px-4 py-3 font-medium">שם</th>
              <th className="px-4 py-3 font-medium">טלפון</th>
              <th className="px-4 py-3 font-medium">צד</th>
              <th className="px-4 py-3 font-medium">מוזמנים</th>
              <th className="px-4 py-3 font-medium">סטטוס</th>
              <th className="px-4 py-3 font-medium">שולחן</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((g) => (
              <tr
                key={g.id}
                className="border-t border-sage-100 hover:bg-sage-50/40"
              >
                <td className="px-4 py-3">
                  <div>
                    {g.firstName} {g.lastName}
                  </div>
                  {g.relation && (
                    <div className="text-xs text-ink/50">{g.relation}</div>
                  )}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {g.phone ?? <span className="text-ink/30">—</span>}
                </td>
                <td className="px-4 py-3">{he.admin.side[g.side as Side]}</td>
                <td className="px-4 py-3 tabular-nums">
                  {g.attendingCount ?? "—"} / {g.invitedCount}
                </td>
                <td className="px-4 py-3">
                  <StatusChip status={g.rsvpStatus} />
                </td>
                <td className="px-4 py-3">
                  {g.table ? g.table.label : <span className="text-ink/40">—</span>}
                </td>
                <td className="px-4 py-3 text-left">
                  <div className="flex gap-1 justify-end">
                    <button
                      className="btn-ghost p-2"
                      onClick={() => setEditing(g)}
                      aria-label={he.common.edit}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="btn-ghost p-2 text-blush-700"
                      onClick={() => deleteGuest(g.id)}
                      aria-label={he.common.delete}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-10 text-center text-ink/50 text-sm"
                >
                  {he.common.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-2">
        {filtered.map((g) => (
          <div key={g.id} className="card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">
                  {g.firstName} {g.lastName}
                </div>
                <div className="text-xs text-ink/60">
                  {g.phone ? `${g.phone} · ` : ""}
                  {he.admin.side[g.side as Side]}
                  {g.relation ? ` · ${g.relation}` : ""}
                </div>
              </div>
              <StatusChip status={g.rsvpStatus} />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-ink/70">
              <span>
                {g.attendingCount ?? "—"} / {g.invitedCount} מוזמנים
              </span>
              <span>{g.table?.label ?? "ללא שולחן"}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <button className="btn-secondary flex-1" onClick={() => setEditing(g)}>
                <Pencil size={14} /> {he.common.edit}
              </button>
              <button
                className="btn-ghost text-blush-700"
                onClick={() => deleteGuest(g.id)}
                aria-label={he.common.delete}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-ink/50 py-8">{he.common.empty}</p>
        )}
      </div>

      {editing && (
        <GuestEditDialog
          guest={editing}
          tables={tables}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
      {creating && (
        <GuestEditDialog
          tables={tables}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
      {importing && (
        <CsvImportDialog
          onClose={() => setImporting(false)}
          onDone={() => {
            setImporting(false);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function StatusChip({ status }: { status: RsvpStatus }) {
  const palette: Record<RsvpStatus, string> = {
    ATTENDING: "bg-sage-100 text-sage-700",
    DECLINED: "bg-ink/10 text-ink/70",
    PENDING: "bg-blush-100 text-blush-700",
    MAYBE: "bg-blush-300/40 text-blush-700",
  };
  return <span className={cn("chip", palette[status])}>{he.admin.status[status]}</span>;
}
