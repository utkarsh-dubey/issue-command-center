"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TRIGGERS = [
  { value: "issue_created", label: "Issue Created" },
  { value: "status_changed", label: "Status Changed" },
  { value: "priority_changed", label: "Priority Changed" },
  { value: "assignee_changed", label: "Assignee Changed" },
  { value: "stale_detected", label: "Stale Detected" },
  { value: "sla_breached", label: "SLA Breached" },
];

const ACTIONS = [
  { value: "set_status", label: "Set Status" },
  { value: "set_priority", label: "Set Priority" },
  { value: "assign_user", label: "Assign User" },
  { value: "add_comment", label: "Add Comment" },
  { value: "send_notification", label: "Send Notification" },
];

export function RuleBuilder({
  onSave,
}: {
  onSave: (rule: { name: string; triggerType: string; conditions: any; actions: any[] }) => void;
}) {
  const [name, setName] = useState("");
  const [trigger, setTrigger] = useState("issue_created");
  const [actionType, setActionType] = useState("set_status");
  const [actionParam, setActionParam] = useState("");

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>Rule Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Auto-assign P0 issues" />
      </div>

      <div className="grid gap-2">
        <Label>When (Trigger)</Label>
        <Select value={trigger} onValueChange={setTrigger}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIGGERS.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label>Then (Action)</Label>
        <div className="flex gap-2">
          <Select value={actionType} onValueChange={setActionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIONS.map((a) => (
                <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={actionParam}
            onChange={(e) => setActionParam(e.target.value)}
            placeholder="Parameter value"
          />
        </div>
      </div>

      <Button
        onClick={() => {
          if (!name.trim()) return;
          onSave({
            name,
            triggerType: trigger,
            conditions: {},
            actions: [{ actionType, params: { value: actionParam } }],
          });
          setName("");
          setActionParam("");
        }}
        disabled={!name.trim()}
      >
        Save Rule
      </Button>
    </div>
  );
}
