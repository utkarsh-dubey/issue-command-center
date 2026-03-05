"use client";

import Link from "next/link";
import { BarChart3, Clock, Flame, LineChart, Package, Wrench } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const reports = [
  { href: "/reports/velocity", title: "Velocity", description: "Issues closed per week", icon: BarChart3 },
  { href: "/reports/cycle-time", title: "Cycle Time", description: "Average time per stage", icon: Clock },
  { href: "/reports/burndown", title: "Burndown", description: "Issue burndown/burnup chart", icon: LineChart },
  { href: "/reports/sla", title: "SLA Health", description: "SLA compliance dashboard", icon: Flame },
  { href: "/reports/shipped", title: "Shipped This Week", description: "Issues completed recently", icon: Package },
  { href: "/reports/builder", title: "Report Builder", description: "Custom metrics explorer", icon: Wrench },
];

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Reports</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reports.map((report) => (
          <Link key={report.href} href={report.href}>
            <Card className="transition hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <report.icon className="h-5 w-5" />
                  {report.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{report.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
