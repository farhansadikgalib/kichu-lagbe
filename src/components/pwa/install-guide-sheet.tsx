"use client";

import Image from "next/image";
import { useRef } from "react";
import {
  ArrowDown,
  Check,
  Compass,
  Copy,
  Ellipsis,
  ExternalLink,
  Share,
  SquarePlus,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getInstallGuide, safariUrlFor, type InstallStepIcon } from "@/lib/pwa";

/** If the page is still showing this long after the hand-off, the webview swallowed it. */
const HANDOFF_TIMEOUT_MS = 1500;

/* `Share` is the iOS glyph (box with an arrow out the top), so the step
   looks like the button the user has to find. */
const STEP_ICONS: Record<InstallStepIcon, LucideIcon> = {
  share: Share,
  menu: Ellipsis,
  add: SquarePlus,
  confirm: Check,
  open: ExternalLink,
};

interface InstallGuideSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Add-to-Home-Screen walkthrough for browsers with no install prompt of
 * their own (every iOS browser). A sheet rather than a toast: it stays put
 * while the user hunts for the Share button, and it draws the icons they
 * are looking for. Inside an in-app webview it explains how to reach a real
 * browser and offers to copy the link for pasting there.
 */
export function InstallGuideSheet({ open, onOpenChange }: InstallGuideSheetProps) {
  // Reads `navigator`, so only resolve it client-side once the sheet opens.
  const guide = open ? getInstallGuide() : null;
  const handoffTimer = useRef<number | null>(null);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied — open Safari and paste it in the address bar.");
    } catch {
      toast.error("Couldn’t copy. Long-press the address bar to copy the link instead.");
    }
  }

  /** Best-effort jump to Safari; falls back to copying the link when the host blocks it. */
  function openInSafari() {
    const url = safariUrlFor(window.location.href);
    if (!url) return void copyLink();
    if (handoffTimer.current) window.clearTimeout(handoffTimer.current);
    handoffTimer.current = window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        toast.info("This app won’t hand over to Safari — copy the link and paste it there.");
      }
    }, HANDOFF_TIMEOUT_MS);
    window.location.href = url;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto gap-0 rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-4 sm:max-w-md sm:rounded-2xl sm:border"
      >
        {guide && (
          <>
            <SheetHeader className="flex-row items-center gap-3 pr-12">
              <Image
                src="/images/logo.png"
                alt=""
                width={44}
                height={44}
                className="shrink-0 rounded-xl"
              />
              <div className="flex flex-col gap-0.5">
                <SheetTitle>{guide.title}</SheetTitle>
                <SheetDescription>
                  {guide.canInstall
                    ? "About ten seconds, no App Store needed. It opens full-screen like a real app."
                    : "This app’s built-in browser can’t add apps to the Home Screen."}
                </SheetDescription>
              </div>
            </SheetHeader>

            <ol className="flex flex-col gap-1 px-4" aria-label="Install steps">
              {guide.steps.map((step, index) => {
                const Icon = STEP_ICONS[step.icon];
                return (
                  <li key={index} className="flex items-center gap-3 rounded-xl py-2">
                    <span
                      className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span
                      className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-card"
                      aria-hidden
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="text-sm leading-snug text-foreground">{step.text}</span>
                  </li>
                );
              })}
            </ol>

            {guide.hint && (
              <p className="mt-2 flex items-center justify-center gap-2 px-4 text-xs font-medium text-muted-foreground">
                <ArrowDown className="size-4 motion-safe:animate-bounce" aria-hidden />
                {guide.hint}
              </p>
            )}

            <SheetFooter className="pb-0">
              {guide.canInstall ? (
                <SheetClose asChild>
                  <Button size="lg">Got it</Button>
                </SheetClose>
              ) : (
                <>
                  <Button size="lg" onClick={openInSafari}>
                    <Compass aria-hidden /> Open in Safari
                  </Button>
                  <Button size="lg" variant="outline" onClick={copyLink}>
                    <Copy aria-hidden /> Copy link instead
                  </Button>
                  <SheetClose asChild>
                    <Button size="lg" variant="ghost">
                      Not now
                    </Button>
                  </SheetClose>
                </>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
