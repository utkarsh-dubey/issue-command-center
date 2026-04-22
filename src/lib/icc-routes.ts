export type IccRouteIconKey =
  | "inbox"
  | "pipeline"
  | "board"
  | "calendar"
  | "my-work"
  | "roadmap"
  | "goals"
  | "customers"
  | "reports"
  | "team"
  | "automation"
  | "activity"
  | "dashboard"
  | "themes"
  | "settings"
  | "notifications"
  | "appearance"

export type IccRouteGroup = "views" | "planning" | "intelligence" | "system"

export type IccSidebarPresetFilter = {
  title: string
  href: string
  description?: string
  role?: "admin" | "member" | "viewer"
}

export type IccRoute = {
  title: string
  path: string
  description: string
  icon: IccRouteIconKey
  group: IccRouteGroup
  presetFilters?: IccSidebarPresetFilter[]
  roles?: ("admin" | "member" | "viewer")[]
}

export const iccRoutes: IccRoute[] = [
  // Views
  {
    title: "Inbox",
    path: "/inbox",
    description: "Triage newly submitted issues and promote them to the pipeline.",
    icon: "inbox",
    group: "views",
    presetFilters: [
      { title: "All incoming", href: "/inbox", description: "Everything awaiting triage" },
      { title: "Portal submissions", href: "/inbox?source=portal", description: "From the public submission form" },
      { title: "Manual captures", href: "/inbox?source=manual", description: "Created by team members" },
      { title: "High urgency", href: "/inbox?urgency=critical,high", description: "Critical & high only" },
    ],
  },
  {
    title: "Pipeline",
    path: "/pipeline",
    description: "Everything in the prioritized pipeline — filterable by every attribute.",
    icon: "pipeline",
    group: "views",
    presetFilters: [
      { title: "All issues", href: "/pipeline", description: "Every open item" },
      { title: "My assigned", href: "/pipeline?assignee=me", description: "Issues owned by you" },
      { title: "Unassigned", href: "/pipeline?assignee=unassigned", description: "Needs an owner" },
      { title: "Past due", href: "/pipeline?updatedWindow=over30", description: "Stale for more than 30 days" },
      { title: "P0 & P1", href: "/pipeline?band=P0,P1", description: "Highest priority only" },
      { title: "Escalated", href: "/pipeline?urgency=critical", description: "Critical urgency" },
    ],
  },
  {
    title: "Board",
    path: "/board",
    description: "Kanban-style pipeline view for fast visual triage.",
    icon: "board",
    group: "views",
    presetFilters: [
      { title: "All issues", href: "/board", description: "Everything across columns" },
      { title: "My board", href: "/board?assignee=me", description: "Only issues assigned to you" },
      { title: "Unassigned", href: "/board?assignee=unassigned", description: "Needs an owner" },
      { title: "High priority", href: "/board?band=P0,P1", description: "P0 + P1 only" },
    ],
  },
  {
    title: "Calendar",
    path: "/calendar",
    description: "Due dates, sprints, and milestones at a glance.",
    icon: "calendar",
    group: "views",
  },
  {
    title: "My Work",
    path: "/my-work",
    description: "Everything assigned to you, grouped by status.",
    icon: "my-work",
    group: "views",
  },

  // Planning
  {
    title: "Roadmap",
    path: "/roadmap",
    description: "Milestone timeline with progress across the quarter.",
    icon: "roadmap",
    group: "planning",
    presetFilters: [
      { title: "Timeline", href: "/roadmap", description: "Week-by-week milestone grid" },
      { title: "Manage milestones", href: "/roadmap/milestones", description: "Create, edit, and archive milestones" },
    ],
  },
  {
    title: "Goals",
    path: "/goals",
    description: "Strategic goals tied to product outcomes.",
    icon: "goals",
    group: "planning",
  },

  // Intelligence
  {
    title: "Customers",
    path: "/customers",
    description: "Accounts and their issue footprint, value, and health.",
    icon: "customers",
    group: "intelligence",
    presetFilters: [
      { title: "All customers", href: "/customers", description: "Full directory" },
      { title: "Enterprise", href: "/customers?tier=enterprise", description: "Top-tier accounts" },
      { title: "Mid-market", href: "/customers?tier=mid_market", description: "Mid-sized accounts" },
      { title: "SMB", href: "/customers?tier=smb", description: "Small business accounts" },
      { title: "Health dashboard", href: "/customers/health", description: "Health across all accounts" },
      { title: "Impact view", href: "/customers/impact", description: "Revenue impact of issues" },
    ],
  },
  {
    title: "Reports",
    path: "/reports",
    description: "Velocity, cycle time, SLA, shipped work, and custom reports.",
    icon: "reports",
    group: "intelligence",
    presetFilters: [
      { title: "All reports", href: "/reports", description: "Index of all reports" },
      { title: "Velocity", href: "/reports/velocity", description: "Throughput over time" },
      { title: "Burndown", href: "/reports/burndown", description: "Sprint burndown" },
      { title: "Cycle time", href: "/reports/cycle-time", description: "Avg time to resolution" },
      { title: "Shipped", href: "/reports/shipped", description: "What shipped recently" },
      { title: "SLA", href: "/reports/sla", description: "SLA compliance" },
      { title: "Custom builder", href: "/reports/builder", description: "Ad-hoc report builder" },
    ],
  },
  {
    title: "Team",
    path: "/team",
    description: "Standup, on-call, and workload across the team.",
    icon: "team",
    group: "intelligence",
    presetFilters: [
      { title: "Overview", href: "/team", description: "Team health at a glance" },
      { title: "Standup", href: "/team/standup", description: "Daily standup view" },
      { title: "On-call", href: "/team/oncall", description: "Current rotation" },
      { title: "Workload", href: "/team/workload", description: "Per-person load" },
    ],
  },

  // System
  {
    title: "Automation",
    path: "/automation",
    description: "Rule-based routing, auto-tagging, and workflow actions.",
    icon: "automation",
    group: "system",
    roles: ["admin", "member"],
  },
  {
    title: "Activity",
    path: "/activity",
    description: "Global event feed across the workspace.",
    icon: "activity",
    group: "system",
  },
  {
    title: "Dashboard",
    path: "/dashboard",
    description: "Read-only stakeholder summary — active issues, priorities, recent changes.",
    icon: "dashboard",
    group: "system",
  },
  {
    title: "Themes",
    path: "/themes",
    description: "Internal concept tags that group related issues.",
    icon: "themes",
    group: "system",
  },
  {
    title: "Users",
    path: "/settings/users",
    description: "Invite and manage team members, roles, and access.",
    icon: "settings",
    group: "system",
    roles: ["admin"],
  },
  {
    title: "Notifications",
    path: "/settings/notifications",
    description: "Per-user notification preferences.",
    icon: "notifications",
    group: "system",
  },
  {
    title: "Appearance",
    path: "/settings/appearance",
    description: "Theme and layout preferences.",
    icon: "appearance",
    group: "system",
  },
]

export const iccRouteGroupLabels: Record<IccRouteGroup, string> = {
  views: "Views",
  planning: "Planning",
  intelligence: "Intelligence",
  system: "System",
}

function normalizePath(path: string) {
  return path.replace(/\/$/, "") || "/"
}

export function getRouteByPathname(pathname: string): IccRoute | null {
  const normalizedPath = normalizePath(pathname)

  // Prefer exact match, fallback to prefix match (but skip root "/")
  const exact = iccRoutes.find((route) => route.path === normalizedPath)
  if (exact) return exact

  return (
    iccRoutes.find(
      (route) =>
        route.path !== "/" && normalizedPath.startsWith(`${route.path}/`)
    ) ?? null
  )
}

export function getRoutesByGroup(group: IccRouteGroup): IccRoute[] {
  return iccRoutes.filter((route) => route.group === group)
}

export function filterRoutesByRole(
  routes: IccRoute[],
  role: "admin" | "member" | "viewer"
): IccRoute[] {
  return routes.filter((route) => !route.roles || route.roles.includes(role))
}
