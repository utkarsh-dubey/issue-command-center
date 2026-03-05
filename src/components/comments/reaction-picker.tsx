"use client";

import { useMutation } from "convex/react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { api } from "@/lib/convex-api";

const REACTIONS = ["👍", "❤️", "👀", "🚀", "🤔", "🎉"];

export function ReactionPicker({
  commentId,
  reactions,
  currentUserId,
}: {
  commentId: string;
  reactions: { emoji: string; userId: string }[];
  currentUserId?: string;
}) {
  const toggle = useMutation(api.reactions.toggle);

  const grouped = new Map<string, string[]>();
  for (const r of reactions) {
    const users = grouped.get(r.emoji) ?? [];
    users.push(r.userId);
    grouped.set(r.emoji, users);
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {Array.from(grouped.entries()).map(([emoji, userIds]) => {
        const hasReacted = currentUserId ? userIds.includes(currentUserId) : false;
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => toggle({ commentId: commentId as any, emoji })}
            className={`rounded-full border px-2 py-0.5 text-xs transition ${hasReacted ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
          >
            {emoji} {userIds.length}
          </button>
        );
      })}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-xs">+</Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-1" align="start">
          <div className="flex gap-1">
            {REACTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className="rounded p-1 text-lg hover:bg-muted"
                onClick={() => toggle({ commentId: commentId as any, emoji })}
              >
                {emoji}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
