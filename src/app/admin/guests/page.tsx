import { prisma } from "@/lib/prisma";
import { GuestsClient } from "./GuestsClient";

export const dynamic = "force-dynamic";

export default async function GuestsPage() {
  const [guests, tables] = await Promise.all([
    prisma.guest.findMany({
      orderBy: { createdAt: "desc" },
      include: { table: { select: { id: true, name: true } } }
    }),
    prisma.table.findMany({ orderBy: { name: "asc" } })
  ]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display text-stone-800">Guests</h1>
          <p className="text-stone-500 mt-1">Manage your guest list, import from CSV, assign to tables.</p>
        </div>
      </div>
      <GuestsClient
        initialGuests={guests.map((g) => ({
          ...g,
          side: g.side as "BRIDE" | "GROOM" | "SHARED",
          status: g.status as "PENDING" | "ATTENDING" | "DECLINED" | "MAYBE",
          createdAt: g.createdAt.toISOString(),
          updatedAt: g.updatedAt.toISOString(),
          respondedAt: g.respondedAt ? g.respondedAt.toISOString() : null
        }))}
        tables={tables.map((t) => ({ id: t.id, name: t.name, capacity: t.capacity }))}
      />
    </div>
  );
}
