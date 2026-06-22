"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  steps: string[];
  current: number;
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Desktop */}
      <div className="hidden md:flex items-center w-full">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none min-w-0">
            <div className="flex items-center gap-2 min-w-0" title={label}>
              <div
                className={cn(
                  "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium transition-colors duration-300",
                  i < current
                    ? "bg-indigo text-white"
                    : i === current
                    ? "bg-indigo text-white ring-4 ring-indigo-mist"
                    : "bg-secondary text-slate"
                )}
              >
                {i < current ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              {i === current && (
                <span className="text-sm font-medium whitespace-nowrap text-ink truncate">
                  {label}
                </span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-px bg-stone mx-1.5 sm:mx-2.5 relative overflow-hidden min-w-2.5">
                <motion.div
                  className="absolute inset-0 bg-indigo"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: i < current ? 1 : 0 }}
                  style={{ originX: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink">{steps[current]}</span>
          <span className="text-xs text-slate-light font-mono">{current + 1}/{steps.length}</span>
        </div>
        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-indigo rounded-full"
            animate={{ width: `${((current + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
