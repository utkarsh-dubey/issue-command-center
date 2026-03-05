"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Activity,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  House,
  Kanban,
  Layers,
  ListTodo,
  Map,
  Palette,
  Settings,
  Table2,
  Target,
  User,
  Users,
  Zap,
} from "lucide-react";

import { getStatusLabel } from "@/lib/domain";
import { PIPELINE_STAGES, getPipelineStageHref, isPipelineStage } from "@/lib/pipeline";
import { cn } from "@/lib/utils";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: any }[];
}

const navGroups: NavGroup[] = [
  {
    label: "Views",
    items: [
      { href: "/inbox", label: "Inbox", icon: ListTodo },
      { href: "/pipeline", label: "Pipeline", icon: Table2 },
      { href: "/board", label: "Board", icon: Kanban },
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/my-work", label: "My Work", icon: User },
    ],
  },
  {
    label: "Planning",
    items: [
      { href: "/roadmap", label: "Roadmap", icon: Map },
      { href: "/goals", label: "Goals", icon: Target },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/customers", label: "Customers", icon: Building2 },
      { href: "/reports", label: "Reports", icon: BarChart3 },
      { href: "/team", label: "Team", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/automation", label: "Automation", icon: Zap },
      { href: "/activity", label: "Activity", icon: Activity },
      { href: "/dashboard", label: "Dashboard", icon: House },
      { href: "/themes", label: "Themes", icon: Layers },
      { href: "/settings/users", label: "Users", icon: Settings },
      { href: "/settings/notifications", label: "Notifications", icon: Bell },
      { href: "/settings/appearance", label: "Appearance", icon: Palette },
    ],
  },
];

export function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isPipelineView = pathname === "/pipeline";
  const [pipelineExpanded, setPipelineExpanded] = useState(isPipelineView);

  useEffect(() => {
    if (isPipelineView) setPipelineExpanded(true);
  }, [isPipelineView]);

  const stageFromQuery = searchParams.get("stage");
  const activePipelineStage = isPipelineStage(stageFromQuery) ? stageFromQuery : "all";

  return (
    <nav className="space-y-4">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {group.label}
          </p>
          <div className="mt-1 space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);

              if (href === "/pipeline") {
                return (
                  <div key={href} className="space-y-0.5">
                    <div
                      className={cn(
                        "flex items-center rounded-xl text-sm transition",
                        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                      )}
                    >
                      <Link href={href} className="flex min-w-0 flex-1 items-center gap-2 px-3 py-2">
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                      <button
                        type="button"
                        aria-expanded={pipelineExpanded}
                        className={cn(
                          "mr-2 rounded-md p-1 transition",
                          active ? "hover:bg-white/15" : "hover:bg-accent",
                        )}
                        onClick={() => setPipelineExpanded((c) => !c)}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            pipelineExpanded ? "rotate-0" : "-rotate-90",
                          )}
                        />
                      </button>
                    </div>
                    {pipelineExpanded ? (
                      <div className="space-y-0.5 pl-6">
                        {(["all", ...PIPELINE_STAGES] as const).map((stage) => {
                          const stageActive = isPipelineView && activePipelineStage === stage;
                          return (
                            <Link
                              key={stage}
                              href={getPipelineStageHref(stage)}
                              className={cn(
                                "flex items-center rounded-lg px-3 py-1.5 text-sm transition",
                                stageActive
                                  ? "bg-primary text-primary-foreground"
                                  : "text-muted-foreground hover:bg-muted",
                              )}
                            >
                              {stage === "all" ? "All" : getStatusLabel(stage)}
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
