"use client";

import { cn } from "@/lib/utils";

const BAND_COLORS: Record<string, string> = {
  p0: "bg-red-500",
  p1: "bg-orange-500",
  p2: "bg-yellow-500",
  p3: "bg-slate-400",
};

export function WorkloadBar({
  byPriority,
  total,
}: {
  byPriority: { p0: number; p1: number; p2: number; p3: number };
  total: number;
}) {
  if (total === 0) {
    return <div className="h-4 w-full rounded bg-muted" />;
  }

  return (
    <div className="flex h-4 w-full overflow-hidden rounded">
      {(["p0", "p1", "p2", "p3"] as const).map((band) => {
        const count = byPriority[band];
        if (count === 0) return null;
        const pct = (count / total) * 100;
        return (
          <div
            key={band}
            className={cn("h-full", BAND_COLORS[band])}
            style={{ width: `${pct}%` }}
            title={`${band.toUpperCase()}: ${count}`}
          />
        );
      })}
    </div>
  );
}
