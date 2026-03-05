"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";

export function StaleIndicator({ staleAt }: { staleAt?: number | null }) {
  const [now] = useState(() => Date.now());

  if (!staleAt) return null;

  const daysStale = Math.floor((now - staleAt) / (1000 * 60 * 60 * 24));
  const variant = daysStale > 7 ? "destructive" : "secondary";

  return (
    <Badge variant={variant} className="text-xs">
      Stale {daysStale}d
    </Badge>
  );
}
