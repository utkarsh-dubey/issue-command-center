"use client";

import { useQuery } from "convex/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/convex-api";

export function TemplatePicker({
  value,
  onValueChange,
}: {
  value: string;
  onValueChange: (templateId: string) => void;
}) {
  const templates = useQuery(api.templates.list, {});

  if (!templates || templates.length === 0) return null;

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Use template..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No template</SelectItem>
        {templates.map((t: any) => (
          <SelectItem key={t._id} value={t._id}>
            {t.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
