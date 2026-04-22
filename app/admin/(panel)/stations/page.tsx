import { prisma } from "@/lib/db";
import { StationsManager } from "@/components/admin/StationsManager";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function AdminStationsPage() {
  const stations = await prisma.station.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{he.admin.stations.pageTitle}</h1>
        <p className="text-sm text-ink/60 mt-1">{he.admin.stations.pageHelp}</p>
      </header>
      <StationsManager initial={stations} />
    </div>
  );
}
