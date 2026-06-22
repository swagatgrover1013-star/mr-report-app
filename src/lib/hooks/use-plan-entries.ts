"use client";

import { useFetch } from "./use-fetch";
import type { PlanEntry } from "@/types";

export function usePlanEntries(userId?: string) {
  const url = userId ? `/api/plan-entries?userId=${userId}` : "/api/plan-entries";
  const { data, loading, error, refetch } = useFetch<{ planEntries: PlanEntry[] }>(url);
  return { planEntries: data?.planEntries ?? [], loading, error, refetch };
}
