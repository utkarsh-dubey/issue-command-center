"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, CopyCheck } from "lucide-react";
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

  const updateBasics = useMutation(api.issues.updateBasics);
  const assign = useMutation(api.issues.assign);
  const setRice = useMutation(api.issues.setRice);
  const updateStatus = useMutation(api.issues.updateStatus);
  const overridePriority = useMutation(api.issues.overridePriority);
  const addComment = useMutation(api.comments.add);
  const mergeDuplicate = useMutation(api.issues.mergeDuplicate);

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

  const [comment, setComment] = useState("");
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [hydratedIssueId, setHydratedIssueId] = useState<string | null>(null);
  const [detailsSaveState, setDetailsSaveState] = useState<AutoSaveState>("idle");
  const [scoreSaveState, setScoreSaveState] = useState<AutoSaveState>("idle");
  const lastSavedBasicsRef = useRef("");
  const lastSavedRiceRef = useRef("");

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

  const onComment = async () => {
    if (!comment.trim() || isCommentSubmitting) return;
    try {
      setIsCommentSubmitting(true);
      await addComment({ issueId, body: comment, mentionUserIds: [] });
      setComment("");
      toast.success("Comment added");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to add comment."));
    } finally {
      setIsCommentSubmitting(false);
    }
  };

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

  if (!data) {
    return <div className="p-6 text-sm text-slate-500">Loading issue...</div>;
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
          <Badge className="bg-slate-900 text-white">{getBandLabel(issue.priorityBand)}</Badge>
          <Badge variant="secondary">{getStatusLabel(issue.status)}</Badge>
          {issue.customerId ? (
            <Badge variant="outline">{customers?.find((customer: any) => customer._id === issue.customerId)?.name ?? "Customer"}</Badge>
          ) : null}
          {issue.dueDate ? <Badge variant="outline">Due {formatDueDate(issue.dueDate)}</Badge> : null}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <CardTitle>Issue Details</CardTitle>
              <p className="text-xs text-slate-500">{getAutoSaveLabel(detailsSaveState)}</p>
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
                    {ISSUE_STATUSES.map((statusValue) => (
                      <SelectItem key={statusValue} value={statusValue}>
                        {STATUS_LABELS[statusValue]}
                      </SelectItem>
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
                <p className="text-xs text-slate-500">{getAutoSaveLabel(scoreSaveState)}</p>
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
                <div className="rounded-lg border border-cyan-200 bg-cyan-50 p-3 text-sm text-cyan-950">
                  Preview Score: {calculated.finalPriorityScore} ({BAND_LABELS[calculated.priorityBand]})
                </div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
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

      <Card>
        <CardHeader>
          <CardTitle>Duplicate Suggestions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(duplicates ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">No likely duplicates above 0.55 similarity.</p>
          ) : (
            (duplicates ?? []).map((candidate: any) => (
              <div key={candidate.issueId} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div>
                  <p className="font-medium">{candidate.title}</p>
                  <p className="text-xs text-slate-500">
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
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Add a comment (Enter to post, Cmd/Ctrl+Enter for new line)"
              rows={3}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
                if (event.metaKey || event.ctrlKey) return;
                event.preventDefault();
                void onComment();
              }}
            />
            <Button onClick={onComment} disabled={!comment.trim() || isCommentSubmitting}>
              {isCommentSubmitting ? "Posting..." : "Post Comment"}
            </Button>
            <Separator />
            <div className="space-y-3">
              {data.comments.map((entry: any) => (
                <div key={entry._id} className="rounded-lg border border-slate-200 p-3">
                  <p className="text-sm">{entry.body}</p>
                  <p className="mt-1 text-xs text-slate-500">{relativeTime(entry.createdAt)}</p>
                </div>
              ))}
              {data.comments.length === 0 ? <p className="text-sm text-slate-500">No comments yet.</p> : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.events.map((event: any) => (
              <div key={event._id} className="rounded-lg border border-slate-200 p-3">
                <p className="text-sm font-medium">{event.eventType.replaceAll("_", " ")}</p>
                <p className="text-xs text-slate-500">{relativeTime(event.createdAt)}</p>
              </div>
            ))}
            {data.events.length === 0 ? <p className="text-sm text-slate-500">No activity yet.</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
