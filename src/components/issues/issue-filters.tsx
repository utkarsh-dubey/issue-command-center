"use client";

import { SlidersHorizontal } from "lucide-react";
import { useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/convex-api";
import { BAND_LABELS, PRIORITY_BANDS, URGENCIES, getUrgencyLabel } from "@/lib/domain";

export interface FilterState {
  search: string;
  band: string;
  urgency: string;
  assigneeFilter: string;
  customerFilter: string;
  themeFilter: string;
  scoreFilter: string;
  updatedWindow: string;
  sortBy: string;
  scoreMin: string;
  scoreMax: string;
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  band: "all",
  urgency: "all",
  assigneeFilter: "all",
  customerFilter: "all",
  themeFilter: "all",
  scoreFilter: "all",
  updatedWindow: "all",
  sortBy: "priority_desc",
  scoreMin: "",
  scoreMax: "",
};

export function IssueFilters({
  filters,
  onChange,
}: {
  filters: FilterState;
  onChange: (updates: Partial<FilterState>) => void;
}) {
  const users = useQuery(api.users.listAssignable, {});
  const customers = useQuery(api.customers.list, {});
  const themes = useQuery(api.themes.list, {});

  const activeFilterCount = [
    filters.search.trim().length > 0,
    filters.band !== "all",
    filters.urgency !== "all",
    filters.assigneeFilter !== "all",
    filters.customerFilter !== "all",
    filters.themeFilter !== "all",
    filters.scoreFilter !== "all",
    filters.updatedWindow !== "all",
    filters.sortBy !== "priority_desc",
    filters.scoreMin.trim().length > 0,
    filters.scoreMax.trim().length > 0,
  ].filter(Boolean).length;

  const hasFilters = activeFilterCount > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="min-w-[240px] flex-1">
        <Input
          placeholder="Search title/description"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      <DropdownMenu modal={false}>
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
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Priority + Urgency
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={filters.band} onValueChange={(v) => onChange({ band: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All priorities</SelectItem>
                    {PRIORITY_BANDS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {BAND_LABELS[b]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.urgency} onValueChange={(v) => onChange({ urgency: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All urgency</SelectItem>
                    {URGENCIES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {getUrgencyLabel(u)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Ownership
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={filters.assigneeFilter} onValueChange={(v) => onChange({ assigneeFilter: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All assignees</SelectItem>
                    <SelectItem value="none">Unassigned only</SelectItem>
                    {(users ?? []).map((u: any) => (
                      <SelectItem key={u._id} value={u._id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filters.customerFilter} onValueChange={(v) => onChange({ customerFilter: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All customers</SelectItem>
                    <SelectItem value="none">No customer</SelectItem>
                    {(customers ?? []).map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="sm:col-span-2">
                  <Select value={filters.themeFilter} onValueChange={(v) => onChange({ themeFilter: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All themes</SelectItem>
                      <SelectItem value="none">No theme</SelectItem>
                      {(themes ?? []).map((t: any) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-1.5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Time + Sort</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <Select value={filters.updatedWindow} onValueChange={(v) => onChange({ updatedWindow: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Updated" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any time</SelectItem>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.sortBy} onValueChange={(v) => onChange({ sortBy: v })}>
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
      <Button type="button" variant="outline" disabled={!hasFilters} onClick={() => onChange(DEFAULT_FILTERS)}>
        Reset
      </Button>
    </div>
  );
}
