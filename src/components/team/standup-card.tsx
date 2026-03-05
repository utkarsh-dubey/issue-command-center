"use client";

import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface StandupData {
  userId: string;
  name: string;
  yesterday: Array<{ _id: string; title: string }>;
  today: Array<{ _id: string; title: string }>;
  blockers: Array<{ _id: string; title: string }>;
}

export function StandupCard({ data }: { data: StandupData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">{data.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium text-muted-foreground">Yesterday</p>
          {data.yesterday.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing completed</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {data.yesterday.map((issue: any) => (
                <li key={issue._id}>
                  <Link href={`/issues/${issue._id}`} className="hover:underline">
                    {issue.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <p className="font-medium text-muted-foreground">Today</p>
          {data.today.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nothing in progress</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {data.today.map((issue: any) => (
                <li key={issue._id}>
                  <Link href={`/issues/${issue._id}`} className="hover:underline">
                    {issue.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {data.blockers.length > 0 ? (
          <div>
            <p className="font-medium text-destructive">Blockers</p>
            <ul className="mt-1 space-y-1">
              {data.blockers.map((issue: any) => (
                <li key={issue._id} className="flex items-center gap-1">
                  <Badge variant="destructive" className="text-xs">Blocked</Badge>
                  <Link href={`/issues/${issue._id}`} className="hover:underline">
                    {issue.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
