"use client";

import { useFetch } from "./use-fetch";
import type { Chemist } from "@/types";

export function useChemists() {
  const { data, loading, error, refetch } = useFetch<{ chemists: Chemist[] }>("/api/chemists");
  return { chemists: data?.chemists ?? [], loading, error, refetch };
}

export function useChemist(id: string) {
  const { data, loading, error, refetch } = useFetch<{ chemist: Chemist }>(`/api/chemists/${id}`);
  return { chemist: data?.chemist ?? null, loading, error, refetch };
}
