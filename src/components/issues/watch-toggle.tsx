"use client";

import { useMutation, useQuery } from "convex/react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/convex-api";

export function WatchToggle({ issueId }: { issueId: string }) {
  const isSubscribed = useQuery(api.subscriptions.isSubscribed, { issueId: issueId as any });
  const subscribe = useMutation(api.subscriptions.subscribe);
  const unsubscribe = useMutation(api.subscriptions.unsubscribe);

  const onClick = () => {
    if (isSubscribed) {
      void unsubscribe({ issueId: issueId as any });
    } else {
      void subscribe({ issueId: issueId as any });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      {isSubscribed ? (
        <>
          <Eye className="mr-1 h-3.5 w-3.5" />
          Watching
        </>
      ) : (
        <>
          <EyeOff className="mr-1 h-3.5 w-3.5" />
          Watch
        </>
      )}
    </Button>
  );
}
