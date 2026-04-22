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
  "ממתין למענה": "PENDING",
  מגיע: "ATTENDING",
  מגיעה: "ATTENDING",
  מגיעים: "ATTENDING",
  "לא מגיע": "DECLINED",
  "לא מגיעה": "DECLINED",
  "לא מגיעים": "DECLINED",
  אולי: "MAYBE",
};

// Role map: identifies the "meaning" of a header cell. We use substring
// matching (not equality) so slightly off names still work: e.g. a column
// called "שם המוזמן" still maps to `fullName`, "מספר טלפון" to `phone`.
type Role =
  | "index"
  | "fullName"
  | "firstName"
  | "lastName"
  | "phone"
  | "side"
  | "relation"
  | "invitedCount"
  | "status"
  | "ageGroup"
  | "notes";

const HEADER_HINTS: Array<{ role: Role; needles: string[] }> = [
  { role: "index", needles: ["#", "מס", "מספר", "no.", "no", "num", "index", "row"] },
  { role: "firstName", needles: ["first name", "firstname", "שם פרטי"] },
  { role: "lastName", needles: ["last name", "lastname", "שם משפחה"] },
  {
    role: "fullName",
    needles: [
      "full name",
      "fullname",
      "שם מלא",
      "שם המוזמן",
      "שם מוזמן",
      "שם האורח",
      "שם האורחים",
      "name",
      "שם",
    ],
  },
  {
    role: "phone",
    needles: ["phone", "mobile", "cell", "טלפון", "נייד", "פלאפון", "פלא", "מובייל"],
  },
  { role: "side", needles: ["side", "צד"] },
  {
    role: "relation",
    needles: ["relation", "group", "קרבה", "קבוצה", "קבוצת", "סוג", "קטגוריה", "שייכות"],
  },
  {
    role: "invitedCount",
    needles: ["invited", "count", "מוזמנים", "כמות", "מספר מוזמנים"],
  },
  { role: "status", needles: ["status", "rsvp", "סטטוס", "הגעה", "מענה"] },
  { role: "ageGroup", needles: ["age", "גיל", "קבוצת גיל", "בוגר", "צעיר"] },
  { role: "notes", needles: ["notes", "note", "הערות", "הערה", "תיאור"] },
];

function normalize(s: string) {
  return String(s ?? "")
    .trim()
    .replace(/﻿/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function classifyHeader(cells: string[]): Record<number, Role> {
  const map: Record<number, Role> = {};
  cells.forEach((cell, i) => {
    const c = normalize(cell);
    if (!c) return;
    for (const hint of HEADER_HINTS) {
      if (hint.needles.some((n) => c.includes(n.toLowerCase()))) {
        // Don't let a later hint overwrite an earlier, more specific one
        // for the same column (first match wins).
        if (!(i in map)) map[i] = hint.role;
        break;
      }
    }
  });
  return map;
}

function splitFullName(full: string): { firstName: string; lastName: string } {
  const cleaned = String(full ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return { firstName: "", lastName: "" };
  const parts = cleaned.split(" ");
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
}

// Decide whether a row is a header. A row is a header if at least one cell
// matches a known header hint AND no cell looks like a phone number or a
// pure row index (which would mean it's data).
function isHeaderRow(cells: string[]): boolean {
  if (!cells.length) return false;
  const hasKnown = classifyHeader(cells);
  if (Object.keys(hasKnown).length === 0) return false;
  // If any cell looks like a 7+ digit number, this is probably data.
  for (const c of cells) {
    if (/^\+?\d{7,}$/.test(c.trim())) return false;
  }
  return true;
}

// Positional defaults when we don't have a header row.
// We look at the shape of the first data row to guess.
function inferPositionalMap(sampleCells: string[]): Record<number, Role> {
  const len = sampleCells.length;
  const map: Record<number, Role> = {};
  const hasLeadingIndex =
    len >= 2 && /^\d+$/.test((sampleCells[0] ?? "").trim());
  const off = hasLeadingIndex ? 1 : 0;
  if (hasLeadingIndex) map[0] = "index";

  const remaining = len - off;
  if (remaining >= 6) {
    // # , fullName, ageGroup, group, status, genderAge, phone
    map[off + 0] = "fullName";
    map[off + 1] = "ageGroup";
    map[off + 2] = "relation";
    map[off + 3] = "status";
    // col off+4 is redundant gendered age — leave unmapped
    map[off + 5] = "phone";
  } else if (remaining === 5) {
    // fullName, ageGroup, group, status, phone
    map[off + 0] = "fullName";
    map[off + 1] = "ageGroup";
    map[off + 2] = "relation";
    map[off + 3] = "status";
    map[off + 4] = "phone";
  } else if (remaining === 4) {
    map[off + 0] = "fullName";
    map[off + 1] = "relation";
    map[off + 2] = "status";
    map[off + 3] = "phone";
  } else if (remaining === 3) {
    map[off + 0] = "fullName";
    map[off + 1] = "phone";
    map[off + 2] = "relation";
  } else if (remaining === 2) {
    map[off + 0] = "fullName";
    map[off + 1] = "phone";
  } else if (remaining === 1) {
    map[off + 0] = "fullName";
  }
  return map;
}

function extractRoles(
  cells: string[],
  colMap: Record<number, Role>
): Partial<CsvGuestRow> & { fullName?: string } {
  const by: Partial<Record<Role, string>> = {};
  for (const [idxStr, role] of Object.entries(colMap)) {
    const idx = Number(idxStr);
    const v = (cells[idx] ?? "").toString().trim();
    if (v) by[role] = v;
  }

  const out: Partial<CsvGuestRow> & { fullName?: string } = {};
  if (by.fullName) out.fullName = by.fullName;
  if (by.firstName) out.firstName = by.firstName;
  if (by.lastName) out.lastName = by.lastName;
  if (by.phone) out.phone = by.phone;
  if (by.side) out.side = SIDE_MAP[by.side.toLowerCase()] ?? "BOTH";
  if (by.relation) out.relation = by.relation;
  if (by.invitedCount)
    out.invitedCount = Math.max(1, parseInt(by.invitedCount, 10) || 1);
  if (by.status)
    out.rsvpStatus = STATUS_MAP[by.status.toLowerCase()] ?? "PENDING";
  const notesParts = [by.ageGroup, by.notes].filter(Boolean);
  if (notesParts.length) out.notes = notesParts.join(" · ");
  return out;
}

export function parseGuestCsv(csvText: string): ParsedCsv {
  // 1. Parse headerless so we can inspect the raw cell grid.
  const parsed = Papa.parse<string[]>(csvText, {
    header: false,
    skipEmptyLines: true,
  });
  const rows = (parsed.data as string[][]).filter(
    (r) => r && r.some((c) => String(c ?? "").trim() !== "")
  );

  const valid: CsvGuestRow[] = [];
  const errors: ParsedCsv["errors"] = [];
  if (rows.length === 0) return { valid, errors };

  // Drop leading "title" rows — rows with a single non-empty cell (like
  // "רשימת מוזמנים לחתונה") that sit above the real header. We only do
  // this if the file has any multi-cell row; otherwise we might be dealing
  // with a single-column name list and shouldn't discard anything.
  const anyMultiCell = rows.some(
    (r) => r.filter((c) => String(c ?? "").trim() !== "").length >= 2
  );
  let skippedBefore = 0;
  if (anyMultiCell) {
    while (
      rows.length > 0 &&
      rows[0].filter((c) => String(c ?? "").trim() !== "").length < 2
    ) {
      rows.shift();
      skippedBefore++;
    }
  }

  // 2. Header detection + column mapping.
  let headerRow: string[] | null = null;
  let dataRows: string[][] = rows;
  let colMap: Record<number, Role> = {};

  if (isHeaderRow(rows[0])) {
    headerRow = rows[0];
    dataRows = rows.slice(1);
    colMap = classifyHeader(headerRow);
  }

  // If header didn't identify a name column, infer a positional map from
  // the first data row as a fallback. Only fill in missing roles.
  if (dataRows.length > 0) {
    const needsName =
      !Object.values(colMap).some(
        (r) => r === "fullName" || r === "firstName"
      );
    if (needsName) {
      const inferred = inferPositionalMap(dataRows[0]);
      for (const [k, v] of Object.entries(inferred)) {
        const idx = Number(k);
        if (colMap[idx] === undefined) colMap[idx] = v as Role;
      }
    }
  }

  // 3. Build each row.
  dataRows.forEach((cells, i) => {
    const raw: Record<string, string> = {};
    cells.forEach((c, idx) => {
      const key = headerRow?.[idx]?.trim() || `col${idx + 1}`;
      raw[key] = String(c ?? "");
    });

    let p = extractRoles(cells, colMap);

    // Last-ditch fallback: if no name found, try positional inference on
    // this row directly (helps when rows have variable widths).
    if (!p.fullName && !p.firstName) {
      const altMap = inferPositionalMap(cells);
      const alt = extractRoles(cells, altMap);
      p = { ...alt, ...p };
      if (!p.fullName && alt.fullName) p.fullName = alt.fullName;
    }

    let firstName = (p.firstName ?? "").trim();
    let lastName = (p.lastName ?? "").trim();
    if ((!firstName || !lastName) && p.fullName) {
      const split = splitFullName(p.fullName);
      firstName = firstName || split.firstName;
      lastName = lastName || split.lastName;
    }
    if (!firstName) {
      errors.push({
        row: i + skippedBefore + (headerRow ? 2 : 1),
        reason: "חסר שם",
        raw,
      });
      return;
    }
    if (!lastName) lastName = firstName;

    const phone = p.phone ? normalizePhone(p.phone) : null;
    if (p.phone && !phone) {
      errors.push({
        row: i + skippedBefore + (headerRow ? 2 : 1),
        reason: `טלפון לא תקין: ${p.phone}`,
        raw,
      });
      return;
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
  });

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
