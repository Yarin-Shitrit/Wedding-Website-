"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Props = {
  bySide: { side: string; total: number; attending: number }[];
  byDay: { date: string; count: number }[];
  tableLoad: { name: string; capacity: number; seated: number }[];
};

export function MetricsCharts({ bySide, byDay, tableLoad }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card">
        <h2 className="font-display text-xl text-stone-800">Responses over time</h2>
        <div className="h-64 mt-3">
          <ResponsiveContainer>
            <LineChart data={byDay}>
              <CartesianGrid stroke="#f0ebe0" strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#b85948" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-xl text-stone-800">Invited vs. attending by side</h2>
        <div className="h-64 mt-3">
          <ResponsiveContainer>
            <BarChart data={bySide}>
              <CartesianGrid stroke="#f0ebe0" strokeDasharray="3 3" />
              <XAxis dataKey="side" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="total" name="Invited" fill="#e89b8f" />
              <Bar dataKey="attending" name="Attending" fill="#b85948" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card lg:col-span-2">
        <h2 className="font-display text-xl text-stone-800">Seating utilization</h2>
        <div className="h-72 mt-3">
          <ResponsiveContainer>
            <BarChart data={tableLoad}>
              <CartesianGrid stroke="#f0ebe0" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="capacity" name="Capacity" fill="#cfbc97" />
              <Bar dataKey="seated" name="Seated" fill="#b85948" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
