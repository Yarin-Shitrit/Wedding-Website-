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
    const existing = await prisma.guest.findUnique({ where: { phone: row.phone } });
    if (existing) {
      await prisma.guest.update({
        where: { phone: row.phone },
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          side: row.side,
          relation: row.relation ?? null,
          invitedCount: row.invitedCount,
        },
      });
      updated++;
    } else {
      await prisma.guest.create({
        data: {
          firstName: row.firstName,
          lastName: row.lastName,
          phone: row.phone,
          side: row.side,
          relation: row.relation ?? null,
          invitedCount: row.invitedCount,
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
