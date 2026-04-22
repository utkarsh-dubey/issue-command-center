"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import {
  IconActivity,
  IconCheck,
  IconCircleDashed,
  IconInbox,
  IconPlayerPlay,
  IconPlaylistAdd,
  IconRoute,
} from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stats/stat-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { relativeTime } from "@/lib/date";
import { api } from "@/lib/convex-api";
import { getBandLabel, getStatusLabel } from "@/lib/domain";
import { cn } from "@/lib/utils";

const BAND_TONE: Record<string, string> = {
  p0: "bg-destructive/10 text-destructive border-destructive/20",
  p1: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400",
  p2: "bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400",
  p3: "bg-muted text-muted-foreground border-transparent",
};

export default function DashboardPage() {
  const summary = useQuery(api.dashboard.getSummary, { window: "weekly" });

  if (!summary) {
    return (
      <div className="text-sm text-muted-foreground">Loading dashboard...</div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Stakeholder Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Read-only snapshot of pipeline health, top priorities, and recent decisions for leadership visibility.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard
            label="Active"
            icon={<IconActivity className="size-3.5" />}
            value={summary.totals.active}
            footer={
              <p className="text-xs text-muted-foreground">
                Across triage, planned, and doing
              </p>
            }
          />
          <StatCard
            label="Inbox"
            icon={<IconInbox className="size-3.5" />}
            value={summary.counts.inbox}
            footer={
              <p className="text-xs text-muted-foreground">
                Needs initial triage
              </p>
            }
          />
          <StatCard
            label="Triage"
            icon={<IconRoute className="size-3.5" />}
            value={summary.counts.triage}
            footer={
              <p className="text-xs text-muted-foreground">
                In prioritization
              </p>
            }
          />
          <StatCard
            label="Planned"
            icon={<IconPlaylistAdd className="size-3.5" />}
            value={summary.counts.planned}
            footer={
              <p className="text-xs text-muted-foreground">
                Queued for work
              </p>
            }
          />
          <StatCard
            label="Doing"
            icon={<IconPlayerPlay className="size-3.5" />}
            value={summary.counts.doing}
            footer={
              <p className="text-xs text-muted-foreground">
                Actively being worked
              </p>
            }
          />
          <StatCard
            label="Done"
            icon={<IconCheck className="size-3.5" />}
            value={summary.counts.done}
            footer={
              <p className="text-xs text-muted-foreground">
                Shipped this cycle
              </p>
            }
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Priorities</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Issue</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.topIssues.map((issue: { _id: string; title: string; priorityBand: string; status: string }) => (
                  <TableRow key={issue._id}>
                    <TableCell>
                      <Link href={`/issues/${issue._id}`} className="font-medium hover:underline">
                        {issue.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(BAND_TONE[issue.priorityBand?.toLowerCase()] ?? "")}
                      >
                        {getBandLabel(issue.priorityBand)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getStatusLabel(issue.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {summary.topIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                      No active priority items.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Pipeline Changes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.recentEvents.map(
              (event: { _id: string; eventType: string; createdAt: number }) => (
                <div
                  key={event._id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:bg-muted/50"
                >
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <IconCircleDashed className="size-3.5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium capitalize">
                      {event.eventType.replaceAll("_", " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {relativeTime(event.createdAt)}
                    </p>
                  </div>
                </div>
              )
            )}
            {summary.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent status or priority changes.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
