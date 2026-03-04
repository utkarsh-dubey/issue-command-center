"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

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
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export default function NotificationSettingsPage() {
  const me = useQuery(api.users.me, {});
  const settings = useQuery(api.settings.get, me ? {} : "skip");
  const updateSettings = useMutation(api.settings.update);

  const [digestEnabled, setDigestEnabled] = useState("true");
  const [digestTimezone, setDigestTimezone] = useState("Asia/Kolkata");
  const [digestDay, setDigestDay] = useState("monday");
  const [digestHour, setDigestHour] = useState("9");
  const [digestMinute, setDigestMinute] = useState("0");
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState("");
  const [notifyStatus, setNotifyStatus] = useState("true");
  const [notifyPriority, setNotifyPriority] = useState("true");

  useEffect(() => {
    if (!settings) return;
    setDigestEnabled(String(settings.digestEnabled ?? true));
    setDigestTimezone(settings.digestTimezone ?? "Asia/Kolkata");
    setDigestDay(settings.digestDay ?? "monday");
    setDigestHour(String(settings.digestHour ?? 9));
    setDigestMinute(String(settings.digestMinute ?? 0));
    setDiscordWebhookUrl(settings.discordWebhookUrl ?? "");
    setNotifyStatus(String(settings.discordNotifyOnStatusChange ?? true));
    setNotifyPriority(String(settings.discordNotifyOnPriorityChange ?? true));
  }, [settings]);

  if (!me) {
    return <div className="text-sm text-slate-500">Loading...</div>;
  }

  if (me.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Only admins can edit notification settings.</p>
        </CardContent>
      </Card>
    );
  }

  const onSave = async () => {
    try {
      await updateSettings({
        digestEnabled: digestEnabled === "true",
        digestTimezone,
        digestDay,
        digestHour: Number(digestHour),
        digestMinute: Number(digestMinute),
        discordWebhookUrl: discordWebhookUrl || undefined,
        discordNotifyOnStatusChange: notifyStatus === "true",
        discordNotifyOnPriorityChange: notifyPriority === "true",
      });
      toast.success("Notification settings updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update settings."));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Discord Alerts + Weekly Digest</CardTitle>
          <p className="text-sm text-slate-600">Configure real-time status/priority notifications and scheduled stakeholder digest.</p>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label>Discord Webhook URL</Label>
            <Input
              placeholder="https://discord.com/api/webhooks/..."
              value={discordWebhookUrl}
              onChange={(event) => setDiscordWebhookUrl(event.target.value)}
            />
          </div>

          <div className="grid gap-1.5 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label>Status change alerts</Label>
              <Select value={notifyStatus} onValueChange={setNotifyStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Priority change alerts</Label>
              <Select value={notifyPriority} onValueChange={setNotifyPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-1.5 md:grid-cols-5">
            <div className="grid gap-1.5">
              <Label>Digest enabled</Label>
              <Select value={digestEnabled} onValueChange={setDigestEnabled}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label>Timezone</Label>
              <Input value={digestTimezone} onChange={(event) => setDigestTimezone(event.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <Label>Day</Label>
              <Input value={digestDay} onChange={(event) => setDigestDay(event.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <Label>Hour</Label>
              <Input value={digestHour} onChange={(event) => setDigestHour(event.target.value)} />
            </div>

            <div className="grid gap-1.5">
              <Label>Minute</Label>
              <Input value={digestMinute} onChange={(event) => setDigestMinute(event.target.value)} />
            </div>
          </div>

          <Button onClick={onSave} className="w-fit">
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
