"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/use-session";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { postLoginPath } from "@/lib/auth/redirect";
import { isStandaloneDisplay } from "@/lib/pwa";
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
 * "Continue with Google". In a browser tab this is the Firebase popup, with
 * the SDK imported lazily on click so it stays out of the main bundle. In the
 * installed app (where popups can't return — iOS especially) or when the
 * popup is blocked, it hands off to the server-side OAuth flow, whose
 * redirect and first-party cookies work everywhere Safari's tracking
 * prevention would break Firebase's redirect.
 */
export function GoogleButton({ next }: { next?: string }) {
  const router = useRouter();
  const { mutate } = useSession();
  const [pending, setPending] = useState(false);

  const finishLogin = async (idToken: string) => {
    const user = await apiMutate<SessionUser>("/api/auth/firebase", {
      body: { idToken },
    });
    await mutate(user, { revalidate: false });
    toast.success(`Welcome, ${user.name.split(" ")[0]}!`);
    router.replace(postLoginPath(user.role, next));
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
    if (code === "auth/operation-not-allowed") {
      toast.error("Google sign-in isn't enabled for this Firebase project yet.", {
        description: "Firebase console → Authentication → Sign-in method → Google.",
      });
      return;
    }
    toast.error(
      err instanceof FetchError ? err.message : "Google sign-in failed. Please try again.",
    );
  };

  // Full-page navigation (not the router: the route answers with a redirect
  // to Google). The callback sets the session cookie and lands on the
  // post-login page, so `pending` stays on until the page is replaced.
  const signInWithServerFlow = () => {
    const url = new URL("/api/auth/google", window.location.origin);
    if (next) url.searchParams.set("next", next);
    window.location.assign(url.href);
  };

  async function handleClick() {
    setPending(true);
    if (isStandaloneDisplay()) {
      signInWithServerFlow();
      return;
    }
    try {
      const client = await import("@/lib/firebase/client");
      if (!client.isFirebaseConfigured()) {
        signInWithServerFlow();
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
          signInWithServerFlow();
          return;
        }
        throw err;
      }
      setPending(false);
    } catch (err) {
      reportError(err);
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
