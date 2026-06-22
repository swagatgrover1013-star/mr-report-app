import type { RecommendationLevel } from "@/types";

export const recommendationLabels: Record<RecommendationLevel, string> = {
  strong: "Strongly Recommend",
  moderate: "Moderately Recommend",
  occasional: "Occasionally Recommend",
  not_interested: "Not Interested",
};

export const recommendationColors: Record<RecommendationLevel, string> = {
  strong: "var(--indigo)",
  moderate: "var(--brass)",
  occasional: "var(--signal-amber)",
  not_interested: "var(--signal-rose)",
};
