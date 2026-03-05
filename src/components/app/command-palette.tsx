"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import {
  Calendar,
  FileText,
  House,
  Kanban,
  Layers,
  ListTodo,
  Moon,
  PlusCircle,
  Sun,
  Table2,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { api } from "@/lib/convex-api";
import { useDebouncedCallback } from "@/hooks/use-debounced-callback";

export function CommandPalette({ onCreateIssue }: { onCreateIssue?: () => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();
  const { setTheme, resolvedTheme } = useTheme();

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const updateSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 300);

  const issues = useQuery(
    api.issues.globalSearch,
    debouncedSearch.length >= 2 ? { query: debouncedSearch, limit: 10 } : "skip",
  );

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      setSearch("");
      setDebouncedSearch("");
      router.push(path);
    },
    [router],
  );

  const navItems = [
    { label: "Inbox", href: "/inbox", icon: ListTodo, shortcut: "1" },
    { label: "Pipeline", href: "/pipeline", icon: Table2, shortcut: "2" },
    { label: "Board", href: "/board", icon: Kanban, shortcut: "3" },
    { label: "Calendar", href: "/calendar", icon: Calendar },
    { label: "My Work", href: "/my-work", icon: User },
    { label: "Dashboard", href: "/dashboard", icon: House },
    { label: "Themes", href: "/themes", icon: Layers },
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search issues, navigate, or run actions..."
        value={search}
        onValueChange={(value) => {
          setSearch(value);
          updateSearch(value);
        }}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        <CommandGroup heading="Navigation">
          {navItems.map((item) => (
            <CommandItem key={item.href} onSelect={() => navigate(item.href)}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
              {item.shortcut ? <CommandShortcut>Cmd+{item.shortcut}</CommandShortcut> : null}
            </CommandItem>
          ))}
        </CommandGroup>

        {issues && issues.length > 0 ? (
          <CommandGroup heading="Issues">
            {issues.map((issue: any) => (
              <CommandItem key={issue._id} onSelect={() => navigate(`/issues/${issue._id}`)}>
                <FileText className="mr-2 h-4 w-4" />
                <span className="flex-1 truncate">{issue.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">{issue.priorityBand?.toUpperCase()}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}

        <CommandGroup heading="Actions">
          <CommandItem
            onSelect={() => {
              setOpen(false);
              onCreateIssue?.();
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Issue
            <CommandShortcut>Cmd+I</CommandShortcut>
          </CommandItem>
          <CommandItem
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {resolvedTheme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
            Toggle {resolvedTheme === "dark" ? "Light" : "Dark"} Mode
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
