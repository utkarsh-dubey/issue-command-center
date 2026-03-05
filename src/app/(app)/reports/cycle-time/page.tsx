"use client";

import { useQuery } from "convex/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/convex-api";

export default function CycleTimePage() {
  const data = useQuery(api.analytics.getCycleTime, {});

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Cycle Time</h1>
      <Card>
        <CardHeader>
          <CardTitle>Average Time Per Stage (hours)</CardTitle>
        </CardHeader>
        <CardContent>
          {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgHours" fill="oklch(0.7 0.08 220)" name="Avg Hours" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-muted-foreground">
              {data ? "No transition data yet." : "Loading..."}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
