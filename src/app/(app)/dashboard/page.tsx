"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { relativeTime } from "@/lib/date";
import { api } from "@/lib/convex-api";
import { getBandLabel, getStatusLabel } from "@/lib/domain";

export default function DashboardPage() {
  const summary = useQuery(api.dashboard.getSummary, { window: "weekly" });

  if (!summary) {
    return <div className="text-sm text-muted-foreground">Loading dashboard...</div>;
  }

  const metrics = [
    { label: "Active", value: summary.totals.active },
    { label: "Inbox", value: summary.counts.inbox },
    { label: "Triage", value: summary.counts.triage },
    { label: "Planned", value: summary.counts.planned },
    { label: "Doing", value: summary.counts.doing },
    { label: "Done", value: summary.counts.done },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-[linear-gradient(135deg,oklch(0.95_0.03_220)_0%,oklch(0.99_0.006_255)_70%)] dark:border-primary/20 dark:bg-[linear-gradient(135deg,oklch(0.2_0.03_220)_0%,oklch(0.19_0.01_250)_70%)]">
        <CardHeader>
          <CardTitle>Stakeholder Dashboard</CardTitle>
          <p className="text-sm text-muted-foreground">
            Read-only snapshot of pipeline health, top priorities, and recent decisions for CEO and marketing.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-border bg-card/80 p-3 backdrop-blur-sm">
              <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold">{metric.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

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
                {summary.topIssues.map((issue: any) => (
                  <TableRow key={issue._id}>
                    <TableCell>
                      <Link href={`/issues/${issue._id}`} className="font-medium hover:underline">
                        {issue.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getBandLabel(issue.priorityBand)}</Badge>
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
            {summary.recentEvents.map((event: any) => (
              <div key={event._id} className="rounded-lg border border-border bg-card p-3 transition-colors hover:bg-muted/50">
                <p className="text-sm font-medium capitalize">{event.eventType.replaceAll("_", " ")}</p>
                <p className="text-xs text-muted-foreground">{relativeTime(event.createdAt)}</p>
              </div>
            ))}
            {summary.recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent status or priority changes.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
