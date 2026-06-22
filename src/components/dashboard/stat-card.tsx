"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  deltaPositive?: boolean;
  icon: LucideIcon;
  accent?: "indigo" | "brass" | "ink";
  index?: number;
}

export function StatCard({ label, value, delta, deltaPositive = true, icon: Icon, accent = "indigo", index = 0 }: StatCardProps) {
  const accentBg = {
    indigo: "bg-indigo-soft text-indigo-deep",
    brass: "bg-brass-soft text-brass-deep",
    ink: "bg-ink/5 text-ink",
  }[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      className="rounded-(--radius-lg) border border-border bg-card-elevated p-5 shadow-premium transition-shadow hover:shadow-premium-lg"
    >
      <div className="flex items-start justify-between">
        <div className={cn("icon-puck flex h-10 w-10 items-center justify-center rounded-(--radius-sm)", accentBg)}>
          <Icon className="h-[19px] w-[19px]" strokeWidth={2} />
        </div>
        {delta && (
          <span
            className={cn(
              "text-xs font-medium px-2 py-1 rounded-full",
              deltaPositive ? "bg-indigo-soft text-indigo-deep" : "bg-signal-rose-soft text-signal-rose"
            )}
          >
            {delta}
          </span>
        )}
      </div>
      <p className="font-display text-3xl text-ink mt-4 tracking-tight">{value}</p>
      <p className="text-sm text-slate mt-1">{label}</p>
    </motion.div>
  );
}
