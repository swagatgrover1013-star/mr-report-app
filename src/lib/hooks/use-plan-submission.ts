"use client";

import { useFetch } from "./use-fetch";
import type { PlanSubmission } from "@/types";

export function usePlanSubmission(month: string, userId?: string) {
  const params = new URLSearchParams({ month });
  if (userId) params.set("userId", userId);
  const { data, loading, error, refetch } = useFetch<{ submission: PlanSubmission }>(`/api/plan-submissions?${params.toString()}`);
  return { submission: data?.submission ?? null, loading, error, refetch };
}
