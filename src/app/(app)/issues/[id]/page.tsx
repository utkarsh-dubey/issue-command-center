"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Clock, CopyCheck, Globe, Link2, Lock, Plus, User, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor, type RichTextEditorHandle } from "@/components/editor/rich-text-editor";
import { WatchToggle } from "@/components/issues/watch-toggle";
import { PresenceIndicator } from "@/components/app/presence-indicator";
import { ReactionPicker } from "@/components/comments/reaction-picker";
import { formatDueDate, relativeTime } from "@/lib/date";
import { api } from "@/lib/convex-api";
import {
  BAND_LABELS,
  ISSUE_STATUSES,
  PRIORITY_BANDS,
  STATUS_LABELS,
  URGENCIES,
  URGENCY_LABELS,
  getBandLabel,
  getStatusLabel,
} from "@/lib/domain";
import { getErrorMessage } from "@/lib/errors";
import { computePriority } from "@/lib/priority";

type AutoSaveState = "idle" | "saving" | "saved" | "error";

function getAutoSaveLabel(state: AutoSaveState) {
  if (state === "saving") return "Saving...";
  if (state === "saved") return "Saved";
  if (state === "error") return "Save failed";
  return "";
}

export default function IssueDetailPage() {
  const params = useParams<{ id: string }>();
  const issueId = params.id;

  const me = useQuery(api.users.me, {});
  const users = useQuery(api.users.listAssignable, {});
  const themes = useQuery(api.themes.list, {});
  const customers = useQuery(api.customers.list, {});
  const data = useQuery(api.issues.getById, { issueId });
  const duplicates = useQuery(api.issues.findDuplicateCandidates, { issueId });
  const dependencies = useQuery(api.dependencies.listForIssue, { issueId });
  const milestones = useQuery(api.milestones.list, {});
  const sprints = useQuery(api.sprints.list, {});
  const goals = useQuery(api.goals.list, {});
  const timeEntries = useQuery(api.timeTracking.listForIssue, { issueId });

  const updateBasics = useMutation(api.issues.updateBasics);
  const assign = useMutation(api.issues.assign);
  const setRice = useMutation(api.issues.setRice);
  const updateStatus = useMutation(api.issues.updateStatus);
  const overridePriority = useMutation(api.issues.overridePriority);
  const addComment = useMutation(api.comments.add);
  const mergeDuplicate = useMutation(api.issues.mergeDuplicate);
  const addDependency = useMutation(api.dependencies.create);
  const removeDependency = useMutation(api.dependencies.remove);
  const logTime = useMutation(api.timeTracking.log);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [themeId, setThemeId] = useState<string>("none");
  const [customerId, setCustomerId] = useState<string>("none");
  const [dueDate, setDueDate] = useState("");
  const [stakeholderSummary, setStakeholderSummary] = useState("");
  const [evidenceLinksRaw, setEvidenceLinksRaw] = useState("");

  const [assigneeId, setAssigneeId] = useState<string>("none");
  const [statusValue, setStatusValue] = useState<string>("inbox");

  const [reach, setReach] = useState("");
  const [impact, setImpact] = useState("");
  const [confidence, setConfidence] = useState("");
  const [effort, setEffort] = useState("");
  const [urgency, setUrgency] = useState("none");

  const [overrideBand, setOverrideBand] = useState("p3");
  const [overrideReason, setOverrideReason] = useState("");

  const [commentHtml, setCommentHtml] = useState("");
  const commentEditorRef = useRef<RichTextEditorHandle>(null);
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [hydratedIssueId, setHydratedIssueId] = useState<string | null>(null);
  const [detailsSaveState, setDetailsSaveState] = useState<AutoSaveState>("idle");
  const [scoreSaveState, setScoreSaveState] = useState<AutoSaveState>("idle");
  const lastSavedBasicsRef = useRef("");
  const lastSavedRiceRef = useRef("");

  // Time tracking state
  const [timeMinutes, setTimeMinutes] = useState("");
  const [timeDescription, setTimeDescription] = useState("");

  // Dependency add state
  const [depSearch, setDepSearch] = useState("");
  const [depType, setDepType] = useState<"blocks" | "relates_to">("blocks");
  const depSearchResults = useQuery(
    api.issues.globalSearch,
    depSearch.length >= 2 ? { query: depSearch, limit: 5 } : "skip",
  );

  const issue = data?.issue;

  useEffect(() => {
    if (!issue || hydratedIssueId === issue._id) return;

    setTitle(issue.title ?? "");
    setDescription(issue.description ?? "");
    setThemeId(issue.themeId ?? "none");
    setCustomerId(issue.customerId ?? "none");
    setDueDate(issue.dueDate ?? "");
    setStakeholderSummary(issue.stakeholderSummary ?? "");
    setEvidenceLinksRaw((issue.evidenceLinks ?? []).join("\n"));
    setAssigneeId(issue.assigneeId ?? "none");
    setStatusValue(issue.status);

    setReach(issue.reach ? String(issue.reach) : "");
    setImpact(issue.impact ? String(issue.impact) : "");
    setConfidence(issue.confidence ? String(issue.confidence) : "");
    setEffort(issue.effort ? String(issue.effort) : "");
    setUrgency(issue.urgency ?? "none");

    setOverrideBand(issue.priorityBand ?? "p3");
    setOverrideReason(issue.priorityReason ?? "");

    lastSavedBasicsRef.current = JSON.stringify({
      title: issue.title ?? "",
      description: issue.description ?? "",
      stakeholderSummary: issue.stakeholderSummary ?? "",
      themeId: issue.themeId ?? null,
      customerId: issue.customerId ?? null,
      dueDate: issue.dueDate ?? null,
      evidenceLinks: issue.evidenceLinks ?? [],
    });
    lastSavedRiceRef.current =
      issue.reach && issue.impact && issue.confidence && issue.effort
        ? JSON.stringify({
            reach: issue.reach,
            impact: issue.impact,
            confidence: issue.confidence,
            effort: issue.effort,
            urgency: issue.urgency ?? "none",
          })
        : "";
    setDetailsSaveState("idle");
    setScoreSaveState("idle");
    setHydratedIssueId(issue._id);
  }, [hydratedIssueId, issue]);

  const basicsPayload = useMemo(
    () => ({
      title,
      description,
      stakeholderSummary,
      themeId: themeId === "none" ? null : themeId,
      customerId: customerId === "none" ? null : customerId,
      dueDate: dueDate || null,
      evidenceLinks: evidenceLinksRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
    }),
    [customerId, description, dueDate, evidenceLinksRaw, stakeholderSummary, themeId, title],
  );

  const calculated = useMemo(() => {
    const reachValue = Number(reach);
    const impactValue = Number(impact);
    const confidenceValue = Number(confidence);
    const effortValue = Number(effort);
    if (![reachValue, impactValue, confidenceValue, effortValue].every((value) => value >= 1 && value <= 5)) {
      return null;
    }
    return computePriority(
      reachValue,
      impactValue,
      confidenceValue,
      effortValue,
      urgency as (typeof URGENCIES)[number],
    );
  }, [confidence, effort, impact, reach, urgency]);

  const ricePayload = useMemo(() => {
    const reachValue = Number(reach);
    const impactValue = Number(impact);
    const confidenceValue = Number(confidence);
    const effortValue = Number(effort);
    const isValid = [reachValue, impactValue, confidenceValue, effortValue].every((value) => value >= 1 && value <= 5);

    if (!isValid) {
      return null;
    }

    return {
      reach: reachValue,
      impact: impactValue,
      confidence: confidenceValue,
      effort: effortValue,
      urgency,
    };
  }, [confidence, effort, impact, reach, urgency]);

  useEffect(() => {
    if (!issue || hydratedIssueId !== issue._id) return;

    const serializedPayload = JSON.stringify(basicsPayload);
    if (serializedPayload === lastSavedBasicsRef.current) return;

    setDetailsSaveState("saving");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await updateBasics({
            issueId,
            ...basicsPayload,
          });
          lastSavedBasicsRef.current = serializedPayload;
          setDetailsSaveState("saved");
        } catch (err) {
          setDetailsSaveState("error");
          toast.error(getErrorMessage(err, "Unable to auto-save issue details."));
        }
      })();
    }, 500);

    return () => clearTimeout(timer);
  }, [basicsPayload, hydratedIssueId, issue, issueId, updateBasics]);

  const onAssign = async (value: string) => {
    const previousValue = assigneeId;
    setAssigneeId(value);
    try {
      await assign({ issueId, assigneeId: value === "none" ? null : value });
    } catch (err) {
      setAssigneeId(previousValue);
      toast.error(getErrorMessage(err, "Unable to update assignee."));
    }
  };

  useEffect(() => {
    if (!issue || hydratedIssueId !== issue._id || !ricePayload) return;

    const serializedPayload = JSON.stringify(ricePayload);
    if (serializedPayload === lastSavedRiceRef.current) return;

    setScoreSaveState("saving");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await setRice({
            issueId,
            ...ricePayload,
          });
          lastSavedRiceRef.current = serializedPayload;
          setScoreSaveState("saved");
        } catch (err) {
          setScoreSaveState("error");
          toast.error(getErrorMessage(err, "Unable to auto-save score."));
        }
      })();
    }, 500);

    return () => clearTimeout(timer);
  }, [hydratedIssueId, issue, issueId, ricePayload, setRice]);

  useEffect(() => {
    if (!ricePayload) {
      setScoreSaveState("idle");
    }
  }, [ricePayload]);

  const onStatusChange = async (value: string) => {
    const previousValue = statusValue;
    setStatusValue(value);
    if (value === previousValue) return;
    try {
      await updateStatus({ issueId, toStatus: value });
    } catch (err) {
      setStatusValue(previousValue);
      toast.error(getErrorMessage(err, "Unable to update status."));
    }
  };

  const onOverridePriority = async () => {
    try {
      await overridePriority({ issueId, priorityBand: overrideBand, reason: overrideReason });
      toast.success("Priority overridden");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to override priority."));
    }
  };

  const onComment = useCallback(async () => {
    const isEmpty = commentEditorRef.current?.isEmpty() ?? true;
    if (isEmpty || isCommentSubmitting) return;
    const body = commentEditorRef.current?.getHTML() ?? "";
    try {
      setIsCommentSubmitting(true);
      await addComment({ issueId, body, mentionUserIds: [] });
      commentEditorRef.current?.clearContent();
      setCommentHtml("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to add comment."));
    } finally {
      setIsCommentSubmitting(false);
    }
  }, [addComment, isCommentSubmitting, issueId]);

  const onMergeDuplicate = async (targetIssueId: string) => {
    try {
      await mergeDuplicate({
        sourceIssueId: issueId,
        targetIssueId,
        reason: "duplicate",
      });
      toast.success("Merged as duplicate");
      window.location.href = `/issues/${targetIssueId}`;
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to merge duplicate."));
    }
  };

  const onAddDependency = async (targetIssueId: string) => {
    try {
      await addDependency({
        blockingIssueId: issueId,
        blockedIssueId: targetIssueId,
        dependencyType: depType,
      });
      setDepSearch("");
      toast.success("Dependency added");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to add dependency."));
    }
  };

  const onRemoveDependency = async (depId: string) => {
    try {
      await removeDependency({ dependencyId: depId });
      toast.success("Dependency removed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to remove dependency."));
    }
  };

  const onLogTime = async () => {
    const mins = Number(timeMinutes);
    if (!mins || mins <= 0) return;
    try {
      await logTime({
        issueId,
        durationMinutes: mins,
        description: timeDescription || undefined,
        date: new Date().toISOString().split("T")[0],
      });
      setTimeMinutes("");
      setTimeDescription("");
      toast.success("Time logged");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to log time."));
    }
  };

  const isBlocked = (dependencies?.blockedBy ?? []).length > 0;

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading issue...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href="/pipeline">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to pipeline
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <PresenceIndicator issueId={issueId} />
          <WatchToggle issueId={issueId} />
          {isBlocked ? (
            <Badge variant="destructive">
              <Lock className="mr-1 h-3 w-3" />
              Blocked
            </Badge>
          ) : null}
          <Badge className="bg-foreground text-background">{getBandLabel(issue.priorityBand)}</Badge>
          <Badge variant="secondary">{getStatusLabel(issue.status)}</Badge>
          {issue.customerId ? (
            <Badge variant="outline">{customers?.find((customer: any) => customer._id === issue.customerId)?.name ?? "Customer"}</Badge>
          ) : null}
          {issue.dueDate ? <Badge variant="outline">Due {formatDueDate(issue.dueDate)}</Badge> : null}
        </div>
      </div>

      {/* Source & Submitter Info */}
      {issue.source === "portal" && issue.submitterName ? (
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30">
          <CardContent className="flex items-center gap-4 py-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
              <Globe className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                Submitted via public portal by{" "}
                <span className="font-semibold">{issue.submitterName}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {issue.submitterEmail}
                {issue.submitterCompany ? ` · ${issue.submitterCompany}` : ""}
                {issue.submissionType ? ` · ${issue.submissionType === "feature_request" ? "Feature Request" : "Bug Report"}` : ""}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 border-blue-300 text-blue-700 dark:border-blue-700 dark:text-blue-300">
              Portal
            </Badge>
          </CardContent>
        </Card>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-3.5 w-3.5" />
          <span>
            Created{data.reporterName ? ` by ${data.reporterName}` : ""}
            {" · "}
            {issue.source === "manual" ? "Manual" : issue.source === "template" ? "Template" : issue.source === "automation" ? "Automation" : issue.source}
          </span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Issue Details</CardTitle>
              <p className="text-xs text-muted-foreground">{getAutoSaveLabel(detailsSaveState)}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
            </div>

            <div className="grid gap-2">
              <Label>Stakeholder Summary</Label>
              <Textarea
                value={stakeholderSummary}
                onChange={(event) => setStakeholderSummary(event.target.value)}
                rows={3}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Theme</Label>
                <Select value={themeId} onValueChange={setThemeId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No theme</SelectItem>
                    {(themes ?? []).map((theme: any) => (
                      <SelectItem key={theme._id} value={theme._id}>
                        {theme.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No customer</SelectItem>
                    {(customers ?? []).map((customer: any) => (
                      <SelectItem key={customer._id} value={customer._id}>
                        {customer.name}
                        {customer.isActive ? "" : " (Inactive)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label>Evidence Links (one per line)</Label>
              <Textarea value={evidenceLinksRaw} onChange={(event) => setEvidenceLinksRaw(event.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Triage Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Assignee</Label>
                <Select value={assigneeId} onValueChange={onAssign}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {(users ?? []).map((user: any) => (
                      <SelectItem key={user._id} value={user._id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Status</Label>
                <Select value={statusValue} onValueChange={onStatusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Milestone</Label>
                  <Select
                    value={issue.milestoneId ?? "none"}
                    onValueChange={async (v) => {
                      try {
                        await updateBasics({ issueId, milestoneId: v === "none" ? null : v } as any);
                      } catch (err) {
                        toast.error(getErrorMessage(err, "Unable to set milestone."));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No milestone</SelectItem>
                      {(milestones ?? []).map((m: any) => (
                        <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Sprint</Label>
                  <Select
                    value={issue.sprintId ?? "none"}
                    onValueChange={async (v) => {
                      try {
                        await updateBasics({ issueId, sprintId: v === "none" ? null : v } as any);
                      } catch (err) {
                        toast.error(getErrorMessage(err, "Unable to set sprint."));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No sprint</SelectItem>
                      {(sprints ?? []).map((s: any) => (
                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Goal</Label>
                <Select
                  value={issue.goalId ?? "none"}
                  onValueChange={async (v) => {
                    try {
                      await updateBasics({ issueId, goalId: v === "none" ? null : v } as any);
                    } catch (err) {
                      toast.error(getErrorMessage(err, "Unable to set goal."));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No goal</SelectItem>
                    {(goals ?? []).map((g: any) => (
                      <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>RICE + Urgency</CardTitle>
                <p className="text-xs text-muted-foreground">{getAutoSaveLabel(scoreSaveState)}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Reach (1-5)</Label>
                  <Input value={reach} onChange={(event) => setReach(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Impact (1-5)</Label>
                  <Input value={impact} onChange={(event) => setImpact(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Confidence (1-5)</Label>
                  <Input value={confidence} onChange={(event) => setConfidence(event.target.value)} />
                </div>
                <div className="grid gap-1.5">
                  <Label>Effort (1-5)</Label>
                  <Input value={effort} onChange={(event) => setEffort(event.target.value)} />
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label>Urgency</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {URGENCIES.map((urgencyValue) => (
                      <SelectItem key={urgencyValue} value={urgencyValue}>
                        {URGENCY_LABELS[urgencyValue]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {calculated ? (
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-950 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-200">
                  Preview Score: {calculated.finalPriorityScore} ({BAND_LABELS[calculated.priorityBand]})
                </div>
              ) : (
                <div className="rounded-lg border border-border bg-muted p-3 text-sm text-muted-foreground">
                  Enter valid values from 1-5 to compute preview.
                </div>
              )}
            </CardContent>
          </Card>

          {me?.role === "admin" ? (
            <Card>
              <CardHeader>
                <CardTitle>Admin Priority Override</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={overrideBand} onValueChange={setOverrideBand}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_BANDS.map((bandValue) => (
                      <SelectItem key={bandValue} value={bandValue}>
                        {BAND_LABELS[bandValue]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Override reason (required)"
                  rows={3}
                  value={overrideReason}
                  onChange={(event) => setOverrideReason(event.target.value)}
                />
                <Button variant="outline" onClick={onOverridePriority}>
                  Override Priority
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      {/* Dependencies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Dependencies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">Blocks</p>
              <div className="space-y-1">
                {(dependencies?.blocks ?? []).map((dep: any) => (
                  <div key={dep.dependencyId} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                    <Link href={`/issues/${dep.issueId}`} className="hover:underline truncate">
                      {dep.title}
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveDependency(dep.dependencyId)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {(dependencies?.blocks ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Not blocking anything</p>
                ) : null}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Blocked by</p>
              <div className="space-y-1">
                {(dependencies?.blockedBy ?? []).map((dep: any) => (
                  <div key={dep.dependencyId} className="flex items-center justify-between rounded border border-destructive/30 bg-destructive/5 p-2 text-sm">
                    <Link href={`/issues/${dep.issueId}`} className="hover:underline truncate">
                      {dep.title}
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveDependency(dep.dependencyId)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                {(dependencies?.blockedBy ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Not blocked by anything</p>
                ) : null}
              </div>
            </div>
          </div>
          {(dependencies?.relatesTo ?? []).length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">Related</p>
              <div className="space-y-1">
                {dependencies.relatesTo.map((dep: any) => (
                  <div key={dep.dependencyId} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                    <Link href={`/issues/${dep.issueId}`} className="hover:underline truncate">
                      {dep.title}
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => onRemoveDependency(dep.dependencyId)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <Separator />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Add dependency</Label>
              <Input
                placeholder="Search issues..."
                value={depSearch}
                onChange={(e) => setDepSearch(e.target.value)}
              />
            </div>
            <Select value={depType} onValueChange={(v: any) => setDepType(v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blocks">Blocks</SelectItem>
                <SelectItem value="relates_to">Relates to</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {depSearchResults && depSearchResults.length > 0 ? (
            <div className="space-y-1">
              {depSearchResults.filter((r: any) => r._id !== issueId).map((result: any) => (
                <div key={result._id} className="flex items-center justify-between rounded border border-border p-2 text-sm">
                  <span className="truncate">{result.title}</span>
                  <Button size="sm" variant="outline" onClick={() => onAddDependency(result._id)}>
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Duplicate Suggestions */}
      <Card>
        <CardHeader>
          <CardTitle>Duplicate Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(duplicates ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No likely duplicates above 0.55 similarity.</p>
          ) : (
            (duplicates ?? []).map((candidate: any) => (
              <div key={candidate.issueId} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="font-medium">{candidate.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Similarity: {candidate.similarity} · Status: {getStatusLabel(candidate.status)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/issues/${candidate.issueId}`}>Open</Link>
                  </Button>
                  {me?.role === "admin" ? (
                    <Button size="sm" onClick={() => onMergeDuplicate(candidate.issueId)}>
                      <CopyCheck className="mr-1 h-3.5 w-3.5" />
                      Merge
                    </Button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <RichTextEditor
              ref={commentEditorRef}
              placeholder="Add a comment..."
              onChange={setCommentHtml}
            />
            <Button onClick={onComment} disabled={!commentHtml.trim() || isCommentSubmitting}>
              {isCommentSubmitting ? "Posting..." : "Post Comment"}
            </Button>
            <Separator />
            <div className="space-y-3">
              {data.comments.map((entry: any) => (
                <div key={entry._id} className="rounded-lg border border-border p-3">
                  <div
                    className="prose prose-sm dark:prose-invert max-w-none text-sm"
                    dangerouslySetInnerHTML={{ __html: entry.body }}
                  />
                  <div className="mt-1 flex items-center gap-2">
                    <p className="text-xs text-muted-foreground">{relativeTime(entry.createdAt)}</p>
                    {entry.editedAt ? <p className="text-xs text-muted-foreground">(edited)</p> : null}
                    <ReactionPicker commentId={entry._id} reactions={entry.reactions ?? []} />
                  </div>
                </div>
              ))}
              {data.comments.length === 0 ? <p className="text-sm text-muted-foreground">No comments yet.</p> : null}
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking + Activity */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-end gap-2">
                <div className="grid gap-1.5">
                  <Label>Minutes</Label>
                  <Input
                    type="number"
                    value={timeMinutes}
                    onChange={(e) => setTimeMinutes(e.target.value)}
                    placeholder="30"
                    className="w-24"
                  />
                </div>
                <div className="flex-1 grid gap-1.5">
                  <Label>Description</Label>
                  <Input
                    value={timeDescription}
                    onChange={(e) => setTimeDescription(e.target.value)}
                    placeholder="What did you work on?"
                  />
                </div>
                <Button onClick={onLogTime} disabled={!timeMinutes || Number(timeMinutes) <= 0}>
                  Log
                </Button>
              </div>
              {(timeEntries ?? []).length > 0 ? (
                <>
                  <Separator />
                  <div className="space-y-1">
                    {(timeEntries ?? []).map((entry: any) => (
                      <div key={entry._id} className="flex items-center justify-between text-sm">
                        <span>{entry.durationMinutes}m — {entry.description || "No description"}</span>
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                      </div>
                    ))}
                    <p className="text-xs font-medium text-muted-foreground">
                      Total: {(timeEntries ?? []).reduce((sum: number, e: any) => sum + e.durationMinutes, 0)}m
                    </p>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.events.map((event: any) => (
                <div key={event._id} className="rounded-lg border border-border p-3">
                  <p className="text-sm font-medium">{event.eventType.replaceAll("_", " ")}</p>
                  {event.after?.source === "portal" && event.after?.submitterName ? (
                    <p className="text-xs text-muted-foreground">
                      by {event.after.submitterName} ({event.after.submitterEmail}) via portal
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground">{relativeTime(event.createdAt)}</p>
                </div>
              ))}
              {data.events.length === 0 ? <p className="text-sm text-muted-foreground">No activity yet.</p> : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
