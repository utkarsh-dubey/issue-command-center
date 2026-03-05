"use client";

import { useQuery } from "convex/react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { api } from "@/lib/convex-api";

export function PresenceIndicator({ issueId, currentUserId }: { issueId: string; currentUserId?: string }) {
  const presence = useQuery(api.presence.getActiveOnIssue, { issueId: issueId as any });
  const users = useQuery(api.users.listAssignable, {});

  const others = (presence ?? []).filter((p: any) => p.userId !== currentUserId);

  if (others.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {others.slice(0, 5).map((p: any) => {
        const user = (users ?? []).find((u: any) => u._id === p.userId);
        const initials = user?.name
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase() ?? "?";

        return (
          <Tooltip key={p._id}>
            <TooltipTrigger>
              <Avatar className="h-6 w-6 border-2 border-card">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{user?.name ?? "Someone"} is viewing</TooltipContent>
          </Tooltip>
        );
      })}
      {others.length > 5 ? (
        <Avatar className="h-6 w-6 border-2 border-card">
          <AvatarFallback className="bg-muted text-xs">+{others.length - 5}</AvatarFallback>
        </Avatar>
      ) : null}
    </div>
  );
}
