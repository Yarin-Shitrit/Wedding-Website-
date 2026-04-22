import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { parseGuestCsv } from "@/lib/csv";

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const { csv } = (await req.json().catch(() => ({}))) as { csv?: string };
  if (!csv || typeof csv !== "string") {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  const { valid, errors } = parseGuestCsv(csv);

  let added = 0;
  let updated = 0;
  for (const row of valid) {
    // Dedup key:
    //  - If the row has a phone, use phone (it's unique in the DB).
    //  - Otherwise, fall back to firstName+lastName so repeat imports
    //    don't create duplicates for guests without a phone on file.
    let existing = null as Awaited<
      ReturnType<typeof prisma.guest.findFirst>
    > | null;
    if (row.phone) {
      existing = await prisma.guest.findUnique({ where: { phone: row.phone } });
    } else {
      existing = await prisma.guest.findFirst({
        where: {
          firstName: row.firstName,
          lastName: row.lastName,
          phone: null,
        },
      });
    }
    if (existing) {
      await prisma.guest.update({
        where: { id: existing.id },
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone ?? null,
          side: row.side,
          relation: row.relation,
          invitedCount: row.invitedCount,
          rsvpStatus: row.rsvpStatus,
          notes: row.notes,
        },
      });
      updated++;
    } else {
      await prisma.guest.create({
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone ?? null,
          side: row.side,
          relation: row.relation,
          invitedCount: row.invitedCount,
          rsvpStatus: row.rsvpStatus,
          notes: row.notes,
        },
      });
      added++;
    }
  }

  await prisma.auditLog.create({
    data: {
      actor: "admin",
      action: "guests.import",
      payload: { added, updated, errorCount: errors.length },
    },
  });

  return NextResponse.json({ ok: true, added, updated, errors });
}
