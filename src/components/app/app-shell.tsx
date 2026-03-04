"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Activity, Bell, House, Layers, ListTodo, Settings, Table2, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/inbox", label: "Inbox", icon: ListTodo },
  { href: "/pipeline", label: "Pipeline", icon: Table2 },
  { href: "/dashboard", label: "Dashboard", icon: House },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/themes", label: "Themes", icon: Layers },
  { href: "/settings/users", label: "Users", icon: Users },
  { href: "/settings/notifications", label: "Notifications", icon: Bell },
];

export function AppShell({
  role,
  name,
  children,
}: {
  role: string;
  name: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f2f6f8_0%,#f9fbfd_36%,#ffffff_100%)] text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold tracking-[0.14em] text-white">ICC</div>
            <div>
              <p className="text-sm font-semibold">Issue Command Center</p>
              <p className="text-xs text-slate-500">Standalone product ops system</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-cyan-50 text-cyan-900">
              {role}
            </Badge>
            <div className="text-right">
              <p className="text-sm font-medium">{name}</p>
            </div>
            <UserButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[240px_1fr] gap-6 px-6 py-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="px-2 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Workspace</p>
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-medium text-slate-500">Cadence</p>
            <p className="mt-1 text-sm font-semibold text-slate-800">Weekly triage + monthly roadmap</p>
          </div>
          <Link
            href="/settings/notifications"
            className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </aside>
        <main className="min-h-[70vh]">{children}</main>
      </div>
    </div>
  );
}
