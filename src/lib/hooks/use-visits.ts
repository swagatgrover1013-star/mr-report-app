"use client";

import { useFetch } from "./use-fetch";
import type { Visit } from "@/types";

export function useVisits() {
  const { data, loading, error, refetch } = useFetch<{ visits: Visit[] }>("/api/visits");
  return { visits: data?.visits ?? [], loading, error, refetch };
}

export function useVisit(id: string) {
  const { data, loading, error, refetch } = useFetch<{ visit: Visit }>(`/api/visits/${id}`, { enabled: !!id });
  return { visit: data?.visit ?? null, loading, error, refetch };
}
