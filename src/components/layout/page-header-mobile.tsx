"use client";

import { motion } from "framer-motion";

export function PageHeaderMobile({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className="lg:hidden"
    >
      <h1 className="font-display text-2xl text-ink">{title}</h1>
      {subtitle && <p className="text-sm text-slate mt-0.5">{subtitle}</p>}
    </motion.div>
  );
}
