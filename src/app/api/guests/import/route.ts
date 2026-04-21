import { NextRequest, NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Row = Record<string, string>;

const FIELD_MAP: Record<string, string> = {
  first: "firstName",
  firstname: "firstName",
  first_name: "firstName",
  "first name": "firstName",
  last: "lastName",
  lastname: "lastName",
  last_name: "lastName",
  "last name": "lastName",
  phone: "phone",
  mobile: "phone",
  email: "email",
  side: "side",
  group: "group",
  category: "group",
  seats: "seatsInvited",
  invited: "seatsInvited",
  seatsinvited: "seatsInvited",
  seats_invited: "seatsInvited",
  table: "tableName"
};

function normaliseSide(v?: string): "BRIDE" | "GROOM" | "SHARED" {
  const x = (v ?? "").toLowerCase();
  if (x.startsWith("b") || x.includes("bride") || x.includes("כלה")) return "BRIDE";
  if (x.startsWith("g") || x.includes("groom") || x.includes("חתן")) return "GROOM";
  return "SHARED";
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const text = await req.text();
  if (!text.trim()) return NextResponse.json({ error: "Empty file" }, { status: 400 });

  const parsed = Papa.parse<Row>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => FIELD_MAP[h.trim().toLowerCase()] ?? h.trim()
  });
  if (parsed.errors.length) {
    return NextResponse.json({ error: parsed.errors[0].message }, { status: 400 });
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of parsed.data) {
    const firstName = (row.firstName ?? "").trim();
    if (!firstName) {
      skipped++;
      continue;
    }
    const phone = (row.phone ?? "").trim() || null;
    const lastName = (row.lastName ?? "").trim() || null;
    const email = (row.email ?? "").trim() || null;
    const side = normaliseSide(row.side);
    const group = (row.group ?? "").trim() || null;
    const seatsInvited = Math.max(1, Number(row.seatsInvited ?? 1) || 1);
    const tableName = (row.tableName ?? "").trim();

    let tableId: string | null = null;
    if (tableName) {
      const table = await prisma.table.upsert({
        where: { name: tableName },
        update: {},
        create: { name: tableName, capacity: 10 }
      });
      tableId = table.id;
    }

    if (phone) {
      const existing = await prisma.guest.findUnique({ where: { phone } });
      if (existing) {
        await prisma.guest.update({
          where: { id: existing.id },
          data: { firstName, lastName, email, side, group, seatsInvited, tableId }
        });
        updated++;
        continue;
      }
    }

    await prisma.guest.create({
      data: { firstName, lastName, phone, email, side, group, seatsInvited, tableId }
    });
    created++;
  }

  return NextResponse.json({ created, updated, skipped });
}
