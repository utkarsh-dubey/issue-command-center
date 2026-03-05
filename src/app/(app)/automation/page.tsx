"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Plus, Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";
import { relativeTime } from "@/lib/date";

const TRIGGERS = [
  { value: "issue_created", label: "Issue Created" },
  { value: "status_changed", label: "Status Changed" },
  { value: "priority_changed", label: "Priority Changed" },
  { value: "assignee_changed", label: "Assignee Changed" },
  { value: "stale_detected", label: "Stale Detected" },
  { value: "sla_breached", label: "SLA Breached" },
];

export default function AutomationPage() {
  const me = useQuery(api.users.me, {});
  const isAdmin = me?.role === "admin";
  const rules = useQuery(api.automations.listRules, isAdmin ? {} : "skip");
  const logs = useQuery(api.automations.listLogs, isAdmin ? { limit: 20 } : "skip");
  const createRule = useMutation(api.automations.createRule);
  const updateRule = useMutation(api.automations.updateRule);

  if (me && !isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold">Automation</h1>
        <Card><CardContent className="pt-4"><p className="text-sm text-muted-foreground">Only admins can manage automation rules.</p></CardContent></Card>
      </div>
    );
  }

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("issue_created");
  const [actionType, setActionType] = useState("set_priority");

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      await createRule({
        name,
        triggerType: trigger,
        conditions: {},
        actions: [{ actionType, params: {} }],
      });
      setShowCreate(false);
      setName("");
      toast.success("Rule created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to create rule"));
    }
  };

  const onToggle = async (ruleId: string, isActive: boolean) => {
    try {
      await updateRule({ ruleId: ruleId as any, isActive });
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to toggle rule"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Automation</h1>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="mr-1 h-4 w-4" />New Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New Automation Rule</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="grid gap-1.5">
                <Label>Trigger</Label>
                <Select value={trigger} onValueChange={setTrigger}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGERS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Action</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set_priority">Set Priority</SelectItem>
                    <SelectItem value="assign">Assign</SelectItem>
                    <SelectItem value="change_status">Change Status</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={onCreate} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules">
        <TabsList><TabsTrigger value="rules">Rules</TabsTrigger><TabsTrigger value="logs">Logs</TabsTrigger></TabsList>
        <TabsContent value="rules" className="space-y-3">
          {(rules ?? []).map((rule: any) => (
            <Card key={rule._id}>
              <CardContent className="flex items-center justify-between pt-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">{rule.name}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Trigger: {rule.triggerType} · Ran {rule.runCount} times
                  </p>
                </div>
                <Switch checked={rule.isActive} onCheckedChange={(v) => onToggle(rule._id, v)} />
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="logs" className="space-y-2">
          {(logs ?? []).map((log: any) => (
            <div key={log._id} className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm">{log.triggerType}</p>
                <p className="text-xs text-muted-foreground">{log.actionsExecuted.join(", ") || "No actions"}</p>
              </div>
              <div className="text-right">
                <Badge variant={log.success ? "secondary" : "destructive"}>{log.success ? "OK" : "Error"}</Badge>
                <p className="mt-1 text-xs text-muted-foreground">{relativeTime(log.createdAt)}</p>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
