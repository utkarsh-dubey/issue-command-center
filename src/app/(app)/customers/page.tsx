"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/convex-api";
import { getErrorMessage } from "@/lib/errors";

export default function CustomersPage() {
  const me = useQuery(api.users.me, {});
  const customers = useQuery(api.customers.listWithIssueCounts, {});

  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [notes, setNotes] = useState("");

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
      });
      setName("");
      setDomain("");
      setNotes("");
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
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(customers ?? []).map((customer: any) => (
            <div key={customer._id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{customer.name}</p>
                  {customer.domain ? <p className="text-xs text-slate-500">{customer.domain}</p> : null}
                  <p className="mt-1 text-xs text-slate-500">{customer.issueCount} linked issues</p>
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
              {customer.notes ? <p className="mt-2 text-sm text-slate-600">{customer.notes}</p> : null}
            </div>
          ))}
          {customers && customers.length === 0 ? <p className="text-sm text-slate-500">No customers yet.</p> : null}
        </CardContent>
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add Customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-1.5">
              <Label>Name</Label>
              <Input placeholder="Customer name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Domain</Label>
              <Input placeholder="customer.com (optional)" value={domain} onChange={(event) => setDomain(event.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any key context about this customer"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                rows={3}
              />
            </div>
            <Button onClick={onCreate}>Create Customer</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
