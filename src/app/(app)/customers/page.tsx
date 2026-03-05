"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Heart, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";
import { cn } from "@/lib/utils";

const TIER_LABELS: Record<string, string> = {
  enterprise: "Enterprise",
  mid_market: "Mid-Market",
  smb: "SMB",
  free: "Free",
};

export default function CustomersPage() {
  const me = useQuery(api.users.me, {});
  const customers = useQuery(api.customers.listWithIssueCounts, {});

  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [notes, setNotes] = useState("");
  const [tier, setTier] = useState("none");

  const canManage = me?.role === "admin" || me?.role === "member";

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    try {
      await createCustomer({
        name,
        domain: domain || undefined,
        notes: notes || undefined,
        tier: tier === "none" ? undefined : (tier as any),
      });
      setName("");
      setDomain("");
      setNotes("");
      setTier("none");
      toast.success("Customer created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to create customer."));
    }
  };

  const onToggleActive = async (customerId: string, currentValue: boolean) => {
    try {
      await updateCustomer({
        customerId,
        isActive: !currentValue,
      });
      toast.success(!currentValue ? "Customer reactivated" : "Customer archived");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update customer."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <div className="flex gap-2">
          <Link href="/customers/health">
            <Button variant="outline" size="sm"><Heart className="mr-1 h-4 w-4" />Health</Button>
          </Link>
          <Link href="/customers/impact">
            <Button variant="outline" size="sm"><TrendingDown className="mr-1 h-4 w-4" />Impact</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(customers ?? []).map((customer: any) => {
            const healthScore = customer.healthScore ?? null;
            const healthColor =
              healthScore === null ? "" : healthScore >= 70 ? "text-green-600" : healthScore >= 40 ? "text-yellow-600" : "text-red-600";

            return (
              <div key={customer._id} className="rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Link href={`/customers/${customer._id}`} className="font-medium hover:underline">
                      {customer.name}
                    </Link>
                    {customer.domain ? <p className="text-xs text-muted-foreground">{customer.domain}</p> : null}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{customer.issueCount} issues</span>
                      {customer.tier ? <Badge variant="outline" className="text-xs">{TIER_LABELS[customer.tier] ?? customer.tier}</Badge> : null}
                      {healthScore !== null ? (
                        <span className={cn("text-xs font-medium", healthColor)}>Health: {healthScore}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={customer.isActive ? "secondary" : "outline"}>
                      {customer.isActive ? "Active" : "Archived"}
                    </Badge>
                    {canManage ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggleActive(customer._id, customer.isActive)}
                      >
                        {customer.isActive ? "Archive" : "Activate"}
                      </Button>
                    ) : null}
                  </div>
                </div>
                {customer.notes ? <p className="mt-2 text-sm text-muted-foreground">{customer.notes}</p> : null}
              </div>
            );
          })}
          {customers && customers.length === 0 ? <p className="text-sm text-muted-foreground">No customers yet.</p> : null}
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input placeholder="Customer name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>Domain</Label>
                <Input placeholder="customer.com" value={domain} onChange={(e) => setDomain(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Tier</Label>
              <Select value={tier} onValueChange={setTier}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No tier</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                  <SelectItem value="mid_market">Mid-Market</SelectItem>
                  <SelectItem value="smb">SMB</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea placeholder="Key context" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
            <Button onClick={onCreate}>Create Customer</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
