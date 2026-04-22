"use client"

import * as React from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  IconDots,
  IconSearch,
} from "@tabler/icons-react"

import { AppSidebar } from "@/components/app/app-sidebar"
import { CommandPalette } from "@/components/app/command-palette"
import { FloatingThemeToggle } from "@/components/app/floating-theme-toggle"
import { NavUser } from "@/components/app/nav-user"
import { NotificationCenter } from "@/components/app/notification-center"
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcut"
import { getRouteByPathname } from "@/lib/icc-routes"
import type { IssueStatus } from "@/lib/domain"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"

type AppShellDisplayMode = "default" | "issue-detail"

function getShellDisplayMode(pathname: string): AppShellDisplayMode {
  return /^\/issues\/[^/]+$/.test(pathname) ? "issue-detail" : "default"
}

export function AppShell({
  role,
  name,
  children,
}: {
  role: string
  name: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = React.useTransition()
  const { user: clerkUser } = useUser()

  const activeRoute = getRouteByPathname(pathname)
  const shellDisplayMode = getShellDisplayMode(pathname)
  const isFullWidthListPage =
    pathname === "/pipeline" ||
    pathname === "/inbox" ||
    pathname === "/board" ||
    pathname === "/my-work" ||
    pathname.startsWith("/customers")
  const [sidebarOpen, setSidebarOpen] = React.useState(true)

  React.useEffect(() => {
    if (shellDisplayMode === "issue-detail") {
      setSidebarOpen(false)
    }
  }, [shellDisplayMode])

  const handleSidebarOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      setSidebarOpen(shellDisplayMode === "issue-detail" ? false : nextOpen)
    },
    [shellDisplayMode]
  )

  const [createDialogOpen, setCreateDialogOpen] = React.useState(false)
  const [createDialogDefaultStatus, setCreateDialogDefaultStatus] =
    React.useState<IssueStatus>("inbox")

  const openCreateDialog = React.useCallback(
    (status: IssueStatus = "inbox") => {
      setCreateDialogDefaultStatus(status)
      setCreateDialogOpen(true)
    },
    []
  )

  const navigate = React.useCallback(
    (path: string) => startTransition(() => router.push(path)),
    [router]
  )

  const shortcuts = React.useMemo(
    () => [
      {
        key: "i",
        meta: true,
        callback: () => openCreateDialog(),
        preventDefault: true,
      },
      {
        key: "1",
        meta: true,
        callback: () => navigate("/inbox"),
        preventDefault: true,
      },
      {
        key: "2",
        meta: true,
        callback: () => navigate("/pipeline"),
        preventDefault: true,
      },
      {
        key: "3",
        meta: true,
        callback: () => navigate("/board"),
        preventDefault: true,
      },
    ],
    [navigate, openCreateDialog]
  )

  useKeyboardShortcuts(shortcuts)

  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? ""
  const userAvatar = clerkUser?.imageUrl

  return (
    <SidebarProvider
      open={shellDisplayMode === "issue-detail" ? false : sidebarOpen}
      onOpenChange={handleSidebarOpenChange}
      style={
        {
          "--sidebar-width": "320px",
        } as React.CSSProperties
      }
    >
      <AppSidebar
        displayMode={shellDisplayMode}
        role={role as "admin" | "member" | "viewer"}
        onCreateIssue={() => openCreateDialog()}
      />
      <SidebarInset className="h-svh overflow-hidden">
        {shellDisplayMode === "default" ? (
          <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 bg-background p-4">
            <div className="flex min-w-0 items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb className="min-w-0">
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <span className="text-muted-foreground">Workspace</span>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>
                      {activeRoute?.title ?? "Dashboard"}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex h-9 items-center gap-2 sm:gap-3">
              <div className="hidden items-center gap-3 sm:flex">
                <Button
                  variant="outline"
                  size="icon-sm"
                  className="size-9 rounded-full p-0"
                  aria-label="Search"
                  title="Search (⌘K)"
                  onClick={() => {
                    // CommandPalette is triggered by Cmd+K keyboard shortcut
                    const event = new KeyboardEvent("keydown", {
                      key: "k",
                      metaKey: true,
                    })
                    window.dispatchEvent(event)
                  }}
                >
                  <IconSearch className="size-4" />
                  <span className="sr-only">Search</span>
                </Button>
                <NotificationCenter />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    className="size-9 rounded-full p-0 sm:hidden"
                    aria-label="Header actions"
                  >
                    <IconDots className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-44 sm:hidden">
                  <DropdownMenuItem>
                    <IconSearch className="size-4" />
                    Search
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <FloatingThemeToggle />
              <Separator
                orientation="vertical"
                className="data-[orientation=vertical]:h-5"
              />
              <NavUser
                user={{
                  name,
                  email: userEmail,
                  role,
                  avatar: userAvatar,
                }}
              />
            </div>
          </header>
        ) : (
          <header className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-4 bg-background px-4 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5"
              asChild
            >
              <Link href="/pipeline">
                <span aria-hidden>←</span>
                <span>Back to Pipeline</span>
              </Link>
            </Button>
            <div className="flex h-9 items-center gap-2 sm:gap-3">
              <NotificationCenter />
              <FloatingThemeToggle />
              <NavUser
                user={{
                  name,
                  email: userEmail,
                  role,
                  avatar: userAvatar,
                }}
              />
            </div>
          </header>
        )}
        <main
          className={cn(
            "mx-auto flex min-w-0 w-full flex-1 flex-col",
            shellDisplayMode === "issue-detail"
              ? "h-svh min-h-0 max-w-none gap-3 overflow-y-auto px-3 py-3 sm:gap-4 sm:px-4 sm:py-4 lg:px-8"
              : isFullWidthListPage
                ? "min-h-0 gap-4 overflow-hidden p-4 sm:p-6 lg:p-8"
                : "max-w-[1440px] min-h-0 gap-4 overflow-y-auto p-4 sm:p-6 lg:p-8"
          )}
        >
          {children}
        </main>
      </SidebarInset>
      <CommandPalette onCreateIssue={openCreateDialog} />
      <CreateIssueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultStatus={createDialogDefaultStatus}
      />
    </SidebarProvider>
  )
}
