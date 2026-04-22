"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { Guest, RsvpStatus, Side } from "@prisma/client";
import { he } from "@/messages/he";
import { cn } from "@/lib/utils";

type TableLite = { id: string; label: string; capacity: number };

export function GuestEditDialog({
  guest,
  tables,
  onClose,
  onSaved,
}: {
  guest?: Guest & { table?: { id: string; label: string } | null };
  tables: TableLite[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isNew = !guest;
  const [firstName, setFirstName] = useState(guest?.firstName ?? "");
  const [lastName, setLastName] = useState(guest?.lastName ?? "");
  const [phone, setPhone] = useState(guest?.phone ?? "");
  const [side, setSide] = useState<Side>(guest?.side ?? "BOTH");
  const [relation, setRelation] = useState(guest?.relation ?? "");
  const [invitedCount, setInvitedCount] = useState(guest?.invitedCount ?? 1);
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(
    guest?.rsvpStatus ?? "PENDING"
  );
  const [tableId, setTableId] = useState(guest?.tableId ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        firstName,
        lastName,
        phone: phone.trim() ? phone : null,
        side,
        relation: relation || null,
        invitedCount: Number(invitedCount),
        ...(isNew ? {} : { rsvpStatus, tableId: tableId || null }),
      };
      const url = isNew ? "/api/admin/guests" : `/api/admin/guests/${guest!.id}`;
      const res = await fetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error === "invalid_phone" ? "מספר טלפון לא תקין" : he.common.error);
        return;
      }
      onSaved();
    } catch {
      setError(he.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={cn("fixed inset-0 z-30 bg-ink/40 flex items-end sm:items-center justify-center p-0 sm:p-4")}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl2 rounded-t-xl2 shadow-soft max-h-[92dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-4 py-3 border-b border-sage-100">
          <h2 className="font-semibold">
            {isNew ? he.common.add : he.common.edit}
          </h2>
          <button className="btn-ghost p-2" onClick={onClose} aria-label={he.common.close}>
            <X size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">שם פרטי</label>
              <input
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">שם משפחה</label>
              <input
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="label">טלפון (אופציונלי)</label>
            <input
              className="input"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="050-1234567"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">צד</label>
              <select
                className="input"
                value={side}
                onChange={(e) => setSide(e.target.value as Side)}
              >
                <option value="BRIDE">{he.admin.side.BRIDE}</option>
                <option value="GROOM">{he.admin.side.GROOM}</option>
                <option value="BOTH">{he.admin.side.BOTH}</option>
              </select>
            </div>
            <div>
              <label className="label">קרבה</label>
              <input
                className="input"
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">מספר מוזמנים</label>
              <input
                className="input"
                type="number"
                min={1}
                max={20}
                value={invitedCount}
                onChange={(e) => setInvitedCount(Number(e.target.value) || 1)}
              />
            </div>
            {!isNew && (
              <div>
                <label className="label">סטטוס</label>
                <select
                  className="input"
                  value={rsvpStatus}
                  onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                >
                  <option value="PENDING">{he.admin.status.PENDING}</option>
                  <option value="ATTENDING">{he.admin.status.ATTENDING}</option>
                  <option value="DECLINED">{he.admin.status.DECLINED}</option>
                  <option value="MAYBE">{he.admin.status.MAYBE}</option>
                </select>
              </div>
            )}
          </div>
          {!isNew && (
            <div>
              <label className="label">שולחן</label>
              <select
                className="input"
                value={tableId ?? ""}
                onChange={(e) => setTableId(e.target.value)}
              >
                <option value="">ללא שולחן</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {error && <p className="text-sm text-blush-700">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              {he.common.cancel}
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? he.common.loading : he.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
