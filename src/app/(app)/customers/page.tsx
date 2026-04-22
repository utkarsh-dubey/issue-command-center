"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { Heart, TrendingDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataGridColumnOptionsMenu } from "@/components/data-grid/column-options-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CustomersDataGrid,
  type CustomerFieldChange,
  type CustomerGridRow,
} from "@/components/customers/customers-data-grid";
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
  const [tier, setTier] = useState("none");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [region, setRegion] = useState("");
  const [segment, setSegment] = useState("none");
  const [lifecycle, setLifecycle] = useState("none");
  const [arr, setArr] = useState("");
  const [seats, setSeats] = useState("");
  const [renewalDate, setRenewalDate] = useState("");

  const canManage = me?.role === "admin" || me?.role === "member";

  const onCreate = async () => {
    if (!name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const arrNumber = arr.trim() ? Number(arr) : undefined;
    if (arrNumber !== undefined && Number.isNaN(arrNumber)) {
      toast.error("ARR must be a number");
      return;
    }
    const seatsNumber = seats.trim() ? Number(seats) : undefined;
    if (seatsNumber !== undefined && Number.isNaN(seatsNumber)) {
      toast.error("Seats must be a number");
      return;
    }

    try {
      await createCustomer({
        name,
        domain: domain || undefined,
        notes: notes || undefined,
        tier: tier === "none" ? undefined : (tier as "enterprise" | "mid_market" | "smb" | "free"),
        primaryContactName: primaryContactName || undefined,
        primaryContactEmail: primaryContactEmail || undefined,
        region: region || undefined,
        segment:
          segment === "none"
            ? undefined
            : (segment as "strategic" | "enterprise" | "growth" | "mid_market" | "smb"),
        lifecycle:
          lifecycle === "none"
            ? undefined
            : (lifecycle as "onboarding" | "active" | "renewal" | "paused" | "archived"),
        arr: arrNumber,
        seats: seatsNumber,
        renewalDate: renewalDate || undefined,
      });
      setName("");
      setDomain("");
      setNotes("");
      setTier("none");
      setPrimaryContactName("");
      setPrimaryContactEmail("");
      setRegion("");
      setSegment("none");
      setLifecycle("none");
      setArr("");
      setSeats("");
      setRenewalDate("");
      toast.success("Customer created");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to create customer."));
    }
  };

  const onToggleActive = async (customerId: string, currentValue: boolean) => {
    try {
      await updateCustomer({
        customerId: customerId as never,
        isActive: !currentValue,
      });
      toast.success(!currentValue ? "Customer reactivated" : "Customer archived");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update customer."));
    }
  };

  const onFieldChange = async (customerId: string, change: CustomerFieldChange) => {
    try {
      await updateCustomer({
        customerId: customerId as never,
        [change.field]: change.value,
      } as never);
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update customer."));
    }
  };

  const gridRows = useMemo<CustomerGridRow[]>(() => {
    if (!customers) return [];
    return customers.map((customer: {
      _id: string;
      name: string;
      domain?: string;
      tier?: string;
      issueCount: number;
      healthScore?: number | null;
      isActive: boolean;
      notes?: string;
      primaryContactName?: string;
      primaryContactEmail?: string;
      region?: string;
      segment?: string;
      lifecycle?: string;
      arr?: number;
      seats?: number;
      csat?: number;
      accountOwnerName?: string | null;
      renewalDate?: string;
    }) => ({
      id: customer._id,
      customerId: customer._id,
      name: customer.name,
      domain: customer.domain ?? null,
      tier: customer.tier ?? null,
      issueCount: customer.issueCount,
      healthScore: customer.healthScore ?? null,
      isActive: customer.isActive,
      notes: customer.notes ?? null,
      primaryContactName: customer.primaryContactName ?? null,
      primaryContactEmail: customer.primaryContactEmail ?? null,
      region: customer.region ?? null,
      segment: customer.segment ?? null,
      lifecycle: customer.lifecycle ?? null,
      arr: customer.arr ?? null,
      seats: customer.seats ?? null,
      csat: customer.csat ?? null,
      accountOwnerName: customer.accountOwnerName ?? null,
      renewalDate: customer.renewalDate ?? null,
    }));
  }, [customers]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-xl font-semibold">Customers</h1>
        <div className="flex gap-2">
          <Link href="/customers/health">
            <Button variant="outline" size="sm">
              <Heart className="mr-1 h-4 w-4" />
              Health
            </Button>
          </Link>
          <Link href="/customers/impact">
            <Button variant="outline" size="sm">
              <TrendingDown className="mr-1 h-4 w-4" />
              Impact
            </Button>
          </Link>
        </div>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardHeader className="shrink-0 border-b">
          <CardTitle>All Customers</CardTitle>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col p-0">
          {gridRows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
              <p className="text-sm font-medium text-foreground">No customers yet</p>
              <p className="text-xs text-muted-foreground">
                Add your first customer using the form below.
              </p>
            </div>
          ) : (
            <CustomersDataGrid
              rows={gridRows}
              canManage={canManage}
              onToggleActive={onToggleActive}
              onFieldChange={onFieldChange}
              fillAvailableHeight
              stickySummaryFooter
              tableContainerClassName="h-full overflow-auto"
              renderToolbar={(toolbarProps) => (
                <div className="flex items-center justify-between gap-2 border-b bg-background px-3 py-2">
                  <div className="text-xs text-muted-foreground">
                    {toolbarProps.visibleRowCount} rows
                    {toolbarProps.selectedRowCount > 0 ? (
                      <>
                        {" "}
                        · <span className="font-medium text-foreground">{toolbarProps.selectedRowCount}</span>{" "}
                        selected
                        <Button
                          variant="ghost"
                          size="xs"
                          className="ml-2 h-7"
                          onClick={toolbarProps.clearSelection}
                        >
                          Clear
                        </Button>
                      </>
                    ) : null}
                  </div>
                  <DataGridColumnOptionsMenu {...toolbarProps} />
                </div>
              )}
            />
          )}
        </CardContent>
      </Card>

      {canManage ? (
        <Card className="shrink-0">
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
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label>Primary contact name</Label>
                <Input
                  placeholder="Jane Doe"
                  value={primaryContactName}
                  onChange={(e) => setPrimaryContactName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Primary contact email</Label>
                <Input
                  type="email"
                  placeholder="jane@customer.com"
                  value={primaryContactEmail}
                  onChange={(e) => setPrimaryContactEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="grid gap-1.5">
                <Label>Tier</Label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                <Label>Segment</Label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No segment</SelectItem>
                    <SelectItem value="strategic">Strategic</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="growth">Growth</SelectItem>
                    <SelectItem value="mid_market">Mid-Market</SelectItem>
                    <SelectItem value="smb">SMB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Lifecycle</Label>
                <Select value={lifecycle} onValueChange={setLifecycle}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Not set</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="renewal">Renewal</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <div className="grid gap-1.5">
                <Label>Region</Label>
                <Input placeholder="NA, EMEA, APAC…" value={region} onChange={(e) => setRegion(e.target.value)} />
              </div>
              <div className="grid gap-1.5">
                <Label>ARR (USD)</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="120000"
                  value={arr}
                  onChange={(e) => setArr(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Seats</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  placeholder="25"
                  value={seats}
                  onChange={(e) => setSeats(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Renewal date</Label>
                <Input type="date" value={renewalDate} onChange={(e) => setRenewalDate(e.target.value)} />
              </div>
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
