import Link from "next/link";
import { computeMetrics } from "@/lib/metrics";
import { Metric } from "@/components/admin/Metric";
import {
  StatusPie,
  SideBar,
  TableUtilization,
  ResponsesOverTime,
} from "@/components/admin/MetricsCharts";
import { SeedButton } from "@/components/admin/SeedButton";
import { he } from "@/messages/he";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const m = await computeMetrics();
  const empty = m.totals.invited === 0 && m.tableUtilization.length === 0;
  const responseRate =
    m.totals.invited > 0
      ? Math.round(
          ((m.totals.attending + m.totals.declined + m.totals.maybe) /
            m.totals.invited) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{he.admin.dashboard}</h1>
        <Link href="/admin/guests" className="btn-secondary hidden sm:inline-flex">
          לניהול מוזמנים
        </Link>
      </header>

      {empty && <SeedButton />}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Metric label={he.admin.metrics.invited} value={m.totals.invited} hint={`${m.totals.invitedHeads} מקומות`} />
        <Metric label={he.admin.metrics.attending} value={m.totals.attending} tone="positive" hint={`${m.totals.headcount} סועדים`} />
        <Metric label={he.admin.metrics.declined} value={m.totals.declined} tone="muted" />
        <Metric label={he.admin.metrics.pending} value={m.totals.pending} tone="warning" hint={`${responseRate}% ${he.admin.metrics.responseRate}`} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <StatusPie data={m.byStatus} />
        <SideBar data={m.bySide} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <TableUtilization data={m.tableUtilization} />
        <ResponsesOverTime data={m.responseOverTime} />
      </div>

      <div className="card">
        <h3 className="text-sm font-medium mb-3">{he.admin.metrics.pendingFollowUp}</h3>
        {m.pending.length === 0 ? (
          <p className="text-sm text-ink/50">{he.common.empty}</p>
        ) : (
          <ul className="divide-y divide-sage-100">
            {m.pending.map((g) => (
              <li key={g.id} className="py-2 flex items-center justify-between">
                <span>
                  {g.firstName} {g.lastName}
                </span>
                <a
                  className="text-sage-700 text-sm"
                  href={`https://wa.me/${g.phone.replace("+", "")}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  WhatsApp
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {m.dietary.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium mb-3">{he.admin.metrics.dietary}</h3>
          <ul className="text-sm">
            {m.dietary.map((d) => (
              <li key={d.value} className="flex justify-between py-1">
                <span>{d.value}</span>
                <span className="tabular-nums">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
