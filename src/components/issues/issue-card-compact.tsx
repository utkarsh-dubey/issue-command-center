"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";

const BAND_DOT: Record<string, string> = {
  p0: "bg-red-500",
  p1: "bg-orange-500",
  p2: "bg-yellow-500",
  p3: "bg-slate-400",
};

export function IssueCardCompact({
  issue,
  className,
}: {
  issue: {
    _id: string;
    title: string;
    priorityBand: string;
    assigneeId?: string;
    dueDate?: string;
  };
  className?: string;
}) {
  return (
    <Link
      href={`/issues/${issue._id}`}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border bg-card p-2 text-sm transition hover:bg-muted",
        className,
      )}
    >
      <span className={cn("h-2 w-2 shrink-0 rounded-full", BAND_DOT[issue.priorityBand] ?? BAND_DOT.p3)} />
      <span className="min-w-0 flex-1 truncate">{issue.title}</span>
    </Link>
  );
}
