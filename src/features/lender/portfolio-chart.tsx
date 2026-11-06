"use client";

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useMoney } from "@/features/tenants/tenant-context";
import type { MonthlyPoint } from "@/types";

export function PortfolioChart({ data }: { data: MonthlyPoint[] }) {
  const money = useMoney();
  return (
    <div className="h-72 w-full" role="img" aria-label="Bar chart of amounts disbursed and collected per month for the last six months">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
          <YAxis
            width={68}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            tickFormatter={(value: number) => money(value, { compact: true })}
          />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            formatter={(value) => money(Number(value))}
            contentStyle={{ borderRadius: "var(--radius)", border: "1px solid var(--border)", fontSize: 12 }}
          />
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="disbursed" name="Disbursed" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="collected" name="Collected" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
