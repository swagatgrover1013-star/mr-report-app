"use client";

import { useFetch } from "./use-fetch";
import type { User } from "@/types";

export function useCurrentUser() {
  const { data, loading, error, refetch } = useFetch<{ user: User }>("/api/auth/me");
  return { user: data?.user ?? null, loading, error, refetch };
}
