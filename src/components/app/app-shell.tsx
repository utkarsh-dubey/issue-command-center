"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { CommandPalette } from "@/components/app/command-palette";
import { NotificationCenter } from "@/components/app/notification-center";
import { SidebarNav } from "@/components/app/sidebar-nav";
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcut";
import type { IssueStatus } from "@/lib/domain";

export function AppShell({
  role,
  name,
  children,
}: {
  role: string;
  name: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogDefaultStatus, setCreateDialogDefaultStatus] = useState<IssueStatus>("inbox");

  const openCreateDialog = useCallback((status: IssueStatus = "inbox") => {
    setCreateDialogDefaultStatus(status);
    setCreateDialogOpen(true);
  }, []);

  const shortcuts = useMemo(
    () => [
      { key: "i", meta: true, callback: () => openCreateDialog(), preventDefault: true },
      { key: "1", meta: true, callback: () => router.push("/inbox"), preventDefault: true },
      { key: "2", meta: true, callback: () => router.push("/pipeline"), preventDefault: true },
      { key: "3", meta: true, callback: () => router.push("/board"), preventDefault: true },
    ],
    [router, openCreateDialog],
  );

  useKeyboardShortcuts(shortcuts);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <header className="z-20 shrink-0 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-3">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <SidebarNav onCreateIssue={openCreateDialog} />
              </SheetContent>
            </Sheet>
            <div className="rounded-md bg-primary px-2 py-1 text-xs font-bold tracking-[0.14em] text-primary-foreground">
              ICC
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold">Issue Command Center</p>
              <p className="text-xs text-muted-foreground">Standalone product ops system</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <NotificationCenter />
            <Badge variant="secondary" className="hidden sm:inline-flex">
              {role}
            </Badge>
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{name}</p>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full min-h-0 flex-1 max-w-[1440px] grid-cols-1 gap-6 px-4 py-6 md:grid-cols-[240px_1fr] md:px-6">
        <aside className="hidden overflow-y-auto rounded-2xl border border-border bg-card p-3 md:block">
          <SidebarNav onCreateIssue={openCreateDialog} />
        </aside>
        <main className="overflow-y-auto">{children}</main>
      </div>

      <CommandPalette onCreateIssue={openCreateDialog} />
      <CreateIssueDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        defaultStatus={createDialogDefaultStatus}
      />
    </div>
  );
}
