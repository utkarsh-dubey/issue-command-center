"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { BarChart3, Clock, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export default function TeamPage() {
  const teams = useQuery(api.teams.list, {});
  const createTeam = useMutation(api.teams.create);

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await createTeam({ name, description: description || undefined });
      setShowCreate(false);
      setName("");
      setDescription("");
      toast.success("Team created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create team"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
        <div className="flex gap-2">
          <Link href="/team/workload"><Button variant="outline" size="sm"><BarChart3 className="mr-1 h-4 w-4" />Workload</Button></Link>
          <Link href="/team/oncall"><Button variant="outline" size="sm"><Clock className="mr-1 h-4 w-4" />On-Call</Button></Link>
          <Link href="/team/standup"><Button variant="outline" size="sm"><Users className="mr-1 h-4 w-4" />Standup</Button></Link>
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-1 h-4 w-4" />New Team</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Team</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} /></div>
                <Button onClick={onCreate} className="w-full">Create</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(teams ?? []).map((team: any) => (
          <Card key={team._id}>
            <CardHeader>
              <CardTitle className="text-base">{team.name}</CardTitle>
              {team.description ? <p className="text-sm text-muted-foreground">{team.description}</p> : null}
            </CardHeader>
            <CardContent>
              <Badge variant={team.isActive ? "secondary" : "outline"}>
                {team.isActive ? "Active" : "Inactive"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
