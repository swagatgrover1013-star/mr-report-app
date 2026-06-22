"use client";

import { useFetch } from "./use-fetch";
import type { Stockist } from "@/types";

export function useStockists() {
  const { data, loading, error, refetch } = useFetch<{ stockists: Stockist[] }>("/api/stockists");
  return { stockists: data?.stockists ?? [], loading, error, refetch };
}

export function useStockist(id: string) {
  const { data, loading, error, refetch } = useFetch<{ stockist: Stockist }>(`/api/stockists/${id}`);
  return { stockist: data?.stockist ?? null, loading, error, refetch };
}
