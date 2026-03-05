"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, Kanban, Table2 } from "lucide-react";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const views = [
  { value: "table", icon: Table2, label: "Table", href: "/pipeline" },
  { value: "board", icon: Kanban, label: "Board", href: "/board" },
  { value: "calendar", icon: Calendar, label: "Calendar", href: "/calendar" },
] as const;

export function ViewSwitcher({ current }: { current: "table" | "board" | "calendar" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const onValueChange = (value: string) => {
    if (!value) return;
    const view = views.find((v) => v.value === value);
    if (!view) return;
    const params = searchParams.toString();
    router.push(params ? `${view.href}?${params}` : view.href);
  };

  return (
    <ToggleGroup type="single" value={current} onValueChange={onValueChange} size="sm">
      {views.map((view) => (
        <ToggleGroupItem key={view.value} value={view.value} aria-label={view.label}>
          <view.icon className="h-4 w-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
