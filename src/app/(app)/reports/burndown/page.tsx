"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { subDays, format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/convex-api";

export default function BurndownPage() {
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const data = useQuery(api.analytics.getBurndown, { startDate, endDate });

  const chartData = (data ?? []).map((d: any) => ({
    date: d.date,
    active: d.totalActive,
    done: d.totalDone,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Burndown</h1>
      <div className="flex gap-3">
        <div className="grid gap-1.5">
          <Label>Start</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>
        <div className="grid gap-1.5">
          <Label>End</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle>Issue Burndown</CardTitle></CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="active" stackId="1" stroke="oklch(0.7 0.08 220)" fill="oklch(0.7 0.08 220 / 0.3)" name="Active" />
                <Area type="monotone" dataKey="done" stackId="1" stroke="oklch(0.6 0.15 150)" fill="oklch(0.6 0.15 150 / 0.3)" name="Done" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">No snapshot data yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
