"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";

import { api } from "@/lib/convex-api";

export function usePresence(issueId?: string, page?: string) {
  const heartbeat = useMutation(api.presence.heartbeat);

  useEffect(() => {
    let active = true;

    const send = () => {
      if (!active) return;
      void heartbeat({ issueId, page }).catch(() => {});
    };

    send();
    const interval = setInterval(send, 30_000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [heartbeat, issueId, page]);
}
