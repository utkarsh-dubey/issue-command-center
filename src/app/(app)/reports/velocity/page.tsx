"use client";

import { useQuery } from "convex/react";
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/convex-api";

export default function VelocityPage() {
  const data = useQuery(api.analytics.getVelocity, { weeks: 12 });

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Velocity</h1>
      <Card>
        <CardHeader>
          <CardTitle>Issues Closed Per Week</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Bar yAxisId="left" dataKey="issuesClosed" fill="oklch(0.7 0.08 220)" name="Issues Closed" />
                <Line yAxisId="right" dataKey="avgCycleTimeHours" stroke="oklch(0.55 0.21 26)" name="Avg Cycle Time (h)" />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {data ? "No data yet. Complete some issues to see velocity." : "Loading..."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
