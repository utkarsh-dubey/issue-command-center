"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/convex-api";
import { getBandLabel, getStatusLabel } from "@/lib/domain";
import { relativeTime } from "@/lib/date";
import { getErrorMessage } from "@/lib/errors";

const TIER_LABELS: Record<string, string> = {
  enterprise: "Enterprise",
  mid_market: "Mid-Market",
  smb: "SMB",
  free: "Free",
};

const SEGMENT_LABELS: Record<string, string> = {
  strategic: "Strategic",
  enterprise: "Enterprise",
  growth: "Growth",
  mid_market: "Mid-Market",
  smb: "SMB",
};

const LIFECYCLE_LABELS: Record<string, string> = {
  onboarding: "Onboarding",
  active: "Active",
  renewal: "Renewal",
  paused: "Paused",
  archived: "Archived",
};

type AutoSaveState = "idle" | "saving" | "saved" | "error";

function getAutoSaveLabel(state: AutoSaveState) {
  if (state === "saving") return "Saving…";
  if (state === "saved") return "Saved";
  if (state === "error") return "Save failed";
  return "";
}

function formatArr(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

function parseNumberOrNull(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return null; // empty → clear the value
  const n = Number(trimmed);
  if (Number.isNaN(n)) return undefined; // invalid → skip save
  return n;
}

function arrayFromTextarea(value: string, separator: "comma" | "line"): string[] {
  const pattern = separator === "comma" ? /,/ : /\r?\n/;
  return value
    .split(pattern)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const customerId = params.id as any;

  const me = useQuery(api.users.me, {});
  const users = useQuery(api.users.listAssignable, {});
  const data = useQuery(api.customers.getById, { customerId });
  const updateCustomer = useMutation(api.customers.update);

  const canEdit = me?.role === "admin" || me?.role === "member";

  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [primaryContactName, setPrimaryContactName] = useState("");
  const [primaryContactEmail, setPrimaryContactEmail] = useState("");
  const [region, setRegion] = useState("");
  const [tier, setTier] = useState("none");
  const [segment, setSegment] = useState("none");
  const [lifecycle, setLifecycle] = useState("none");
  const [arr, setArr] = useState("");
  const [seats, setSeats] = useState("");
  const [csat, setCsat] = useState("");
  const [accountOwnerId, setAccountOwnerId] = useState("none");
  const [renewalDate, setRenewalDate] = useState("");
  const [summary, setSummary] = useState("");
  const [notes, setNotes] = useState("");
  const [productAreasRaw, setProductAreasRaw] = useState("");
  const [riskSignalsRaw, setRiskSignalsRaw] = useState("");

  const [hydratedCustomerId, setHydratedCustomerId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<AutoSaveState>("idle");
  const lastSavedRef = useRef("");

  useEffect(() => {
    if (!data?.customer) return;
    const customer = data.customer;
    if (hydratedCustomerId === customer._id) return;

    setName(customer.name ?? "");
    setDomain(customer.domain ?? "");
    setPrimaryContactName(customer.primaryContactName ?? "");
    setPrimaryContactEmail(customer.primaryContactEmail ?? "");
    setRegion(customer.region ?? "");
    setTier(customer.tier ?? "none");
    setSegment(customer.segment ?? "none");
    setLifecycle(customer.lifecycle ?? "none");
    setArr(customer.arr !== undefined ? String(customer.arr) : "");
    setSeats(customer.seats !== undefined ? String(customer.seats) : "");
    setCsat(customer.csat !== undefined ? String(customer.csat) : "");
    setAccountOwnerId(customer.accountOwnerId ?? "none");
    setRenewalDate(customer.renewalDate ?? "");
    setSummary(customer.summary ?? "");
    setNotes(customer.notes ?? "");
    setProductAreasRaw((customer.productAreas ?? []).join(", "));
    setRiskSignalsRaw((customer.riskSignals ?? []).join("\n"));

    lastSavedRef.current = ""; // force first save-check to settle with server state
    setHydratedCustomerId(customer._id);
  }, [data, hydratedCustomerId]);

  const payload = useMemo(() => {
    const arrValue = parseNumberOrNull(arr);
    const seatsValue = parseNumberOrNull(seats);
    const csatValue = parseNumberOrNull(csat);

    return {
      name: name.trim(),
      domain: domain.trim() ? domain.trim() : null,
      primaryContactName: primaryContactName.trim() ? primaryContactName.trim() : null,
      primaryContactEmail: primaryContactEmail.trim() ? primaryContactEmail.trim() : null,
      region: region.trim() ? region.trim() : null,
      tier: tier === "none" ? null : tier,
      segment: segment === "none" ? null : segment,
      lifecycle: lifecycle === "none" ? null : lifecycle,
      arr: arrValue,
      seats: seatsValue,
      csat: csatValue,
      accountOwnerId: accountOwnerId === "none" ? null : accountOwnerId,
      renewalDate: renewalDate.trim() ? renewalDate.trim() : null,
      summary: summary.trim() ? summary.trim() : null,
      notes: notes.trim() ? notes.trim() : null,
      productAreas: arrayFromTextarea(productAreasRaw, "comma"),
      riskSignals: arrayFromTextarea(riskSignalsRaw, "line"),
    };
  }, [
    name,
    domain,
    primaryContactName,
    primaryContactEmail,
    region,
    tier,
    segment,
    lifecycle,
    arr,
    seats,
    csat,
    accountOwnerId,
    renewalDate,
    summary,
    notes,
    productAreasRaw,
    riskSignalsRaw,
  ]);

  useEffect(() => {
    if (!data?.customer || hydratedCustomerId !== data.customer._id) return;
    if (!canEdit) return;
    if (!payload.name) return; // name is required — skip save until valid

    // Skip save if any of the numeric fields are mid-edit and invalid (undefined).
    if (payload.arr === undefined || payload.seats === undefined || payload.csat === undefined) return;

    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedRef.current) return;

    // On first pass after hydration, seed the ref from the server state
    // so we don't trigger a spurious save.
    if (lastSavedRef.current === "") {
      lastSavedRef.current = serialized;
      return;
    }

    setSaveState("saving");
    const timer = setTimeout(() => {
      void (async () => {
        try {
          await updateCustomer({
            customerId,
            name: payload.name,
            domain: payload.domain,
            primaryContactName: payload.primaryContactName,
            primaryContactEmail: payload.primaryContactEmail,
            region: payload.region,
            tier: payload.tier as any,
            segment: payload.segment as any,
            lifecycle: payload.lifecycle as any,
            arr: payload.arr,
            seats: payload.seats,
            csat: payload.csat,
            accountOwnerId: payload.accountOwnerId as any,
            renewalDate: payload.renewalDate,
            summary: payload.summary,
            notes: payload.notes,
            productAreas: payload.productAreas,
            riskSignals: payload.riskSignals,
          });
          lastSavedRef.current = serialized;
          setSaveState("saved");
        } catch (err) {
          setSaveState("error");
          toast.error(getErrorMessage(err, "Unable to auto-save customer."));
        }
      })();
    }, 500);

    return () => clearTimeout(timer);
  }, [canEdit, customerId, data, hydratedCustomerId, payload, updateCustomer]);

  const onToggleActive = async () => {
    if (!data?.customer) return;
    try {
      await updateCustomer({
        customerId,
        isActive: !data.customer.isActive,
      });
      toast.success(data.customer.isActive ? "Customer archived" : "Customer reactivated");
    } catch (err) {
      toast.error(getErrorMessage(err, "Unable to update customer."));
    }
  };

  if (!data) return <p className="p-6 text-sm text-muted-foreground">Loading...</p>;

  const { customer, issues, statusCounts } = data;
  const healthColor =
    (customer.healthScore ?? 100) >= 70
      ? "text-green-600"
      : (customer.healthScore ?? 100) >= 40
        ? "text-yellow-600"
        : "text-red-600";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/customers">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Customers
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {saveState !== "idle" ? (
            <span
              className={`text-xs ${
                saveState === "error" ? "text-destructive" : "text-muted-foreground"
              }`}
            >
              {getAutoSaveLabel(saveState)}
            </span>
          ) : null}
          {customer.lifecycle ? (
            <Badge variant="outline">
              {LIFECYCLE_LABELS[customer.lifecycle] ?? customer.lifecycle}
            </Badge>
          ) : null}
          {customer.segment ? (
            <Badge variant="outline">{SEGMENT_LABELS[customer.segment] ?? customer.segment}</Badge>
          ) : null}
          {customer.tier ? (
            <Badge variant="secondary">{TIER_LABELS[customer.tier] ?? customer.tier}</Badge>
          ) : null}
          <span className={`text-lg font-bold ${healthColor}`}>{customer.healthScore ?? "-"}</span>
          {canEdit ? (
            <Button variant="outline" size="sm" onClick={onToggleActive}>
              {customer.isActive ? "Archive" : "Reactivate"}
            </Button>
          ) : null}
        </div>
      </div>

      <div>
        <h1 className="text-xl font-semibold">{customer.name}</h1>
        {customer.domain ? <p className="text-sm text-muted-foreground">{customer.domain}</p> : null}
        {customer.primaryContactName || customer.primaryContactEmail ? (
          <p className="mt-1 text-sm text-muted-foreground">
            {customer.primaryContactName ? (
              <span className="text-foreground">{customer.primaryContactName}</span>
            ) : null}
            {customer.primaryContactName && customer.primaryContactEmail ? " · " : null}
            {customer.primaryContactEmail ?? null}
          </p>
        ) : null}
      </div>

      <Card>
        <CardContent className="grid gap-4 py-4 sm:grid-cols-4">
          <QuickFact label="ARR" value={customer.arr !== undefined ? formatArr(customer.arr) : "—"} />
          <QuickFact
            label="Seats"
            value={customer.seats !== undefined ? customer.seats.toLocaleString() : "—"}
          />
          <QuickFact label="CSAT" value={customer.csat !== undefined ? customer.csat.toFixed(1) : "—"} />
          <QuickFact label="Region" value={customer.region ?? "—"} />
          <QuickFact
            label="Segment"
            value={customer.segment ? SEGMENT_LABELS[customer.segment] ?? customer.segment : "—"}
          />
          <QuickFact
            label="Lifecycle"
            value={customer.lifecycle ? LIFECYCLE_LABELS[customer.lifecycle] ?? customer.lifecycle : "—"}
          />
          <QuickFact label="Renewal" value={customer.renewalDate ?? "—"} />
          <QuickFact
            label="Last touch"
            value={customer.lastTouchAt ? relativeTime(customer.lastTouchAt) : "—"}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-5">
        {(["inbox", "triage", "planned", "doing", "done"] as const).map((status) => (
          <Card key={status}>
            <CardContent className="pt-4 text-center">
              <p className="text-2xl font-bold">{statusCounts[status] ?? 0}</p>
              <p className="text-xs text-muted-foreground">{getStatusLabel(status)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
          <TabsTrigger value="edit">Details</TabsTrigger>
          <TabsTrigger value="context">Context</TabsTrigger>
        </TabsList>

        <TabsContent value="issues">
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issues.map((issue: any) => (
                    <TableRow key={issue._id}>
                      <TableCell>
                        <Link href={`/issues/${issue._id}`} className="font-medium hover:underline">
                          {issue.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{getBandLabel(issue.priorityBand)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getStatusLabel(issue.status)}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {relativeTime(issue.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {issues.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No issues
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Account details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Domain</Label>
                  <Input
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    disabled={!canEdit}
                    placeholder="customer.com"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Primary contact name</Label>
                  <Input
                    value={primaryContactName}
                    onChange={(e) => setPrimaryContactName(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Primary contact email</Label>
                  <Input
                    type="email"
                    value={primaryContactEmail}
                    onChange={(e) => setPrimaryContactEmail(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="grid gap-1.5">
                  <Label>Tier</Label>
                  <Select value={tier} onValueChange={setTier} disabled={!canEdit}>
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
                  <Select value={segment} onValueChange={setSegment} disabled={!canEdit}>
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
                  <Select value={lifecycle} onValueChange={setLifecycle} disabled={!canEdit}>
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
                  <Input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    disabled={!canEdit}
                    placeholder="NA, EMEA, APAC…"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>ARR (USD)</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={arr}
                    onChange={(e) => setArr(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>Seats</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={seats}
                    onChange={(e) => setSeats(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label>CSAT</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={csat}
                    onChange={(e) => setCsat(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Account owner</Label>
                  <Select
                    value={accountOwnerId}
                    onValueChange={setAccountOwnerId}
                    disabled={!canEdit}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {(users ?? []).map((u: any) => (
                        <SelectItem key={u._id} value={u._id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>Renewal date</Label>
                  <Input
                    type="date"
                    value={renewalDate}
                    onChange={(e) => setRenewalDate(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Narrative summary of this account"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={!canEdit}
                  placeholder="Internal CSM notes"
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Product areas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Input
                    value={productAreasRaw}
                    onChange={(e) => setProductAreasRaw(e.target.value)}
                    disabled={!canEdit}
                    placeholder="Automation, Inbox, Analytics"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated list.</p>
                  {customer.productAreas && customer.productAreas.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {customer.productAreas.map((area: string) => (
                        <Badge key={area} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Risk signals</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Textarea
                    rows={4}
                    value={riskSignalsRaw}
                    onChange={(e) => setRiskSignalsRaw(e.target.value)}
                    disabled={!canEdit}
                    placeholder={"One signal per line"}
                  />
                  <p className="text-xs text-muted-foreground">One risk signal per line.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuickFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
