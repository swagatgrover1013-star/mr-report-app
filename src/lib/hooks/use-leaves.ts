"use client";

import { useFetch } from "./use-fetch";
import type { Leave } from "@/types";

export function useLeaves() {
  const { data, loading, error, refetch } = useFetch<{ leaves: Leave[] }>("/api/leaves");
  return { leaves: data?.leaves ?? [], loading, error, refetch };
}
