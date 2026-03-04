"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { relativeTime } from "@/lib/date";
import { api } from "@/lib/convex-api";

export default function ActivityPage() {
  const [eventType, setEventType] = useState("");
  const events = useQuery(api.activity.list, {
    eventType: eventType || undefined,
    limit: 300,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Global Activity Feed</CardTitle>
          <p className="text-sm text-slate-600">Track all major issue changes and spot what was added or reprioritized.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="Filter by event type (e.g. issue_created, status_changed)"
            value={eventType}
            onChange={(event) => setEventType(event.target.value)}
          />
          <div className="space-y-2">
            {events?.map((event: any) => (
              <div key={event._id} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{event.eventType}</Badge>
                    <span className="text-xs text-slate-500">{relativeTime(event.createdAt)}</span>
                  </div>
                  <ButtonLink href={`/issues/${event.issueId}`}>Open issue</ButtonLink>
                </div>
                {event.after ? (
                  <p className="mt-2 text-xs text-slate-500">After: {JSON.stringify(event.after)}</p>
                ) : null}
              </div>
            ))}
            {events && events.length === 0 ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}
