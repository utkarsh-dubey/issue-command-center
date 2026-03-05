"use client";

import Link from "next/link";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/convex-api";
import { cn } from "@/lib/utils";

export default function CustomerHealthPage() {
  const customers = useQuery(api.customers.listWithIssueCounts, {});

  const sorted = [...(customers ?? [])].sort(
    (a, b) => (a.healthScore ?? 100) - (b.healthScore ?? 100),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Customer Health</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((customer: any) => {
          const score = customer.healthScore ?? 100;
          const color = score >= 70 ? "text-green-600" : score >= 40 ? "text-yellow-600" : "text-red-600";
          return (
            <Link key={customer._id} href={`/customers/${customer._id}`}>
              <Card className="transition hover:shadow-md">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{customer.name}</CardTitle>
                    <span className={cn("text-lg font-bold", color)}>{score}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={score} className="h-2" />
                  <p className="mt-2 text-xs text-muted-foreground">{customer.issueCount} issues</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
