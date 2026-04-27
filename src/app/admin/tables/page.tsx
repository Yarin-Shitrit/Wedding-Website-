import { prisma } from "@/lib/prisma";
import { TablesClient } from "./TablesClient";

export const dynamic = "force-dynamic";

export default async function TablesPage() {
  const [tables, guests] = await Promise.all([
    prisma.table.findMany({
      include: { guests: true, _count: { select: { guests: true } } },
      orderBy: { name: "asc" }
    }),
    prisma.guest.findMany({
      where: { tableId: null, status: { in: ["ATTENDING", "MAYBE", "PENDING"] } },
      orderBy: { lastName: "asc" }
    })
  ]);

  return (
    <div>
      <h1 className="text-3xl font-display text-stone-800">Table organization</h1>
      <p className="text-stone-500 mt-1">
        Create tables, set capacity, and drag unassigned guests into a table.
      </p>
      <TablesClient
        initialTables={tables.map((t) => ({
          id: t.id,
          name: t.name,
          capacity: t.capacity,
          notes: t.notes,
          guests: t.guests.map((g) => ({
            id: g.id,
            firstName: g.firstName,
            lastName: g.lastName,
            status: g.status as "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE",
            seatsConfirmed: g.seatsConfirmed,
            seatsInvited: g.seatsInvited
          }))
        }))}
        unassigned={guests.map((g) => ({
          id: g.id,
          firstName: g.firstName,
          lastName: g.lastName,
          status: g.status as "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE",
          seatsConfirmed: g.seatsConfirmed,
          seatsInvited: g.seatsInvited
        }))}
      />
    </div>
  );
}
