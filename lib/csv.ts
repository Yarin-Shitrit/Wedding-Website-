import Papa from "papaparse";
import { Side } from "@prisma/client";
import { normalizePhone } from "./phone";

export type CsvGuestRow = {
  firstName: string;
  lastName: string;
  phone: string;
  side: Side;
  relation?: string;
  invitedCount: number;
};

export type ParsedCsv = {
  valid: CsvGuestRow[];
  errors: { row: number; reason: string; raw: Record<string, string> }[];
};

const SIDE_MAP: Record<string, Side> = {
  bride: "BRIDE",
  groom: "GROOM",
  both: "BOTH",
  כלה: "BRIDE",
  חתן: "GROOM",
  משותף: "BOTH",
  שניהם: "BOTH",
};

export function parseGuestCsv(csvText: string): ParsedCsv {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/﻿/g, ""),
  });

  const valid: CsvGuestRow[] = [];
  const errors: ParsedCsv["errors"] = [];

  parsed.data.forEach((raw, i) => {
    const firstName = (raw.firstname ?? raw["first name"] ?? raw["שם פרטי"] ?? "").trim();
    const lastName = (raw.lastname ?? raw["last name"] ?? raw["שם משפחה"] ?? "").trim();
    const phoneRaw = (raw.phone ?? raw["טלפון"] ?? "").trim();
    const sideRaw = (raw.side ?? raw["צד"] ?? "both").trim().toLowerCase();
    const relation = (raw.relation ?? raw["קרבה"] ?? "").trim() || undefined;
    const invitedRaw = raw.invitedcount ?? raw["invited count"] ?? raw["מוזמנים"] ?? "1";

    if (!firstName || !lastName) {
      errors.push({ row: i + 2, reason: "חסר שם פרטי או משפחה", raw });
      return;
    }

    const phone = normalizePhone(phoneRaw);
    if (!phone) {
      errors.push({ row: i + 2, reason: `טלפון לא תקין: ${phoneRaw}`, raw });
      return;
    }

    const side = SIDE_MAP[sideRaw] ?? "BOTH";
    const invitedCount = Math.max(1, parseInt(String(invitedRaw), 10) || 1);

    valid.push({ firstName, lastName, phone, side, relation, invitedCount });
  });

  return { valid, errors };
}

export function guestsToCsv(
  rows: Array<{
    firstName: string;
    lastName: string;
    phone: string;
    side: string;
    relation: string | null;
    invitedCount: number;
    rsvpStatus: string;
    attendingCount: number | null;
    dietary: string | null;
    tableLabel: string | null;
  }>
) {
  return Papa.unparse(
    rows.map((r) => ({
      firstName: r.firstName,
      lastName: r.lastName,
      phone: r.phone,
      side: r.side,
      relation: r.relation ?? "",
      invitedCount: r.invitedCount,
      rsvpStatus: r.rsvpStatus,
      attendingCount: r.attendingCount ?? "",
      dietary: r.dietary ?? "",
      table: r.tableLabel ?? "",
    }))
  );
}
