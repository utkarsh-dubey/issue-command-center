"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, Target } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export default function GoalsPage() {
  const goals = useQuery(api.goals.list, {});
  const users = useQuery(api.users.listAssignable, {});
  const createGoal = useMutation(api.goals.create);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goalType, setGoalType] = useState("goal");
  const [parentId, setParentId] = useState("none");
  const [ownerId, setOwnerId] = useState("none");

  const objectives = (goals ?? []).filter((g: any) => !g.parentGoalId);

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await createGoal({
        name,
        description: description || undefined,
        goalType: goalType as any,
        parentGoalId: parentId === "none" ? undefined : parentId,
        ownerId: ownerId === "none" ? undefined : ownerId,
      } as any);
      setShowCreate(false);
      setName("");
      setDescription("");
      toast.success("Goal created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create goal"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Goals & OKRs</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />New Goal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Goal</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid gap-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-1.5">
                  <Label>Type</Label>
                  <Select value={goalType} onValueChange={setGoalType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="goal">Goal</SelectItem>
                      <SelectItem value="okr_objective">OKR Objective</SelectItem>
                      <SelectItem value="okr_key_result">Key Result</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Owner</Label>
                  <Select value={ownerId} onValueChange={setOwnerId}>
                    <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(users ?? []).map((u: any) => <SelectItem key={u._id} value={u._id}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {goalType === "okr_key_result" ? (
                <div className="grid gap-1.5">
                  <Label>Parent Objective</Label>
                  <Select value={parentId} onValueChange={setParentId}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {objectives.map((g: any) => <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <Button onClick={onCreate} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {objectives.map((goal: any) => {
        const children = (goals ?? []).filter((g: any) => g.parentGoalId === goal._id);
        return (
          <Card key={goal._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  {goal.name}
                </CardTitle>
                <Badge variant="secondary">{goal.status}</Badge>
              </div>
              {goal.description ? <p className="text-sm text-muted-foreground">{goal.description}</p> : null}
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{goal.issueCount} issues</span>
                <span>{goal.progress}% complete</span>
              </div>
              <Progress value={goal.progress} className="h-2" />
            </CardHeader>
            {children.length > 0 ? (
              <CardContent className="space-y-2">
                {children.map((kr: any) => (
                  <div key={kr._id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{kr.name}</p>
                      <span className="text-xs text-muted-foreground">{kr.progress}%</span>
                    </div>
                    <Progress value={kr.progress} className="mt-2 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{kr.issueCount} linked issues</p>
                  </div>
                ))}
              </CardContent>
            ) : null}
          </Card>
        );
      })}
    </div>
  );
}
