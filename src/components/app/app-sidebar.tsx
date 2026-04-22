"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  IconActivity,
  IconBell,
  IconBook,
  IconCalendar,
  IconChartBar,
  IconClipboardList,
  IconColorSwatch,
  IconCommand,
  IconDashboard,
  IconInbox,
  IconLayoutKanban,
  IconMap,
  IconPalette,
  IconPlus,
  IconSettings,
  IconSettingsAutomation,
  IconTable,
  IconTarget,
  IconUser,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  iccRoutes,
  getRouteByPathname,
  iccRouteGroupLabels,
  type IccRoute,
  type IccRouteGroup,
  type IccRouteIconKey,
} from "@/lib/icc-routes"
import { cn } from "@/lib/utils"

function renderRouteIcon(icon: IccRouteIconKey) {
  switch (icon) {
    case "inbox":
      return <IconInbox />
    case "pipeline":
      return <IconTable />
    case "board":
      return <IconLayoutKanban />
    case "calendar":
      return <IconCalendar />
    case "my-work":
      return <IconUser />
    case "roadmap":
      return <IconMap />
    case "goals":
      return <IconTarget />
    case "customers":
      return <IconUsersGroup />
    case "reports":
      return <IconChartBar />
    case "team":
      return <IconUsers />
    case "automation":
      return <IconSettingsAutomation />
    case "activity":
      return <IconActivity />
    case "dashboard":
      return <IconDashboard />
    case "themes":
      return <IconColorSwatch />
    case "settings":
      return <IconSettings />
    case "notifications":
      return <IconBell />
    case "appearance":
      return <IconPalette />
    default:
      return <IconBook />
  }
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  displayMode?: "default" | "issue-detail"
  role?: "admin" | "member" | "viewer"
  onCreateIssue?: () => void
}

export function AppSidebar({
  displayMode = "default",
  role = "member",
  onCreateIssue,
  ...props
}: AppSidebarProps) {
  const pathname = usePathname()
  const { setOpen, state } = useSidebar()

  const matchedRoute = React.useMemo(
    () => getRouteByPathname(pathname) ?? iccRoutes[0],
    [pathname]
  )

  const isSidebarCollapsed = state === "collapsed"
  const shouldShowSecondaryPanel =
    displayMode !== "issue-detail" && !isSidebarCollapsed

  // Group routes by group for the primary rail.
  const railGroups = React.useMemo(() => {
    const groups: { key: IccRouteGroup; label: string; routes: IccRoute[] }[] = (
      ["views", "planning", "intelligence", "system"] as IccRouteGroup[]
    ).map((group) => ({
      key: group,
      label: iccRouteGroupLabels[group],
      routes: iccRoutes.filter(
        (route) =>
          route.group === group &&
          (!route.roles || route.roles.includes(role))
      ),
    }))
    return groups
  }, [role])

  return (
    <Sidebar
      collapsible="icon"
      className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      {...props}
    >
      {/* Primary icon rail */}
      <Sidebar
        collapsible="none"
        className="w-[calc(var(--sidebar-width-icon)+1px)]! shrink-0 border-r py-2"
      >
        <SidebarHeader className="items-center">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                className="size-8! p-0! justify-center overflow-hidden rounded-xl"
                render={<Link href="/inbox" />}
                tooltip="Issue Command Center"
              >
                <span
                  className="flex aspect-square size-8 items-center justify-center rounded-xl text-primary-foreground btn-primary-chrome"
                >
                  <IconCommand className="size-4" />
                </span>
                <span className="sr-only">Issue Command Center</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="gap-0">
          {railGroups
            .filter((group) => group.routes.length > 0)
            .map((group, idx) => (
              <React.Fragment key={group.key}>
                {idx > 0 ? (
                  <SidebarSeparator className="my-1 mx-2 w-auto" />
                ) : null}
                <SidebarGroup className="p-1.5">
                  <SidebarGroupLabel className="sr-only">
                    {group.label}
                  </SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {group.routes.map((route) => (
                        <SidebarMenuItem key={route.path}>
                          <SidebarMenuButton
                            render={<Link href={route.path} />}
                            tooltip={{
                              children: route.title,
                              hidden: false,
                            }}
                            onClick={() => setOpen(true)}
                            isActive={matchedRoute.path === route.path}
                            className="size-8! p-0! mx-auto justify-center text-muted-foreground data-active:text-sidebar-accent-foreground [&_svg]:text-muted-foreground data-active:[&_svg]:text-sidebar-accent-foreground"
                          >
                            {renderRouteIcon(route.icon)}
                            <span className="sr-only">{route.title}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </React.Fragment>
            ))}
        </SidebarContent>
        {onCreateIssue ? (
          <div className="border-t p-2">
            <Button
              variant="default"
              size="icon-sm"
              className="size-8 w-full rounded-xl"
              onClick={onCreateIssue}
              aria-label="Create issue"
              title="Create issue (⌘I)"
            >
              <IconPlus className="size-4" />
            </Button>
          </div>
        ) : null}
      </Sidebar>

      {/* Secondary context panel */}
      {shouldShowSecondaryPanel ? (
        <div
          aria-hidden={isSidebarCollapsed}
          className={cn(
            "hidden h-full min-w-0 shrink-0 overflow-hidden transition-[opacity,transform] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none md:block",
            "w-[calc(var(--sidebar-width)-var(--sidebar-width-icon)-1px)]",
            isSidebarCollapsed
              ? "pointer-events-none -translate-x-3 opacity-0"
              : "translate-x-0 opacity-100"
          )}
        >
          <Sidebar collapsible="none" className="h-full w-full min-w-0">
            <SecondaryPanel route={matchedRoute} />
          </Sidebar>
        </div>
      ) : null}
    </Sidebar>
  )
}

function SecondaryPanel({ route }: { route: IccRoute }) {
  const pathname = usePathname()
  const presets = route.presetFilters ?? []
  const hasPresets = presets.length > 0

  return (
    <>
      <SidebarHeader className="gap-1.5 border-b px-4 py-3.5">
        <div className="flex w-full items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent/60 text-sidebar-accent-foreground [&>svg]:size-4">
            {renderRouteIcon(route.icon)}
          </span>
          <span className="truncate text-sm font-semibold text-foreground">
            {route.title}
          </span>
        </div>
        {route.description ? (
          <p className="text-xs leading-snug text-muted-foreground">
            {route.description}
          </p>
        ) : null}
      </SidebarHeader>
      <SidebarContent>
        {hasPresets ? (
          <SidebarGroup className="px-2 py-3">
            <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-wide text-muted-foreground/80">
              Quick filters
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-col gap-0.5">
                {presets.map((preset) => {
                  // Active if the current pathname + search matches this preset exactly (prefix match).
                  const active =
                    pathname === preset.href ||
                    (typeof window !== "undefined" &&
                      typeof preset.href === "string" &&
                      window.location.pathname + window.location.search ===
                        preset.href)

                  return (
                    <Link
                      key={preset.title}
                      href={preset.href}
                      className={cn(
                        "group relative flex flex-col gap-0.5 rounded-xl px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <span className="truncate text-sm font-medium leading-tight">
                        {preset.title}
                      </span>
                      {preset.description ? (
                        <span
                          className={cn(
                            "truncate text-xs leading-tight",
                            active
                              ? "text-sidebar-accent-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {preset.description}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : (
          <SidebarGroup className="px-4 py-6">
            <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed p-4 text-sm">
              <IconClipboardList className="size-5 text-muted-foreground" />
              <p className="font-medium text-foreground">
                {route.title} workspace
              </p>
              <p className="text-xs leading-5 text-muted-foreground">
                Use the main view to explore {route.title.toLowerCase()}. Filters
                and sub-views will appear here as they&rsquo;re configured.
              </p>
            </div>
          </SidebarGroup>
        )}
      </SidebarContent>
    </>
  )
}
