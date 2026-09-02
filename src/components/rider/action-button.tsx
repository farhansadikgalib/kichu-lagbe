"use client";

import { useState, type ComponentProps, type ReactNode } from "react";
import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionButtonProps
  extends Pick<ComponentProps<typeof Button>, "variant" | "size" | "className" | "aria-label"> {
  /** Async mutation to run — the button disables itself while it is pending. */
  onAction: () => Promise<void>;
  children: ReactNode;
}

/**
 * Mutation button for the rider console: shows a spinner and disables itself
 * while the action is in flight so riders can't double-fire a claim/update.
 * Error handling (toast) belongs to the caller's `onAction`.
 */
export function ActionButton({
  onAction,
  children,
  className,
  size = "lg",
  ...props
}: ActionButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    try {
      await onAction();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size={size}
      disabled={pending}
      aria-busy={pending}
      onClick={handleClick}
      className={cn("min-h-11 flex-1 font-semibold", className)}
      {...props}
    >
      {pending && <Loader2Icon aria-hidden className="animate-spin" />}
      {children}
    </Button>
  );
}
