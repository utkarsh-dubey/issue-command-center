"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDueDate, relativeTime } from "@/lib/date";
import { api } from "@/lib/convex-api";
import { BAND_LABELS, PRIORITY_BANDS, URGENCIES, getBandLabel, getStatusLabel, getUrgencyLabel } from "@/lib/domain";
import { isPipelineStage } from "@/lib/pipeline";

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : undefined;
}

export default function PipelinePage() {
  const searchParams = useSearchParams();
  const users = useQuery(api.users.listAssignable, {});
  const customers = useQuery(api.customers.list, {});
  const themes = useQuery(api.themes.list, {});
  const [band, setBand] = useState<string>("all");
  const [urgency, setUrgency] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [customerFilter, setCustomerFilter] = useState<string>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");
  const [scoreFilter, setScoreFilter] = useState<string>("all");
  const [updatedWindow, setUpdatedWindow] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("priority_desc");
  const [scoreMin, setScoreMin] = useState("");
  const [scoreMax, setScoreMax] = useState("");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const stageParam = searchParams.get("stage");
  const activeStage = isPipelineStage(stageParam) ? stageParam : "all";

  const parsedScoreMin = parseOptionalNumber(scoreMin);
  const parsedScoreMax = parseOptionalNumber(scoreMax);
  const scoreMinValue =
    parsedScoreMin !== undefined && parsedScoreMax !== undefined ? Math.min(parsedScoreMin, parsedScoreMax) : parsedScoreMin;
  const scoreMaxValue =
    parsedScoreMin !== undefined && parsedScoreMax !== undefined ? Math.max(parsedScoreMin, parsedScoreMax) : parsedScoreMax;

  const hasLocalFilters =
    search.trim().length > 0 ||
    band !== "all" ||
    urgency !== "all" ||
    assigneeFilter !== "all" ||
    customerFilter !== "all" ||
    themeFilter !== "all" ||
    scoreFilter !== "all" ||
    updatedWindow !== "all" ||
    sortBy !== "priority_desc" ||
    scoreMin.trim().length > 0 ||
    scoreMax.trim().length > 0;

  const pipeline = useQuery(api.issues.listPipeline, {
    status: activeStage === "all" ? undefined : activeStage,
    priorityBand: band === "all" ? undefined : band,
    assigneeId: assigneeFilter === "all" ? undefined : assigneeFilter,
    customerId: customerFilter === "all" ? undefined : customerFilter,
    themeId: themeFilter === "all" ? undefined : themeFilter,
    urgency: urgency === "all" ? undefined : urgency,
    hasScore: scoreFilter === "all" ? undefined : scoreFilter === "scored",
    scoreMin: scoreMinValue,
    scoreMax: scoreMaxValue,
    updatedWithin: updatedWindow === "all" ? undefined : updatedWindow,
    sortBy,
    search: search || undefined,
  });

  const userById = useMemo(() => {
    const map = new Map<string, string>();
    for (const user of users ?? []) {
      map.set(user._id, user.name);
    }
    return map;
  }, [users]);

  const customerById = useMemo(() => {
    const map = new Map<string, string>();
    for (const customer of customers ?? []) {
      map.set(customer._id, customer.name);
    }
    return map;
  }, [customers]);

  const themeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const theme of themes ?? []) {
      map.set(theme._id, theme.name);
    }
    return map;
  }, [themes]);

  const activeFilterCount = [
    activeStage !== "all",
    search.trim().length > 0,
    band !== "all",
    urgency !== "all",
    assigneeFilter !== "all",
    customerFilter !== "all",
    themeFilter !== "all",
    scoreFilter !== "all",
    updatedWindow !== "all",
    sortBy !== "priority_desc",
    scoreMin.trim().length > 0,
    scoreMax.trim().length > 0,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setSearch("");
    setBand("all");
    setUrgency("all");
    setAssigneeFilter("all");
    setCustomerFilter("all");
    setThemeFilter("all");
    setScoreFilter("all");
    setUpdatedWindow("all");
    setSortBy("priority_desc");
    setScoreMin("");
    setScoreMax("");
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-xl">Priority Pipeline</CardTitle>
            <p className="text-xs text-slate-500">
              {pipeline?.length ?? "..."} results · {activeFilterCount} active filters
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-[240px] flex-1">
              <Input placeholder="Search title/description" value={search} onChange={(event) => setSearch(event.target.value)} />
            </div>
            <DropdownMenu modal={false} open={filtersOpen} onOpenChange={setFiltersOpen}>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" className="min-w-[150px] justify-between">
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </span>
                  <Badge variant="secondary" className="ml-1">
                    {activeFilterCount}
                  </Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[420px] p-0">
                <div className="space-y-4 p-4">
                  <div className="grid gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Priority + Urgency</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select value={band} onValueChange={setBand}>
                        <SelectTrigger>
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All priorities</SelectItem>
                          {PRIORITY_BANDS.map((priorityBand) => (
                            <SelectItem key={priorityBand} value={priorityBand}>
                              {BAND_LABELS[priorityBand]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={urgency} onValueChange={setUrgency}>
                        <SelectTrigger>
                          <SelectValue placeholder="Urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All urgency</SelectItem>
                          {URGENCIES.map((urgencyValue) => (
                            <SelectItem key={urgencyValue} value={urgencyValue}>
                              {getUrgencyLabel(urgencyValue)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Ownership + Grouping</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assignee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All assignees</SelectItem>
                          <SelectItem value="none">Unassigned only</SelectItem>
                          {(users ?? []).map((user: any) => (
                            <SelectItem key={user._id} value={user._id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={customerFilter} onValueChange={setCustomerFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Customer" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All customers</SelectItem>
                          <SelectItem value="none">No customer linked</SelectItem>
                          {(customers ?? []).map((customer: any) => (
                            <SelectItem key={customer._id} value={customer._id}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="sm:col-span-2">
                        <Select value={themeFilter} onValueChange={setThemeFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Theme" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All themes</SelectItem>
                            <SelectItem value="none">No theme linked</SelectItem>
                            {(themes ?? []).map((theme: any) => (
                              <SelectItem key={theme._id} value={theme._id}>
                                {theme.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Scoring</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <Select value={scoreFilter} onValueChange={setScoreFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Scoring" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Scored + unscored</SelectItem>
                          <SelectItem value="scored">Only scored</SelectItem>
                          <SelectItem value="unscored">Only unscored</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        placeholder="Min score"
                        inputMode="decimal"
                        value={scoreMin}
                        onChange={(event) => setScoreMin(event.target.value)}
                      />
                      <Input
                        placeholder="Max score"
                        inputMode="decimal"
                        value={scoreMax}
                        onChange={(event) => setScoreMax(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-1.5">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Time + Sorting</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Select value={updatedWindow} onValueChange={setUpdatedWindow}>
                        <SelectTrigger>
                          <SelectValue placeholder="Updated" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any update time</SelectItem>
                          <SelectItem value="24h">Updated in last 24h</SelectItem>
                          <SelectItem value="7d">Updated in last 7 days</SelectItem>
                          <SelectItem value="30d">Updated in last 30 days</SelectItem>
                          <SelectItem value="90d">Updated in last 90 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={sortBy} onValueChange={setSortBy}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="priority_desc">Priority high to low</SelectItem>
                          <SelectItem value="priority_asc">Priority low to high</SelectItem>
                          <SelectItem value="updated_desc">Recently updated</SelectItem>
                          <SelectItem value="updated_asc">Oldest updated</SelectItem>
                          <SelectItem value="title_asc">Title A-Z</SelectItem>
                          <SelectItem value="title_desc">Title Z-A</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button type="button" variant="outline" disabled={!hasLocalFilters} onClick={resetFilters}>
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{activeStage === "all" ? "Current Pipeline" : `${getStatusLabel(activeStage)} Queue`}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Urgency</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pipeline?.map((issue: any) => (
                <TableRow key={issue._id}>
                  <TableCell>
                    <Link className="font-medium hover:underline" href={`/issues/${issue._id}`}>
                      {issue.title}
                    </Link>
                  </TableCell>
                  <TableCell>{issue.customerId ? customerById.get(issue.customerId) ?? "-" : "-"}</TableCell>
                  <TableCell>{issue.themeId ? themeById.get(issue.themeId) ?? "-" : "-"}</TableCell>
                  <TableCell>
                    <Badge className="bg-slate-900 text-white">{getBandLabel(issue.priorityBand)}</Badge>
                  </TableCell>
                  <TableCell>{issue.finalPriorityScore ?? "-"}</TableCell>
                  <TableCell>{getUrgencyLabel(issue.urgency)}</TableCell>
                  <TableCell>{issue.dueDate ? formatDueDate(issue.dueDate) : "-"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{getStatusLabel(issue.status)}</Badge>
                  </TableCell>
                  <TableCell>{issue.assigneeId ? userById.get(issue.assigneeId) ?? "Unknown" : "Unassigned"}</TableCell>
                  <TableCell className="text-sm text-slate-500">{relativeTime(issue.updatedAt)}</TableCell>
                </TableRow>
              ))}
              {pipeline && pipeline.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center text-sm text-slate-500">
                    {activeStage === "all"
                      ? "No issues match current filters."
                      : `No ${getStatusLabel(activeStage).toLowerCase()} issues match current filters.`}
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
