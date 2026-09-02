"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/hooks/use-notifications";
import { useSession } from "@/hooks/use-session";
import { apiMutate } from "@/lib/api/fetcher";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationsMenu() {
  const { user } = useSession();
  const { data: notifications, mutate } = useNotifications(Boolean(user));

  if (!user) return null;

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  async function markAllRead() {
    if (unread === 0) return;
    try {
      await apiMutate("/api/notifications", { method: "PATCH" });
      await mutate();
    } catch {
      // Non-critical — the badge simply stays until the next successful sync.
    }
  }

  return (
    <DropdownMenu onOpenChange={(open) => open && markAllRead()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {!notifications?.length ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </p>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((n) => {
              const content = (
                <div
                  className={cn(
                    "flex flex-col gap-0.5 px-3 py-2 text-sm",
                    !n.isRead && "bg-primary/5",
                  )}
                >
                  <span className="font-medium">{n.title}</span>
                  <span className="text-muted-foreground">{n.body}</span>
                  <span className="text-xs text-muted-foreground/70">
                    {formatDate(n.createdAt)}
                  </span>
                </div>
              );
              return n.href ? (
                <Link key={n.id} href={n.href} className="block hover:bg-accent">
                  {content}
                </Link>
              ) : (
                <div key={n.id}>{content}</div>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
