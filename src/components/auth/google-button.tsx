"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { postLoginPath } from "@/lib/auth/redirect";
import type { SessionUser } from "@/types";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.46a5.53 5.53 0 0 1-2.4 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.87-3.01c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54v-3.1H1.28a12 12 0 0 0 0 10.74l3.99-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.28 6.63l3.99 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

/**
 * "Continue with Google" — Firebase popup sign-in. The Firebase SDK is
 * imported lazily on click so it stays out of the main bundle.
 */
export function GoogleButton({ next }: { next?: string }) {
  const router = useRouter();
  const { mutate } = useSession();
  const [pending, setPending] = useState(false);

  const finishLogin = async (idToken: string) => {
    const user = await apiMutate<SessionUser>("/api/auth/firebase", {
      body: { idToken },
    });
    await mutate();
    toast.success(`Welcome, ${user.name.split(" ")[0]}!`);
    router.push(postLoginPath(user.role, next));
    router.refresh();
  };

  const reportError = (err: unknown) => {
    const code = (err as { code?: string })?.code ?? "";
    // Closing the popup is not an error worth toasting.
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return;
    }
    if (code === "auth/unauthorized-domain") {
      toast.error("This domain isn't authorized for Google sign-in yet.");
      return;
    }
    toast.error(
      err instanceof FetchError ? err.message : "Google sign-in failed. Please try again.",
    );
  };

  // Collect the result when we land back from the redirect flow.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const client = await import("@/lib/firebase/client");
      if (!client.hasPendingRedirect() || !client.isFirebaseConfigured()) return;
      setPending(true);
      try {
        const idToken = await client.consumeRedirectResult();
        if (!cancelled && idToken) await finishLogin(idToken);
      } catch (err) {
        if (!cancelled) reportError(err);
      } finally {
        if (!cancelled) setPending(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleClick() {
    setPending(true);
    try {
      const client = await import("@/lib/firebase/client");
      if (!client.isFirebaseConfigured()) {
        toast.error("Google sign-in isn't configured yet.");
        return;
      }
      // Installed PWAs (especially iOS) can't round-trip a popup — redirect instead.
      if (client.isStandaloneDisplay()) {
        await client.signInWithGoogleRedirect();
        return;
      }
      try {
        await finishLogin(await client.signInWithGooglePopup());
      } catch (err) {
        const code = (err as { code?: string })?.code ?? "";
        if (
          code === "auth/popup-blocked" ||
          code === "auth/operation-not-supported-in-this-environment"
        ) {
          await client.signInWithGoogleRedirect();
          return;
        }
        throw err;
      }
    } catch (err) {
      reportError(err);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full"
      onClick={handleClick}
      disabled={pending}
    >
      <GoogleIcon />
      {pending ? "Signing in…" : "Continue with Google"}
    </Button>
  );
}
