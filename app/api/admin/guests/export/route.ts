import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAdminSession } from "@/lib/auth";
import { guestsToCsv } from "@/lib/csv";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const guests = await prisma.guest.findMany({
    include: { table: { select: { label: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  const csv = guestsToCsv(
    guests.map((g) => ({
      firstName: g.firstName,
      lastName: g.lastName,
      phone: g.phone,
      side: g.side,
      relation: g.relation,
      invitedCount: g.invitedCount,
      rsvpStatus: g.rsvpStatus,
      attendingCount: g.attendingCount,
      dietary: g.dietary,
      tableLabel: g.table?.label ?? null,
    }))
  );
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="guests.csv"',
    },
  });
}
