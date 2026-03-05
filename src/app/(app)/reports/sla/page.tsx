"use client";

import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/convex-api";

export default function SlaPage() {
  const sla = useQuery(api.analytics.getSlaStatus, {});

  const healthPct = sla && sla.total > 0 ? Math.round((sla.healthy / sla.total) * 100) : 100;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">SLA Health</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle className="text-sm">Healthy</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{sla?.healthy ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">At Risk</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{sla?.atRisk ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Breached</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{sla?.breached ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Overall Compliance</CardTitle></CardHeader>
        <CardContent>
          <Progress value={healthPct} className="h-4" />
          <p className="mt-2 text-sm text-muted-foreground">{healthPct}% of SLAs are healthy</p>
        </CardContent>
      </Card>
    </div>
  );
}
