import { prisma } from "@/lib/db";
import { GuestsManager } from "@/components/admin/GuestsManager";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function AdminGuestsPage() {
  const [guests, tables] = await Promise.all([
    prisma.guest.findMany({
      include: { table: { select: { id: true, label: true } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.table.findMany({
      select: { id: true, label: true, capacity: true },
      orderBy: { label: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{he.admin.guests}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {guests.length} מוזמנים · {guests.filter((g) => g.rsvpStatus === "ATTENDING").length} אישרו הגעה
        </p>
      </header>
      <GuestsManager initialGuests={guests} tables={tables} />
    </div>
  );
}
