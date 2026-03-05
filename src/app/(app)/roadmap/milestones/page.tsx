"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export default function MilestonesPage() {
  const milestones = useQuery(api.milestones.list, {});
  const sprints = useQuery(api.sprints.list, {});
  const createMilestone = useMutation(api.milestones.create);
  const createSprint = useMutation(api.sprints.create);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [startDate, setStartDate] = useState("");

  const [showSprintCreate, setShowSprintCreate] = useState(false);
  const [sprintName, setSprintName] = useState("");
  const [sprintStart, setSprintStart] = useState("");
  const [sprintEnd, setSprintEnd] = useState("");
  const [sprintMilestoneId, setSprintMilestoneId] = useState("none");

  const onCreateMilestone = async () => {
    if (!name.trim()) return;
    try {
      await createMilestone({
        name,
        description: description || undefined,
        startDate: startDate || undefined,
        targetDate: targetDate || undefined,
      });
      setShowCreate(false);
      setName("");
      setDescription("");
      setTargetDate("");
      setStartDate("");
      toast.success("Milestone created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create milestone"));
    }
  };

  const onCreateSprint = async () => {
    if (!sprintName.trim() || !sprintStart || !sprintEnd) return;
    try {
      await createSprint({
        name: sprintName,
        startDate: sprintStart,
        endDate: sprintEnd,
        milestoneId: sprintMilestoneId === "none" ? undefined : sprintMilestoneId,
      } as any);
      setShowSprintCreate(false);
      setSprintName("");
      setSprintStart("");
      setSprintEnd("");
      setSprintMilestoneId("");
      toast.success("Sprint created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create sprint"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Milestones & Sprints</h1>
        <div className="flex gap-2">
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" />Milestone</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Milestone</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Start</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>Target</Label><Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} /></div>
                </div>
                <Button onClick={onCreateMilestone} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={showSprintCreate} onOpenChange={setShowSprintCreate}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline"><Plus className="mr-1 h-4 w-4" />Sprint</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Sprint</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid gap-1.5"><Label>Name</Label><Input value={sprintName} onChange={(e) => setSprintName(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Start</Label><Input type="date" value={sprintStart} onChange={(e) => setSprintStart(e.target.value)} /></div>
                  <div className="grid gap-1.5"><Label>End</Label><Input type="date" value={sprintEnd} onChange={(e) => setSprintEnd(e.target.value)} /></div>
                </div>
                <div className="grid gap-1.5">
                  <Label>Milestone (optional)</Label>
                  <Select value={sprintMilestoneId} onValueChange={setSprintMilestoneId}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(milestones ?? []).map((m: any) => (
                        <SelectItem key={m._id} value={m._id}>{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={onCreateSprint} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {(milestones ?? []).map((milestone: any) => {
        const relatedSprints = (sprints ?? []).filter((s: any) => s.milestoneId === milestone._id);
        return (
          <Card key={milestone._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{milestone.name}</CardTitle>
                <Badge variant="secondary">{milestone.status}</Badge>
              </div>
              {milestone.description ? <p className="text-sm text-muted-foreground">{milestone.description}</p> : null}
              {milestone.targetDate ? <p className="text-xs text-muted-foreground">Target: {milestone.targetDate}</p> : null}
            </CardHeader>
            <CardContent>
              {relatedSprints.length > 0 ? (
                <div className="space-y-2">
                  {relatedSprints.map((sprint: any) => (
                    <div key={sprint._id} className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">{sprint.name}</p>
                        <p className="text-xs text-muted-foreground">{sprint.startDate} - {sprint.endDate}</p>
                      </div>
                      <Badge variant="secondary">{sprint.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No sprints</p>
              )}
            </CardContent>
          </Card>
        );
      })}

      {milestones && milestones.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No milestones yet. Create one to get started.
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
