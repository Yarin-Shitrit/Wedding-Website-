import { getMetrics } from "@/lib/metrics";
import { MetricsCharts } from "./MetricsCharts";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const m = await getMetrics();

  const stats = [
    { label: "Invited guests", value: m.totals.guests },
    { label: "Seats invited", value: m.totals.seatsInvited },
    { label: "Seats confirmed", value: m.totals.seatsConfirmed },
    { label: "Response rate", value: `${m.responseRate}%` },
    { label: "Attending", value: m.totals.attending },
    { label: "Declined", value: m.totals.declined },
    { label: "Maybe", value: m.totals.maybe },
    { label: "No response", value: m.totals.pending },
    { label: "Unassigned to table", value: m.totals.unassigned }
  ];

  return (
    <div>
      <h1 className="text-3xl font-display text-stone-800">Dashboard</h1>
      <p className="text-stone-500 mt-1">A live overview to guide your decisions.</p>

      <div className="mt-6 grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-xs uppercase tracking-wider text-stone-500">{s.label}</div>
            <div className="mt-2 text-3xl font-display text-rose-600">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <MetricsCharts bySide={m.bySide} byDay={m.byDay} tableLoad={m.tableLoad} />
      </div>
    </div>
  );
}
