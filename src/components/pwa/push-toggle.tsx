"use client";

import { BellOff, BellRing, Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { usePush } from "@/hooks/use-push";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

interface PushToggleProps {
  /** `button`: one icon button for app bars. `row`: labelled switch for settings and menus. */
  variant?: "button" | "row";
  className?: string;
}

const COPY = {
  subscribed: { label: "Notifications on", hint: "Order updates reach this device even when the app is closed." },
  unsubscribed: { label: "Turn on notifications", hint: "Get order updates on this device even when the app is closed." },
  denied: { label: "Notifications blocked", hint: "Allow notifications for this site in your browser settings, then try again." },
  "needs-install": { label: "Install to get notifications", hint: "On iPhone, add KichuLagbe to your Home Screen (Share → Add to Home Screen) and turn notifications on from there." },
} as const;

/**
 * Device-level push notifications control. Hidden when the browser has no
 * push support or the user is signed out; explains itself when blocked or,
 * on iPhone, when the app must be installed first.
 */
export function PushToggle({ variant = "row", className }: PushToggleProps) {
  const { user } = useSession();
  const { status, busy, toggle } = usePush(Boolean(user));

  if (!user || status === null || status === "unsupported") return null;
  const copy = COPY[status];
  const on = status === "subscribed";
  const canToggle = status === "subscribed" || status === "unsubscribed";

  if (variant === "button") {
    return (
      <Button
        type="button"
        variant={on ? "secondary" : "outline"}
        size="sm"
        disabled={busy || !canToggle}
        aria-pressed={on}
        title={copy.hint}
        onClick={() => void toggle()}
        className={className}
      >
        {busy ? (
          <Loader2 className="animate-spin" aria-hidden />
        ) : status === "needs-install" ? (
          <Smartphone aria-hidden />
        ) : on ? (
          <BellRing aria-hidden />
        ) : (
          <BellOff aria-hidden />
        )}
        <span className="hidden sm:inline">{on ? "Alerts on" : status === "denied" ? "Alerts blocked" : "Enable alerts"}</span>
      </Button>
    );
  }

  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-sm font-medium">
          {status === "needs-install" ? (
            <Smartphone className="size-4 text-primary" aria-hidden />
          ) : on ? (
            <BellRing className="size-4 text-primary" aria-hidden />
          ) : (
            <BellOff className="size-4 text-muted-foreground" aria-hidden />
          )}
          {copy.label}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{copy.hint}</p>
      </div>
      {canToggle && (
        <Switch
          checked={on}
          disabled={busy}
          onCheckedChange={() => void toggle()}
          aria-label={on ? "Turn off notifications on this device" : "Turn on notifications on this device"}
        />
      )}
    </div>
  );
}
