import { Badge } from "@/components/ui/badge";
import { recommendationLabels } from "@/data/mock";
import type { RecommendationLevel } from "@/types";
import { cn } from "@/lib/utils";

const variantMap: Record<RecommendationLevel, "default" | "brass" | "amber" | "rose"> = {
  strong: "default",
  moderate: "brass",
  occasional: "amber",
  not_interested: "rose",
};

export function RecommendationBadge({ level, className }: { level: RecommendationLevel; className?: string }) {
  return (
    <Badge variant={variantMap[level]} className={cn(className)}>
      {recommendationLabels[level]}
    </Badge>
  );
}
