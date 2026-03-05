"use client";

import { useMutation } from "convex/react";
import type { FunctionReference } from "convex/server";

export function useOptimisticMutation<T extends FunctionReference<"mutation">>(
  mutation: T,
  optimisticUpdate?: (localStore: any, args: any) => void,
) {
  const mutate = useMutation(mutation);
  if (optimisticUpdate) {
    return mutate.withOptimisticUpdate(optimisticUpdate);
  }
  return mutate;
}
