"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useMemo } from "react";
import type { Visit } from "@/types";
import { recommendationColors, recommendationLabels } from "@/data/mock";

export function RecommendationDonut({ visits }: { visits: Visit[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { strong: 0, moderate: 0, occasional: 0, not_interested: 0 };
    visits.forEach((v) => {
      counts[v.overallRecommendation]++;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: recommendationLabels[key as keyof typeof recommendationLabels],
      value,
      color: recommendationColors[key as keyof typeof recommendationColors],
    }));
  }, [visits]);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={62}
          outerRadius={92}
          paddingAngle={3}
          animationDuration={800}
          strokeWidth={0}
        >
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--ink)",
            border: "none",
            borderRadius: "10px",
            fontSize: "12px",
            padding: "8px 12px",
          }}
          itemStyle={{ color: "var(--porcelain)" }}
        />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span style={{ fontSize: 12, color: "var(--slate)" }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
