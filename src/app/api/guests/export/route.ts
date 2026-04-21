import { NextResponse } from "next/server";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guests = await prisma.guest.findMany({
    orderBy: { lastName: "asc" },
    include: { table: { select: { name: true } } }
  });

  const rows = guests.map((g) => ({
    firstName: g.firstName,
    lastName: g.lastName ?? "",
    phone: g.phone ?? "",
    email: g.email ?? "",
    side: g.side,
    group: g.group ?? "",
    seatsInvited: g.seatsInvited,
    seatsConfirmed: g.seatsConfirmed,
    status: g.status,
    table: g.table?.name ?? "",
    dietary: g.dietary ?? "",
    notes: g.notes ?? ""
  }));

  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="guests-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`
    }
  });
}
