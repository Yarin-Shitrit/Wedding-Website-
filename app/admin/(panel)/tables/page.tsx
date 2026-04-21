import { prisma } from "@/lib/db";
import { TablesManager } from "@/components/admin/TablesManager";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function AdminTablesPage() {
  const [tables, guests] = await Promise.all([
    prisma.table.findMany({ orderBy: { label: "asc" } }),
    prisma.guest.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{he.admin.tables}</h1>
        <p className="text-sm text-ink/60 mt-1">
          {tables.length} שולחנות · {guests.filter((g) => !g.tableId).length} לא משובצים
        </p>
      </header>
      <TablesManager initialTables={tables} initialGuests={guests} />
    </div>
  );
}
