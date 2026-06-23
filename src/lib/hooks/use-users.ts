"use client";

import { useFetch } from "./use-fetch";
import type { User } from "@/types";

export function useUsers() {
  const { data, loading, error, refetch } = useFetch<{ users: User[] }>("/api/users");
  return { users: data?.users ?? [], loading, error, refetch };
}

export function useUser(id: string) {
  const { data, loading, error, refetch } = useFetch<{ user: User }>(`/api/users/${id}`);
  return { user: data?.user ?? null, loading, error, refetch };
}
