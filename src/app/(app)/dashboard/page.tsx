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
    return <div className="text-sm text-slate-500">Loading dashboard...</div>;
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
      <Card className="border-cyan-100 bg-[linear-gradient(135deg,#ecfbff_0%,#ffffff_70%)]">
        <CardHeader>
          <CardTitle>Stakeholder Dashboard</CardTitle>
          <p className="text-sm text-slate-600">
            Read-only snapshot of pipeline health, top priorities, and recent decisions for CEO and marketing.
          </p>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs uppercase tracking-[0.08em] text-slate-500">{metric.label}</p>
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
                      <Badge className="bg-slate-900 text-white">{getBandLabel(issue.priorityBand)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getStatusLabel(issue.status)}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {summary.topIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-slate-500">
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
              <div key={event._id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium">{event.eventType.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{relativeTime(event.createdAt)}</p>
              </div>
            ))}
            {summary.recentEvents.length === 0 ? (
              <p className="text-sm text-slate-500">No recent status or priority changes.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
