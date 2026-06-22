"use client";

import { useFetch } from "./use-fetch";
import type { Product } from "@/types";

export function useProducts() {
  const { data, loading, error, refetch } = useFetch<{ products: Product[] }>("/api/products");
  return { products: data?.products ?? [], loading, error, refetch };
}

export function useProduct(id: string) {
  const { data, loading, error, refetch } = useFetch<{ product: Product }>(`/api/products/${id}`);
  return { product: data?.product ?? null, loading, error, refetch };
}
