"use client";

import { useQuery } from "convex/react";

import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/convex-api";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function WorkloadPage() {
  const teams = useQuery(api.teams.list, {});
  const [teamId, setTeamId] = useState("");

  const workload = useQuery(
    api.teams.getWorkload,
    teamId ? { teamId: teamId as any } : "skip",
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Workload</h1>

      <Select value={teamId} onValueChange={setTeamId}>
        <SelectTrigger className="w-[250px]"><SelectValue placeholder="Select team" /></SelectTrigger>
        <SelectContent>
          {(teams ?? []).map((t: any) => (
            <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {workload ? (
        <div className="space-y-3">
          {workload.map((member: any) => {
            const capacity = member.totalIssues <= 5 ? "green" : member.totalIssues <= 10 ? "yellow" : "red";
            return (
              <Card key={member.userId}>
                <CardContent className="flex items-center gap-4 pt-4">
                  <div className="w-32 text-sm font-medium">{member.name}</div>
                  <div className="flex flex-1 gap-1">
                    {member.byPriority.p0 > 0 ? <div className="h-6 rounded bg-red-500" style={{ width: `${member.byPriority.p0 * 20}px` }} /> : null}
                    {member.byPriority.p1 > 0 ? <div className="h-6 rounded bg-orange-500" style={{ width: `${member.byPriority.p1 * 20}px` }} /> : null}
                    {member.byPriority.p2 > 0 ? <div className="h-6 rounded bg-yellow-500" style={{ width: `${member.byPriority.p2 * 20}px` }} /> : null}
                    {member.byPriority.p3 > 0 ? <div className="h-6 rounded bg-slate-400" style={{ width: `${member.byPriority.p3 * 20}px` }} /> : null}
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    capacity === "green" && "text-green-600",
                    capacity === "yellow" && "text-yellow-600",
                    capacity === "red" && "text-red-600",
                  )}>
                    {member.totalIssues} issues
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : teamId ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <p className="text-sm text-muted-foreground">Select a team to view workload</p>
      )}
    </div>
  );
}
