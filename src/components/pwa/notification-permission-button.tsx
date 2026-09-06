"use client";

import { BellOff, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useNotificationPermission } from "@/hooks/use-notification-permission";
import { cn } from "@/lib/utils";

interface NotificationPermissionButtonProps {
  /** What the alerts are for, e.g. "new orders" — used in labels and toasts. */
  subject: string;
  /** Icon-only for toolbars, or a labelled button for page content. */
  variant?: "icon" | "inline";
  className?: string;
}

/**
 * Asks for system-notification permission on click (browsers require a user
 * gesture) and reflects the answer. Once granted or blocked the browser owns
 * the setting, so the button just explains where to change it.
 */
export function NotificationPermissionButton({
  subject,
  variant = "inline",
  className,
}: NotificationPermissionButtonProps) {
  const { permission, request } = useNotificationPermission();
  if (permission === "unsupported") return null;

  const granted = permission === "granted";
  const denied = permission === "denied";
  const title = granted
    ? `Alerts for ${subject} are on`
    : denied
      ? `Alerts for ${subject} are blocked — allow notifications in your browser's site settings`
      : `Get alerts for ${subject}`;

  async function handleClick() {
    if (granted) {
      toast.info(`Alerts for ${subject} are on.`, {
        description: "Turn them off from the site settings in your browser.",
      });
      return;
    }
    const next = await request();
    if (next === "granted") toast.success(`You'll be alerted about ${subject}.`);
    else if (next === "denied") toast.error("Notifications are blocked for this site.");
  }

  const Icon = granted ? BellRing : BellOff;

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label={title}
        aria-pressed={granted}
        title={title}
        disabled={denied}
        onClick={handleClick}
        className={cn(granted && "text-primary", className)}
      >
        <Icon />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={granted ? "secondary" : "outline"}
      size="sm"
      disabled={denied}
      title={title}
      onClick={handleClick}
      className={className}
    >
      <Icon data-icon="inline-start" aria-hidden className={cn(granted && "text-primary")} />
      {granted ? "Alerts on" : denied ? "Alerts blocked" : `Alert me about ${subject}`}
    </Button>
  );
}
