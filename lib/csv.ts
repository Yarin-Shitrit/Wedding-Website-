import Papa from "papaparse";
import { Side, RsvpStatus } from "@prisma/client";
import { normalizePhone } from "./phone";

export type CsvGuestRow = {
  firstName: string;
  lastName: string;
  phone: string | null;
  side: Side;
  relation: string | null;
  invitedCount: number;
  rsvpStatus: RsvpStatus;
  notes: string | null;
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

const STATUS_MAP: Record<string, RsvpStatus> = {
  pending: "PENDING",
  attending: "ATTENDING",
  declined: "DECLINED",
  maybe: "MAYBE",
  "טרם סומן": "PENDING",
  ממתין: "PENDING",
  מגיע: "ATTENDING",
  מגיעה: "ATTENDING",
  מגיעים: "ATTENDING",
  "לא מגיע": "DECLINED",
  "לא מגיעה": "DECLINED",
  "לא מגיעים": "DECLINED",
  אולי: "MAYBE",
};

function normHeader(h: string) {
  return h
    .trim()
    .toLowerCase()
    .replace(/﻿/g, "")
    .replace(/\s+/g, " ");
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const cleaned = full.trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: "", lastName: "" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
}

// Heuristic: decide whether the first row is a header or data.
// Returns true when the first row looks like headers (non-numeric in the
// first cell, or at least one Hebrew/English known column label present).
function looksLikeHeader(firstRow: string[]): boolean {
  if (!firstRow.length) return false;
  const joined = firstRow.map((c) => c.trim().toLowerCase()).join("|");
  const knownTokens = [
    "firstname",
    "first name",
    "lastname",
    "last name",
    "phone",
    "שם",
    "שם פרטי",
    "שם מלא",
    "שם משפחה",
    "טלפון",
    "צד",
    "קרבה",
    "סטטוס",
    "מוזמנים",
    "גיל",
    "קבוצה",
  ];
  if (knownTokens.some((t) => joined.includes(t))) return true;
  // If first cell is a pure integer, it's almost certainly a data row.
  if (/^\d+$/.test(firstRow[0]?.trim() ?? "")) return false;
  // If any cell looks like a phone, it's data.
  if (firstRow.some((c) => /\d{7,}/.test(c))) return false;
  return true;
}

function buildRowFromPositional(cells: string[]): {
  raw: Record<string, string>;
  row: Partial<CsvGuestRow> & { fullName?: string };
} {
  // Supported positional shapes:
  //   A) 7 cols: #, fullName, ageGroup, group, status, genderAge, phone
  //   B) 6 cols: same as above minus the leading index
  //   C) 5 cols: fullName, ageGroup, group, status, phone
  //   D) 2-3 cols: fullName, phone?, group?
  //
  // We always keep a copy of the cells under numeric keys so error reports
  // can point back to the source.
  const raw: Record<string, string> = {};
  cells.forEach((c, i) => (raw[`col${i + 1}`] = c));
  const out: Partial<CsvGuestRow> & { fullName?: string } = {};

  const hasLeadingIndex =
    cells.length >= 6 && /^\d+$/.test((cells[0] ?? "").trim());
  const off = hasLeadingIndex ? 1 : 0;
  const col = (i: number) => (cells[off + i] ?? "").trim();

  out.fullName = col(0);

  const remaining = cells.length - off;
  if (remaining >= 6) {
    // fullName, ageGroup, group, status, genderAge, phone
    const ageGroup = col(1);
    const group = col(2);
    const status = col(3);
    const phone = col(5);
    out.relation = group || null;
    out.rsvpStatus = STATUS_MAP[status.toLowerCase()] ?? "PENDING";
    out.phone = phone || null;
    if (ageGroup) out.notes = ageGroup;
  } else if (remaining >= 5) {
    const ageGroup = col(1);
    const group = col(2);
    const status = col(3);
    const phone = col(4);
    out.relation = group || null;
    out.rsvpStatus = STATUS_MAP[status.toLowerCase()] ?? "PENDING";
    out.phone = phone || null;
    if (ageGroup) out.notes = ageGroup;
  } else if (remaining === 4) {
    out.relation = col(1) || null;
    out.rsvpStatus = STATUS_MAP[col(2).toLowerCase()] ?? "PENDING";
    out.phone = col(3) || null;
  } else if (remaining === 3) {
    out.phone = col(1) || null;
    out.relation = col(2) || null;
    out.rsvpStatus = "PENDING";
  } else if (remaining === 2) {
    out.phone = col(1) || null;
    out.rsvpStatus = "PENDING";
  } else {
    out.rsvpStatus = "PENDING";
  }

  return { raw, row: out };
}

function buildRowFromHeader(
  raw: Record<string, string>
): Partial<CsvGuestRow> & { fullName?: string } {
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = raw[k];
      if (v !== undefined && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  const firstName = get("firstname", "first name", "שם פרטי");
  const lastName = get("lastname", "last name", "שם משפחה");
  const fullName = get("שם מלא", "שם", "fullname", "full name", "name");
  const phoneRaw = get("phone", "טלפון", "נייד", "מובייל", "mobile");
  const sideRaw = get("side", "צד").toLowerCase();
  const relationRaw = get(
    "relation",
    "קרבה",
    "קבוצה",
    "סוג",
    "קטגוריה",
    "group"
  );
  const invitedRaw = get(
    "invitedcount",
    "invited count",
    "invited",
    "מוזמנים",
    "כמות"
  );
  const statusRaw = get("status", "rsvp", "סטטוס", "סטטוס הגעה", "הגעה");
  const ageGroup = get("גיל", "age", "age group");
  const notesExtra = get("notes", "הערות", "הערה");

  return {
    fullName: fullName || `${firstName} ${lastName}`.trim(),
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    phone: phoneRaw || null,
    side: SIDE_MAP[sideRaw] ?? "BOTH",
    relation: relationRaw || null,
    invitedCount: Math.max(1, parseInt(invitedRaw, 10) || 1),
    rsvpStatus: STATUS_MAP[statusRaw.toLowerCase()] ?? "PENDING",
    notes: [ageGroup, notesExtra].filter(Boolean).join(" · ") || null,
  };
}

export function parseGuestCsv(csvText: string): ParsedCsv {
  // First, do a headerless parse so we can inspect the first row.
  const probe = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });
  const rows = probe.data as string[][];
  const hasHeader = rows.length > 0 ? looksLikeHeader(rows[0]) : false;

  const valid: CsvGuestRow[] = [];
  const errors: ParsedCsv["errors"] = [];

  const records: {
    raw: Record<string, string>;
    partial: Partial<CsvGuestRow> & { fullName?: string };
    rowIndex: number;
  }[] = [];

  if (hasHeader) {
    const headerParsed = Papa.parse<Record<string, string>>(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: normHeader,
    });
    headerParsed.data.forEach((raw, i) => {
      records.push({
        raw,
        partial: buildRowFromHeader(raw),
        rowIndex: i + 2,
      });
    });
  } else {
    rows.forEach((cells, i) => {
      const built = buildRowFromPositional(cells);
      records.push({ raw: built.raw, partial: built.row, rowIndex: i + 1 });
    });
  }

  for (const rec of records) {
    const p = rec.partial;

    let firstName = (p.firstName ?? "").trim();
    let lastName = (p.lastName ?? "").trim();
    if ((!firstName || !lastName) && p.fullName) {
      const split = splitFullName(p.fullName);
      firstName = firstName || split.firstName;
      lastName = lastName || split.lastName;
    }
    if (!firstName) {
      errors.push({ row: rec.rowIndex, reason: "חסר שם", raw: rec.raw });
      continue;
    }
    if (!lastName) lastName = firstName;

    const phone = p.phone ? normalizePhone(p.phone) : null;
    if (p.phone && !phone) {
      errors.push({
        row: rec.rowIndex,
        reason: `טלפון לא תקין: ${p.phone}`,
        raw: rec.raw,
      });
      continue;
    }

    valid.push({
      firstName,
      lastName,
      phone,
      side: p.side ?? "BOTH",
      relation: p.relation ?? null,
      invitedCount: p.invitedCount ?? 1,
      rsvpStatus: p.rsvpStatus ?? "PENDING",
      notes: p.notes ?? null,
    });
  }

  return { valid, errors };
}

export function guestsToCsv(
  rows: Array<{
    firstName: string;
    lastName: string;
    phone: string | null;
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
      phone: r.phone ?? "",
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
