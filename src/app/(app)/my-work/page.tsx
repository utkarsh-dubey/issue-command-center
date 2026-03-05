"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/convex-api";
import { getBandLabel } from "@/lib/domain";
import { relativeTime } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";

export default function MyWorkPage() {
  const issues = useQuery(api.issues.listMyWork, {});
  const updateStatus = useMutation(api.issues.updateStatus);
  const [mountTime] = useState(() => Date.now());

  const sections = useMemo(() => {
    if (!issues) return { doing: [], planned: [], recentDone: [] };
    const weekAgo = mountTime - 7 * 24 * 60 * 60 * 1000;
    return {
      doing: issues.filter((i: any) => i.status === "doing"),
      planned: issues.filter((i: any) => i.status === "planned"),
      recentDone: issues.filter((i: any) => i.status === "done" && i.updatedAt >= weekAgo),
    };
  }, [issues, mountTime]);

  const onStartWorking = async (issueId: string) => {
    try {
      await updateStatus({ issueId, toStatus: "doing" });
      toast.success("Started working");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update status."));
    }
  };

  const onMarkDone = async (issueId: string) => {
    try {
      await updateStatus({ issueId, toStatus: "done" });
      toast.success("Marked done");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update status."));
    }
  };

  const renderIssueRow = (issue: any, actions?: React.ReactNode) => (
    <div key={issue._id} className="flex items-center justify-between rounded-lg border border-border p-3">
      <div className="min-w-0 flex-1">
        <Link href={`/issues/${issue._id}`} className="font-medium hover:underline">
          {issue.title}
        </Link>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">{getBandLabel(issue.priorityBand)}</Badge>
          <span className="text-xs text-muted-foreground">{relativeTime(issue.updatedAt)}</span>
        </div>
      </div>
      {actions ? <div className="ml-3 flex items-center gap-2">{actions}</div> : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">My Work</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            In Progress
            <Badge variant="secondary">{sections.doing.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.doing.map((issue: any) =>
            renderIssueRow(
              issue,
              <Button size="sm" onClick={() => onMarkDone(issue._id)}>
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Done
              </Button>,
            ),
          )}
          {sections.doing.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing in progress</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Up Next
            <Badge variant="secondary">{sections.planned.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.planned.map((issue: any) =>
            renderIssueRow(
              issue,
              <Button size="sm" variant="outline" onClick={() => onStartWorking(issue._id)}>
                <ArrowRight className="mr-1 h-3.5 w-3.5" />
                Start
              </Button>,
            ),
          )}
          {sections.planned.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing planned</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Recently Done
            <Badge variant="secondary">{sections.recentDone.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {sections.recentDone.map((issue: any) => renderIssueRow(issue))}
          {sections.recentDone.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing completed recently</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
