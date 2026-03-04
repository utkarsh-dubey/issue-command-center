"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { relativeTime } from "@/lib/date";
import { api } from "@/lib/convex-api";
import { BAND_LABELS, PRIORITY_BANDS, getBandLabel, getStatusLabel } from "@/lib/domain";

export default function PipelinePage() {
  const users = useQuery(api.users.listAssignable, {});
  const [status, setStatus] = useState<string>("all");
  const [band, setBand] = useState<string>("all");
  const [search, setSearch] = useState("");

  const pipeline = useQuery(api.issues.listPipeline, {
    status: status === "all" ? undefined : status,
    priorityBand: band === "all" ? undefined : band,
    search: search || undefined,
  });

  const userById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users ?? []) {
      map.set(user._id, user.name);
    }
    return map;
  }, [users]);

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <CardTitle className="text-xl">Priority Pipeline</CardTitle>
          <p className="text-sm text-slate-600">Filter by status and priority band to drive weekly planning discussions.</p>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_180px]">
          <Input placeholder="Search title/description" value={search} onChange={(event) => setSearch(event.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="triage">Triage</SelectItem>
              <SelectItem value="planned">Planned</SelectItem>
              <SelectItem value="doing">Doing</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Select value={band} onValueChange={setBand}>
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {PRIORITY_BANDS.map((priorityBand) => (
                <SelectItem key={priorityBand} value={priorityBand}>
                  {BAND_LABELS[priorityBand]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipeline?.map((issue: any) => (
                <TableRow key={issue._id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" href={`/issues/${issue._id}`}>
                      {issue.title}
                    </Link>
                  </TableCell>
                    <TableCell>
                      <Badge className="bg-slate-900 text-white">{getBandLabel(issue.priorityBand)}</Badge>
                    </TableCell>
                  <TableCell>{issue.finalPriorityScore ?? "-"}</TableCell>
                  <TableCell>
                      <Badge variant="secondary">{getStatusLabel(issue.status)}</Badge>
                    </TableCell>
                  <TableCell>{issue.assigneeId ? userById.get(issue.assigneeId) ?? "Unknown" : "Unassigned"}</TableCell>
                  <TableCell className="text-sm text-slate-500">{relativeTime(issue.updatedAt)}</TableCell>
                </TableRow>
              ))}
              {pipeline && pipeline.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-slate-500">
                    No issues match current filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
