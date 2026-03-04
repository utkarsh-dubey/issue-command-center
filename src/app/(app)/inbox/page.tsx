"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ArrowRight, PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { relativeTime } from "@/lib/date";
import { api } from "@/lib/convex-api";
import { getStatusLabel, getUrgencyLabel } from "@/lib/domain";

export default function InboxPage() {
  const me = useQuery(api.users.me, {});
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const createIssue = useMutation(api.issues.create);
  const moveStatus = useMutation(api.issues.updateStatus);

  const inbox = useQuery(api.issues.listInbox, {
    search: search || undefined,
  });

  const onCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    try {
      const issueId = await createIssue({ title, description });
      setTitle("");
      setDescription("");
      toast.success("Issue added to inbox");
      if (typeof issueId === "string") {
        window.location.href = `/issues/${issueId}`;
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to create issue");
    }
  };

  const onMoveToTriage = async (issueId: string) => {
    try {
      await moveStatus({ issueId, toStatus: "triage" });
      toast.success("Issue moved to triage");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update status");
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-cyan-100 bg-[linear-gradient(135deg,#effbff_0%,#ffffff_64%)]">
          <CardHeader>
            <CardTitle className="text-xl">Triage Inbox</CardTitle>
            <p className="text-sm text-slate-600">
              Every new item lands here first. Nothing enters planning without triage and explicit priority logic.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Input
                placeholder="Search inbox..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="bg-white"
              />
              <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                <span>Current items:</span>
                <Badge variant="secondary">{inbox?.length ?? 0}</Badge>
                <span>Role:</span>
                <Badge variant="secondary">{me?.role ?? "..."}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <PlusCircle className="h-4 w-4" />
              Add New Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Issue title" value={title} onChange={(event) => setTitle(event.target.value)} />
            <Textarea
              placeholder="Short customer context or impact"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
            <Button onClick={onCreate} className="w-full">
              Create in Inbox
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Inbox Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inbox?.map((issue: any) => (
                <TableRow key={issue._id}>
                  <TableCell>
                    <div className="font-medium">{issue.title}</div>
                    {issue.description ? <p className="mt-1 line-clamp-2 text-xs text-slate-500">{issue.description}</p> : null}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{getStatusLabel(issue.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getUrgencyLabel(issue.urgency)}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-500">{relativeTime(issue.updatedAt)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/issues/${issue._id}`}>Open</Link>
                      </Button>
                      {me?.role === "admin" ? (
                        <Button size="sm" onClick={() => onMoveToTriage(issue._id)}>
                          To Triage
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {inbox && inbox.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-slate-500">
                    Inbox is empty.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
