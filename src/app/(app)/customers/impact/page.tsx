"use client";

import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/convex-api";
import { cn } from "@/lib/utils";

export default function ImpactAnalysisPage() {
  const data = useQuery(api.customers.getImpactAnalysis, {});

  if (!data) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;

  const { matrix, customers, themes } = data;
  const activeCustomers = customers.filter((c: any) => c.isActive);
  const activeThemes = themes.filter((t: any) => t.isActive);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Impact Analysis</h1>
      <Card>
        <CardHeader><CardTitle>Customer x Theme Matrix</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium">Customer</th>
                {activeThemes.map((t: any) => (
                  <th key={t._id} className="p-2 text-center font-medium">{t.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeCustomers.map((c: any) => (
                <tr key={c._id} className="border-t border-border">
                  <td className="p-2 font-medium">{c.name}</td>
                  {activeThemes.map((t: any) => {
                    const count = matrix[c._id]?.[t._id] ?? 0;
                    return (
                      <td
                        key={t._id}
                        className={cn(
                          "p-2 text-center",
                          count > 0 && count <= 2 && "bg-yellow-50 dark:bg-yellow-900/20",
                          count > 2 && count <= 5 && "bg-orange-50 dark:bg-orange-900/20",
                          count > 5 && "bg-red-50 dark:bg-red-900/20",
                        )}
                      >
                        {count > 0 ? count : "-"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
