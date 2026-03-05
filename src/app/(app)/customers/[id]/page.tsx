"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/convex-api";
import { getBandLabel, getStatusLabel } from "@/lib/domain";
import { relativeTime } from "@/lib/date";

const TIER_LABELS: Record<string, string> = {
  enterprise: "Enterprise",
  mid_market: "Mid-Market",
  smb: "SMB",
  free: "Free",
};

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const data = useQuery(api.customers.getById, { customerId: params.id as any });

  if (!data) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;

  const { customer, issues, statusCounts } = data;
  const healthColor =
    (customer.healthScore ?? 100) >= 70 ? "text-green-600" : (customer.healthScore ?? 100) >= 40 ? "text-yellow-600" : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/customers"><ArrowLeft className="mr-1 h-4 w-4" />Customers</Link>
        </Button>
        <div className="flex items-center gap-2">
          {customer.tier ? <Badge variant="secondary">{TIER_LABELS[customer.tier] ?? customer.tier}</Badge> : null}
          <span className={`text-lg font-bold ${healthColor}`}>{customer.healthScore ?? "-"}</span>
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold">{customer.name}</h1>
        {customer.domain ? <p className="text-sm text-muted-foreground">{customer.domain}</p> : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {(["inbox", "triage", "planned", "doing", "done"] as const).map((status) => (
          <Card key={status}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{statusCounts[status] ?? 0}</p>
              <p className="text-xs text-muted-foreground">{getStatusLabel(status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="issues">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue: any) => (
                    <TableRow key={issue._id}>
                      <TableCell>
                        <Link href={`/issues/${issue._id}`} className="font-medium hover:underline">{issue.title}</Link>
                      </TableCell>
                      <TableCell><Badge variant="secondary">{getBandLabel(issue.priorityBand)}</Badge></TableCell>
                      <TableCell><Badge variant="outline">{getStatusLabel(issue.status)}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{relativeTime(issue.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                  {issues.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground">No issues</TableCell></TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="notes">
          <Card>
            <CardContent className="pt-4">
              <p className="text-sm">{customer.notes || "No notes yet."}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
