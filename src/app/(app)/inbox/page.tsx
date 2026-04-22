"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGridColumnOptionsMenu } from "@/components/data-grid/column-options-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { InboxDataGrid, type InboxGridRow } from "@/components/issues/inbox-data-grid";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

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
      toast.error(getErrorMessage(err, "Unable to create issue."));
    }
  };

  const onMoveToTriage = async (issueId: string) => {
    try {
      await moveStatus({ issueId: issueId as never, toStatus: "triage" });
      toast.success("Issue moved to triage");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update status."));
    }
  };

  const gridRows = useMemo<InboxGridRow[]>(() => {
    if (!inbox) return [];
    return inbox.map((issue: {
      _id: string;
      title: string;
      description?: string;
      source: string;
      urgency: string;
      updatedAt: number;
      submitterName?: string;
      submitterEmail?: string;
      submitterCompany?: string;
    }) => ({
      id: issue._id,
      issueId: issue._id,
      title: issue.title,
      description: issue.description ?? null,
      source: issue.source,
      urgency: issue.urgency,
      updatedAt: issue.updatedAt,
      submitterName: issue.submitterName ?? null,
      submitterEmail: issue.submitterEmail ?? null,
      submitterCompany: issue.submitterCompany ?? null,
    }));
  }, [inbox]);

  const canPromote = me?.role === "admin" || me?.role === "member";

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <section className="grid shrink-0 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-xl">Triage Inbox</CardTitle>
            <p className="text-sm text-muted-foreground">
              Every new item lands here first. Nothing enters planning without triage and explicit priority logic.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Input
                placeholder="Search inbox..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="bg-background"
              />
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
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

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="shrink-0 border-b">
          <CardTitle>Inbox Issues</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {gridRows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm font-medium text-foreground">Inbox is empty</p>
              <p className="text-xs text-muted-foreground">
                New items will appear here as soon as they&rsquo;re submitted.
              </p>
            </div>
          ) : (
            <InboxDataGrid
              rows={gridRows}
              canPromote={canPromote}
              onPromoteToTriage={onMoveToTriage}
              fillAvailableHeight
              stickySummaryFooter
              tableContainerClassName="h-full overflow-auto"
              renderToolbar={(toolbarProps) => (
                <div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    {toolbarProps.visibleRowCount} rows
                    {toolbarProps.selectedRowCount > 0 ? (
                      <>
                        {" "}
                        · <span className="font-medium text-foreground">{toolbarProps.selectedRowCount}</span>{" "}
                        selected
                        <Button
                          variant="ghost"
                          size="xs"
                          className="ml-2 h-7"
                          onClick={toolbarProps.clearSelection}
                        >
                          Clear
                        </Button>
                      </>
                    ) : null}
                  </div>
                  <DataGridColumnOptionsMenu {...toolbarProps} />
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
