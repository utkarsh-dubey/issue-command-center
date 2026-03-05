"use client";

import { memo } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { Bell, Check } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/convex-api";
import { relativeTime } from "@/lib/date";

export const NotificationCenter = memo(function NotificationCenter() {
  const router = useRouter();
  const unreadCount = useQuery(api.notifications.getUnreadCount, {});
  const notifications = useQuery(api.notifications.listForUser, { limit: 20 });
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);

  const onMarkAllRead = async () => {
    try {
      await markAllRead({});
    } catch {
      toast.error("Failed to mark all as read");
    }
  };

  const onClickNotification = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await markRead({ notificationId: notification._id });
      } catch {}
    }
    if (notification.issueId) {
      router.push(`/issues/${notification.issueId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount && unreadCount > 0 ? (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 rounded-full bg-destructive px-1 text-[10px] text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b p-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount && unreadCount > 0 ? (
            <Button variant="ghost" size="sm" onClick={onMarkAllRead}>
              <Check className="mr-1 h-3 w-3" />
              Mark all read
            </Button>
          ) : null}
        </div>
        <ScrollArea className="max-h-80">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y">
              {notifications.map((n: any) => (
                <button
                  key={n._id}
                  type="button"
                  className={`w-full p-3 text-left text-sm transition hover:bg-muted ${n.isRead ? "opacity-60" : ""}`}
                  onClick={() => onClickNotification(n)}
                >
                  <p className="font-medium">{n.title}</p>
                  {n.body ? <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p> : null}
                  <p className="mt-1 text-xs text-muted-foreground">{relativeTime(n.createdAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="p-4 text-center text-sm text-muted-foreground">No notifications</p>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
});
