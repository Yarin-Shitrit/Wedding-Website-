"use client";

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { Metrics } from "@/lib/metrics";
import { he } from "@/messages/he";

const SAGE = "#5E7A5D";
const BLUSH = "#C88671";
const INK = "#2C2A28";
const MUTED = "#B8C1B8";

export function StatusPie({ data }: { data: Metrics["byStatus"] }) {
  const colors: Record<string, string> = {
    ATTENDING: SAGE,
    DECLINED: INK,
    PENDING: MUTED,
    MAYBE: BLUSH,
  };
  const shaped = data.map((d) => ({
    name: he.admin.status[d.status],
    value: d.count,
    key: d.status,
  }));
  return (
    <div className="card">
      <h3 className="text-sm font-medium mb-3">{he.admin.metrics.byStatus}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={shaped} dataKey="value" nameKey="name" innerRadius={40} outerRadius={80}>
              {shaped.map((entry) => (
                <Cell key={entry.key} fill={colors[entry.key] ?? SAGE} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function SideBar({ data }: { data: Metrics["bySide"] }) {
  const shaped = data.map((d) => ({
    name: he.admin.side[d.side],
    value: d.count,
  }));
  return (
    <div className="card">
      <h3 className="text-sm font-medium mb-3">{he.admin.metrics.bySide}</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={shaped}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill={SAGE} radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TableUtilization({
  data,
}: {
  data: Metrics["tableUtilization"];
}) {
  return (
    <div className="card">
      <h3 className="text-sm font-medium mb-3">{he.admin.metrics.tables}</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis dataKey="label" type="category" width={120} />
            <Tooltip />
            <Bar dataKey="capacity" fill={MUTED} radius={[0, 8, 8, 0]} />
            <Bar dataKey="seated" fill={SAGE} radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ResponsesOverTime({
  data,
}: {
  data: Metrics["responseOverTime"];
}) {
  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-medium mb-3">
          {he.admin.metrics.responsesOverTime}
        </h3>
        <p className="text-sm text-ink/50">{he.common.empty}</p>
      </div>
    );
  }
  return (
    <div className="card">
      <h3 className="text-sm font-medium mb-3">
        {he.admin.metrics.responsesOverTime}
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="responses" stroke={BLUSH} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
