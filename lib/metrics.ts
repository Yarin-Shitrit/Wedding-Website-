import { prisma } from "./db";
import { RsvpStatus, Side } from "@prisma/client";

export type Metrics = {
  totals: {
    invited: number;
    attending: number;
    declined: number;
    pending: number;
    maybe: number;
    headcount: number;
    invitedHeads: number;
  };
  bySide: { side: Side; count: number }[];
  byStatus: { status: RsvpStatus; count: number }[];
  tableUtilization: {
    tableId: string;
    label: string;
    capacity: number;
    seated: number;
  }[];
  dietary: { value: string; count: number }[];
  pending: { id: string; firstName: string; lastName: string; phone: string }[];
  responseOverTime: { date: string; responses: number }[];
};

export async function computeMetrics(): Promise<Metrics> {
  const [guests, tables] = await Promise.all([
    prisma.guest.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        side: true,
        rsvpStatus: true,
        invitedCount: true,
        attendingCount: true,
        dietary: true,
        tableId: true,
        updatedAt: true,
        createdAt: true,
      },
    }),
    prisma.table.findMany({
      select: { id: true, label: true, capacity: true },
      orderBy: { label: "asc" },
    }),
  ]);

  const totals = {
    invited: guests.length,
    attending: guests.filter((g) => g.rsvpStatus === "ATTENDING").length,
    declined: guests.filter((g) => g.rsvpStatus === "DECLINED").length,
    pending: guests.filter((g) => g.rsvpStatus === "PENDING").length,
    maybe: guests.filter((g) => g.rsvpStatus === "MAYBE").length,
    headcount: guests
      .filter((g) => g.rsvpStatus === "ATTENDING")
      .reduce((acc, g) => acc + (g.attendingCount ?? g.invitedCount), 0),
    invitedHeads: guests.reduce((acc, g) => acc + g.invitedCount, 0),
  };

  const bySideMap = new Map<Side, number>();
  guests.forEach((g) => bySideMap.set(g.side, (bySideMap.get(g.side) ?? 0) + 1));
  const bySide = Array.from(bySideMap, ([side, count]) => ({ side, count }));

  const byStatus: { status: RsvpStatus; count: number }[] = (
    ["ATTENDING", "DECLINED", "PENDING", "MAYBE"] as RsvpStatus[]
  ).map((status) => ({
    status,
    count: guests.filter((g) => g.rsvpStatus === status).length,
  }));

  const seatedByTable = new Map<string, number>();
  guests.forEach((g) => {
    if (g.tableId) {
      const heads = g.attendingCount ?? g.invitedCount;
      seatedByTable.set(g.tableId, (seatedByTable.get(g.tableId) ?? 0) + heads);
    }
  });
  const tableUtilization = tables.map((t) => ({
    tableId: t.id,
    label: t.label,
    capacity: t.capacity,
    seated: seatedByTable.get(t.id) ?? 0,
  }));

  const dietaryMap = new Map<string, number>();
  guests.forEach((g) => {
    const key = (g.dietary ?? "").trim();
    if (!key) return;
    dietaryMap.set(key, (dietaryMap.get(key) ?? 0) + 1);
  });
  const dietary = Array.from(dietaryMap, ([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);

  const pending = guests
    .filter((g) => g.rsvpStatus === "PENDING")
    .slice(0, 20)
    .map((g) => ({
      id: g.id,
      firstName: g.firstName,
      lastName: g.lastName,
      phone: g.phone,
    }));

  // responses over time: group updatedAt dates for guests whose status changed from PENDING
  const responseMap = new Map<string, number>();
  guests
    .filter((g) => g.rsvpStatus !== "PENDING")
    .forEach((g) => {
      const d = g.updatedAt.toISOString().slice(0, 10);
      responseMap.set(d, (responseMap.get(d) ?? 0) + 1);
    });
  const responseOverTime = Array.from(responseMap, ([date, responses]) => ({
    date,
    responses,
  })).sort((a, b) => a.date.localeCompare(b.date));

  return {
    totals,
    bySide,
    byStatus,
    tableUtilization,
    dietary,
    pending,
    responseOverTime,
  };
}
