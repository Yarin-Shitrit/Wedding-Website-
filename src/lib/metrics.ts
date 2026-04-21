import { prisma } from "./prisma";

export async function getMetrics() {
  const guests = await prisma.guest.findMany({
    select: {
      status: true,
      seatsInvited: true,
      seatsConfirmed: true,
      side: true,
      tableId: true,
      respondedAt: true
    }
  });

  const totals = {
    guests: guests.length,
    seatsInvited: guests.reduce((a, g) => a + g.seatsInvited, 0),
    seatsConfirmed: guests
      .filter((g) => g.status === "ATTENDING")
      .reduce((a, g) => a + g.seatsConfirmed, 0),
    attending: guests.filter((g) => g.status === "ATTENDING").length,
    declined: guests.filter((g) => g.status === "DECLINED").length,
    maybe: guests.filter((g) => g.status === "MAYBE").length,
    pending: guests.filter((g) => g.status === "PENDING").length,
    unassigned: guests.filter((g) => !g.tableId).length
  };

  const bySide = (["BRIDE", "GROOM", "SHARED"] as const).map((side) => {
    const list = guests.filter((g) => g.side === side);
    return {
      side,
      total: list.length,
      attending: list.filter((g) => g.status === "ATTENDING").length
    };
  });

  const responseRate =
    totals.guests === 0
      ? 0
      : Math.round(((totals.attending + totals.declined + totals.maybe) / totals.guests) * 100);

  const responses = guests
    .filter((g) => g.respondedAt)
    .map((g) => g.respondedAt!.toISOString().slice(0, 10));

  const byDay = Object.entries(
    responses.reduce<Record<string, number>>((acc, d) => {
      acc[d] = (acc[d] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const tables = await prisma.table.findMany({
    include: { _count: { select: { guests: true } } },
    orderBy: { name: "asc" }
  });

  const tableLoad = tables.map((t) => ({
    name: t.name,
    capacity: t.capacity,
    seated: t._count.guests
  }));

  return { totals, bySide, responseRate, byDay, tableLoad };
}
