"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
} from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ViewSwitcher } from "@/components/app/view-switcher";
import { IssueCardCompact } from "@/components/issues/issue-card-compact";
import { api } from "@/lib/convex-api";
import { cn } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const startDate = format(calStart, "yyyy-MM-dd");
  const endDate = format(calEnd, "yyyy-MM-dd");

  const issues = useQuery(api.issues.listCalendar, { startDate, endDate });

  const issuesByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const issue of issues ?? []) {
      if (!issue.dueDate) continue;
      const list = map.get(issue.dueDate) ?? [];
      list.push(issue);
      map.set(issue.dueDate, list);
    }
    return map;
  }, [issues]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Calendar</h1>
        <ViewSwitcher current="calendar" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px">
            {DAYS.map((day) => (
              <div key={day} className="p-2 text-center text-xs font-semibold text-muted-foreground">
                {day}
              </div>
            ))}
            {days.map((day) => {
              const dateStr = format(day, "yyyy-MM-dd");
              const dayIssues = issuesByDate.get(dateStr) ?? [];
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);
              const todayStr = format(new Date(), "yyyy-MM-dd");
              const hasOverdue = dayIssues.some(
                (i: any) => i.dueDate && i.dueDate < todayStr && i.status !== "done",
              );

              return (
                <div
                  key={dateStr}
                  className={cn(
                    "min-h-[100px] rounded-lg border p-1.5",
                    inMonth ? "border-border bg-card" : "border-transparent bg-muted/30",
                    today && "ring-2 ring-primary",
                    hasOverdue && "border-destructive",
                  )}
                >
                  <p className={cn("text-xs", inMonth ? "text-foreground" : "text-muted-foreground")}>
                    {format(day, "d")}
                  </p>
                  <div className="mt-1 space-y-1">
                    {dayIssues.slice(0, 3).map((issue: any) => (
                      <IssueCardCompact key={issue._id} issue={issue} className="text-xs" />
                    ))}
                    {dayIssues.length > 3 ? (
                      <p className="text-xs text-muted-foreground">+{dayIssues.length - 3} more</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
