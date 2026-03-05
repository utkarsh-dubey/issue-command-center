"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import {
  addWeeks,
  eachWeekOfInterval,
  format,
  isBefore,
  startOfWeek,
} from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/convex-api";
import { cn } from "@/lib/utils";

export default function RoadmapPage() {
  const data = useQuery(api.milestones.getTimeline, {});

  const { weeks, milestoneRows } = useMemo(() => {
    if (!data) return { weeks: [], milestoneRows: [] };

    const today = new Date();
    const start = startOfWeek(addWeeks(today, -2));
    const end = addWeeks(today, 16);
    const wks = eachWeekOfInterval({ start, end });

    const rows = data.milestones.map((m: any) => {
      const issues = data.issues.filter((i: any) => i.milestoneId === m._id);
      const done = issues.filter((i: any) => i.status === "done").length;
      const progress = issues.length > 0 ? Math.round((done / issues.length) * 100) : 0;
      return { milestone: m, issues, progress, done, total: issues.length };
    });

    return { weeks: wks, milestoneRows: rows };
  }, [data]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Roadmap</h1>
        <Link href="/roadmap/milestones">
          <Badge variant="outline">Manage Milestones</Badge>
        </Link>
      </div>

      <Card>
        <CardContent className="overflow-x-auto p-4">
          <div className="min-w-[800px]">
            {/* Week headers */}
            <div className="mb-2 grid gap-px" style={{ gridTemplateColumns: `200px repeat(${weeks.length}, 1fr)` }}>
              <div className="text-xs font-semibold text-muted-foreground">Milestones</div>
              {weeks.map((w) => (
                <div key={w.toISOString()} className="text-center text-xs text-muted-foreground">
                  {format(w, "MMM d")}
                </div>
              ))}
            </div>

            {/* Today marker */}
            {milestoneRows.map((row: any) => (
              <div
                key={row.milestone._id}
                className="grid items-center gap-px border-t border-border py-2"
                style={{ gridTemplateColumns: `200px repeat(${weeks.length}, 1fr)` }}
              >
                <div className="pr-2">
                  <p className="text-sm font-medium truncate">{row.milestone.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.done}/{row.total} done
                  </p>
                  <Progress value={row.progress} className="mt-1 h-1.5" />
                </div>
                {weeks.map((w, wi) => {
                  const weekEnd = addWeeks(w, 1);
                  const hasTarget =
                    row.milestone.targetDate &&
                    !isBefore(new Date(row.milestone.targetDate), w) &&
                    isBefore(new Date(row.milestone.targetDate), weekEnd);

                  return (
                    <div
                      key={wi}
                      className={cn(
                        "h-8 border-r border-border",
                        hasTarget && "bg-primary/20 rounded",
                      )}
                    />
                  );
                })}
              </div>
            ))}

            {milestoneRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No milestones yet. <Link href="/roadmap/milestones" className="underline">Create one</Link>
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
