"use client";

import { useFetch } from "./use-fetch";
import type { Doctor } from "@/types";

export function useDoctors() {
  const { data, loading, error, refetch } = useFetch<{ doctors: Doctor[] }>("/api/doctors");
  return { doctors: data?.doctors ?? [], loading, error, refetch };
}

export function useDoctor(id: string) {
  const { data, loading, error, refetch } = useFetch<{ doctor: Doctor }>(`/api/doctors/${id}`);
  return { doctor: data?.doctor ?? null, loading, error, refetch };
}
