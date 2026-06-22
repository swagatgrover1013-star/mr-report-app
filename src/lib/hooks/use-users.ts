"use client";

import { useFetch } from "./use-fetch";
import type { User } from "@/types";

export function useUsers() {
  const { data, loading, error, refetch } = useFetch<{ users: User[] }>("/api/users");
  return { users: data?.users ?? [], loading, error, refetch };
}
