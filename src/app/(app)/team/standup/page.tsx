"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/convex-api";

export default function StandupPage() {
  const teams = useQuery(api.teams.list, {});
  const [teamId, setTeamId] = useState("all");

  const standup = useQuery(
    api.teams.getStandupView,
    teamId !== "all" ? { teamId: teamId as any } : {},
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Standup</h1>
        <Select value={teamId} onValueChange={setTeamId}>
          <SelectTrigger className="w-[250px]"><SelectValue placeholder="All team members" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {(teams ?? []).map((t: any) => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {(standup ?? []).map((member: any) => (
        <Card key={member.userId}>
          <CardHeader><CardTitle className="text-base">{member.name}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Yesterday (Done)</p>
              {member.yesterday.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {member.yesterday.map((issue: any) => (
                    <li key={issue._id} className="text-sm">
                      <Link href={`/issues/${issue._id}`} className="hover:underline">{issue.title}</Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-sm text-muted-foreground">Nothing</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Today (Doing)</p>
              {member.today.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {member.today.map((issue: any) => (
                    <li key={issue._id} className="text-sm">
                      <Link href={`/issues/${issue._id}`} className="hover:underline">{issue.title}</Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-sm text-muted-foreground">Nothing</p>}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Blockers</p>
              {member.blockers.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {member.blockers.map((issue: any) => (
                    <li key={issue._id} className="text-sm text-destructive">
                      <Link href={`/issues/${issue._id}`} className="hover:underline">{issue.title}</Link>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-1 text-sm text-muted-foreground">None</p>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
