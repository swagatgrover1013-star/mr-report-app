"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";
import type { Visit } from "@/types";
import { useMemo } from "react";

export function VisitsPerDayChart({ visits }: { visits: Visit[] }) {
  const data = useMemo(() => {
    const today = new Date("2026-06-17");
    const days = Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(today, 13 - i);
      const key = d.toISOString().split("T")[0];
      const count = visits.filter((v) => v.visitDate === key).length;
      return { date: format(d, "MMM d"), visits: count };
    });
    return days;
  }, [visits]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="visitsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--indigo)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--indigo)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--stone)" strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 11, fill: "var(--slate)" }}
          interval={1}
        />
        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "var(--slate)" }} width={28} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: "var(--ink)",
            border: "none",
            borderRadius: "10px",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          labelStyle={{ color: "var(--porcelain)", marginBottom: 2 }}
          itemStyle={{ color: "var(--porcelain)" }}
          cursor={{ stroke: "var(--indigo)", strokeWidth: 1, strokeDasharray: "3 3" }}
        />
        <Area
          type="monotone"
          dataKey="visits"
          stroke="var(--indigo)"
          strokeWidth={2.5}
          fill="url(#visitsGradient)"
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
