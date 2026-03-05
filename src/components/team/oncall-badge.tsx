"use client";

import { Badge } from "@/components/ui/badge";

export function OncallBadge({ name }: { name: string }) {
  return (
    <Badge variant="outline" className="text-xs">
      On-call: {name}
    </Badge>
  );
}
