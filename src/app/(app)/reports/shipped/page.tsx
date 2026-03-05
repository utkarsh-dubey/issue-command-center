"use client";

import { useQuery } from "convex/react";
import { Copy } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/convex-api";
import { getBandLabel } from "@/lib/domain";

export default function ShippedPage() {
  const issues = useQuery(api.analytics.getShippedThisWeek, {});

  const copyAsMarkdown = () => {
    if (!issues) return;
    const lines = issues.map((i: any) => `- ${i.title} (${getBandLabel(i.priorityBand)})`);
    const md = `## Shipped This Week\n\n${lines.join("\n")}`;
    navigator.clipboard.writeText(md);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Shipped This Week</h1>
        <Button variant="outline" size="sm" onClick={copyAsMarkdown}>
          <Copy className="mr-1 h-4 w-4" />
          Copy as Markdown
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Completed Issues
            <Badge variant="secondary">{issues?.length ?? 0}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(issues ?? []).map((issue: any) => (
            <div key={issue._id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{issue.title}</p>
              <Badge variant="secondary">{getBandLabel(issue.priorityBand)}</Badge>
            </div>
          ))}
          {issues && issues.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing shipped this week yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
