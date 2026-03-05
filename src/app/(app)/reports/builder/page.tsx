"use client";

import { useState } from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const metrics = [
  { value: "velocity", label: "Velocity", href: "/reports/velocity" },
  { value: "cycle-time", label: "Cycle Time", href: "/reports/cycle-time" },
  { value: "burndown", label: "Burndown", href: "/reports/burndown" },
  { value: "sla", label: "SLA Health", href: "/reports/sla" },
  { value: "shipped", label: "Shipped", href: "/reports/shipped" },
];

export default function ReportBuilderPage() {
  const [metric, setMetric] = useState("velocity");
  const selected = metrics.find((m) => m.value === metric);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Report Builder</h1>
      <Card>
        <CardHeader><CardTitle>Select a Metric</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-1.5">
            <Label>Metric</Label>
            <Select value={metric} onValueChange={setMetric}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {metrics.map((m) => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selected ? (
            <p className="text-sm">
              View the <Link href={selected.href} className="text-primary underline">{selected.label}</Link> report for detailed analysis.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
