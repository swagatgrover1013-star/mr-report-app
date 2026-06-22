import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5)]",
  {
    variants: {
      variant: {
        default: "border-transparent bg-indigo-soft text-indigo-deep",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        outline: "border-border text-foreground bg-transparent",
        brass: "border-transparent bg-brass-soft text-brass-deep",
        rose: "border-transparent bg-signal-rose-soft text-signal-rose",
        amber: "border-transparent bg-signal-amber-soft text-signal-amber",
        ink: "border-transparent bg-ink text-porcelain",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
