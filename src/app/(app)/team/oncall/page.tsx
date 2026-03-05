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
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export default function OncallPage() {
  const rotations = useQuery(api.oncall.listRotations, {});
  const teams = useQuery(api.teams.list, {});
  const users = useQuery(api.users.listAssignable, {});
  const createRotation = useMutation(api.oncall.createRotation);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [intervalDays, setIntervalDays] = useState("7");

  const onCreate = async () => {
    if (!name.trim() || !teamId) return;
    try {
      const memberIds = (users ?? []).filter((u: any) => u.isActive).map((u: any) => u._id);
      await createRotation({
        teamId: teamId as any,
        name,
        memberIds: memberIds.slice(0, 5),
        rotationIntervalDays: Number(intervalDays) || 7,
      });
      setShowCreate(false);
      setName("");
      toast.success("Rotation created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create rotation"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">On-Call Rotations</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />New Rotation</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Rotation</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid gap-1.5">
                <Label>Team</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {(teams ?? []).map((t: any) => <SelectItem key={t._id} value={t._id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Interval (days)</Label><Input value={intervalDays} onChange={(e) => setIntervalDays(e.target.value)} /></div>
              <Button onClick={onCreate} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(rotations ?? []).map((rotation: any) => {
        const currentUser = (users ?? []).find((u: any) => u._id === rotation.memberIds[rotation.currentIndex]);
        return (
          <Card key={rotation._id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{rotation.name}</CardTitle>
                <Badge>Every {rotation.rotationIntervalDays} days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                Current: <span className="font-medium">{currentUser?.name ?? "Unknown"}</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{rotation.memberIds.length} members in rotation</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
