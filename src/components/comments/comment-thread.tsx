"use client";

import { Badge } from "@/components/ui/badge";
import { ReactionPicker } from "@/components/comments/reaction-picker";
import { relativeTime } from "@/lib/date";

interface Comment {
  _id: string;
  body: string;
  visibility?: "internal" | "external";
  reactions?: Array<{ emoji: string; userId: string }>;
  editedAt?: number;
  createdAt: number;
  authorName?: string;
}

export function CommentThread({ comments }: { comments: Comment[] }) {
  return (
    <div className="space-y-3">
      {comments.map((entry) => (
        <div key={entry._id} className="rounded-lg border border-border p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {entry.authorName ? (
                <span className="text-sm font-medium">{entry.authorName}</span>
              ) : null}
              <span className="text-xs text-muted-foreground">{relativeTime(entry.createdAt)}</span>
              {entry.editedAt ? <span className="text-xs text-muted-foreground">(edited)</span> : null}
            </div>
            {entry.visibility === "external" ? (
              <Badge variant="outline" className="text-xs">External</Badge>
            ) : null}
          </div>
          <p className="mt-1 text-sm">{entry.body}</p>
          <div className="mt-2">
            <ReactionPicker commentId={entry._id} reactions={entry.reactions ?? []} />
          </div>
        </div>
      ))}
      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet.</p>
      ) : null}
    </div>
  );
}
