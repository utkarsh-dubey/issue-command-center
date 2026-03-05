"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Clock } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export function TimeTracker({ issueId }: { issueId: string }) {
  const entries = useQuery(api.timeTracking.listForIssue, { issueId });
  const logTime = useMutation(api.timeTracking.log);

  const [minutes, setMinutes] = useState("");
  const [description, setDescription] = useState("");

  const onLog = async () => {
    const mins = Number(minutes);
    if (!mins || mins <= 0) return;
    try {
      await logTime({
        issueId,
        durationMinutes: mins,
        description: description || undefined,
        date: new Date().toISOString().split("T")[0],
      });
      setMinutes("");
      setDescription("");
      toast.success("Time logged");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to log time."));
    }
  };

  const total = (entries ?? []).reduce((sum: number, e: any) => sum + e.durationMinutes, 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" />
        Time Tracking
        {total > 0 ? <span className="text-muted-foreground">({total}m total)</span> : null}
      </div>
      <div className="flex items-end gap-2">
        <div className="grid gap-1.5">
          <Label className="text-xs">Minutes</Label>
          <Input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="30"
            className="w-20"
          />
        </div>
        <div className="flex-1 grid gap-1.5">
          <Label className="text-xs">Description</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What did you work on?"
          />
        </div>
        <Button size="sm" onClick={onLog} disabled={!minutes || Number(minutes) <= 0}>
          Log
        </Button>
      </div>
      {(entries ?? []).length > 0 ? (
        <>
          <Separator />
          <div className="space-y-1">
            {(entries ?? []).map((entry: any) => (
              <div key={entry._id} className="flex items-center justify-between text-xs">
                <span>{entry.durationMinutes}m — {entry.description || "No description"}</span>
                <span className="text-muted-foreground">{entry.date}</span>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
