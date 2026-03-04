"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/lib/convex-api";
import { ROLES } from "@/lib/domain";
import { getErrorMessage } from "@/lib/errors";

export default function UserSettingsPage() {
  const me = useQuery(api.users.me, {});

  const members = useQuery(api.users.listMembers, me?.role === "admin" ? {} : "skip");
  const invites = useQuery(api.invites.list, me?.role === "admin" ? {} : "skip");

  const createInvite = useMutation(api.invites.create);
  const updateRole = useMutation(api.users.updateRole);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("member");

  if (!me) {
    return <div className="text-sm text-slate-500">Loading...</div>;
  }

  if (me.role !== "admin") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Users & Access</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Only admins can view and update user management settings.</p>
        </CardContent>
      </Card>
    );
  }

  const onInvite = async () => {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    try {
      await createInvite({ email, role });
      setEmail("");
      toast.success("Invite created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to create invite."));
    }
  };

  const onRoleChange = async (userId: string, nextRole: string) => {
    try {
      await updateRole({ userId, role: nextRole });
      toast.success("Role updated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update role."));
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Invite User</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-[1fr_180px_auto] md:items-end">
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((entryRole) => (
                  <SelectItem key={entryRole} value={entryRole}>
                    {entryRole}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={onInvite}>Create Invite</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(members ?? []).map((member: any) => (
                <TableRow key={member._id}>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <Select value={member.role} onValueChange={(nextRole) => onRoleChange(member._id, nextRole)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((entryRole) => (
                          <SelectItem key={entryRole} value={entryRole}>
                            {entryRole}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.isActive ? "secondary" : "outline"}>{member.isActive ? "Active" : "Inactive"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(invites ?? []).map((invite: any) => (
            <div key={invite._id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
              <div>
                <p className="font-medium">{invite.email}</p>
                <p className="text-xs text-slate-500">Role: {invite.role}</p>
              </div>
              <Badge variant="secondary">{invite.status}</Badge>
            </div>
          ))}
          {invites && invites.length === 0 ? <p className="text-sm text-slate-500">No invites yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
