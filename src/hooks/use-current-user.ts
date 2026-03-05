"use client";

import { useQuery } from "convex/react";

import { api } from "@/lib/convex-api";

export function useCurrentUser() {
  return useQuery(api.users.me, {});
}
