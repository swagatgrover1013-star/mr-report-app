"use client";

import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { useMemo } from "react";
import { useProducts } from "@/lib/hooks/use-products";

export function TopProductsChart() {
  const { products } = useProducts();
  const data = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.totalMentions - a.totalMentions)
        .slice(0, 6)
        .map((p) => ({ name: p.name.split(" ").slice(0, 2).join(" "), mentions: p.totalMentions })),
    [products]
  );

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barSize={16}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={140}
          tick={{ fontSize: 12, fill: "var(--ink-soft)" }}
        />
        <Tooltip
          contentStyle={{
            background: "var(--ink)",
            border: "none",
            borderRadius: "10px",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          itemStyle={{ color: "var(--porcelain)" }}
          cursor={{ fill: "var(--porcelain-dim)" }}
        />
        <Bar dataKey="mentions" radius={[0, 6, 6, 0]} animationDuration={800}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? "var(--indigo)" : "var(--indigo-mist)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
