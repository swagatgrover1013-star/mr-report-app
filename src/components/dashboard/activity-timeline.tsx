"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import type { Visit } from "@/types";

interface ActivityTimelineProps {
  visits: Visit[];
  limit?: number;
}

export function ActivityTimeline({ visits, limit = 6 }: ActivityTimelineProps) {
  const items = visits.slice(0, limit);

  return (
    <div className="relative pl-1">
      {/* The spine */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        style={{ originY: 0 }}
        className="absolute left-[19px] top-2 bottom-2 w-px bg-stone"
      />

      <div className="space-y-5">
        {items.map((visit, i) => (
          <motion.div
            key={visit.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: i * 0.07 }}
            className="relative flex gap-4"
          >
            <div className="relative z-10 flex h-9.5 w-9.5 shrink-0 items-center justify-center">
              <span className="h-3 w-3 rounded-full bg-indigo ring-4 ring-card" />
            </div>
            <div className="flex-1 min-w-0 pb-0.5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink truncate">{visit.partyName}</p>
                <span className="text-xs text-slate-light font-mono shrink-0">
                  {format(new Date(visit.visitDate), "MMM d")}
                </span>
              </div>
              <p className="text-xs text-slate mt-0.5 truncate">
                {visit.mrName} · {visit.products.map((p) => p.productName).slice(0, 2).join(", ")}
                {visit.products.length > 2 ? ` +${visit.products.length - 2}` : ""}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
