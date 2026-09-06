"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { TurnstileWidget } from "@/components/auth/turnstile-widget";
import { useSession } from "@/hooks/use-session";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { loginSchema } from "@/lib/validation/auth";
import type { SessionUser } from "@/types";

/** Email/password login form. Redirects to `next` when given, otherwise to the role's home. */
interface LoginFormProps {
  /** Forwarded to the card: show the seeded demo accounts (localhost only). */
  showDemoHint?: boolean;
}

export function LoginForm({ showDemoHint }: LoginFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [submitting, setSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Bumped after a failed submit — remounts the widget for a fresh token.
  const [turnstileRun, setTurnstileRun] = useState(0);

  const nextParam = safeNextPath(searchParams.get("next"));
  const registerHref = nextParam
    ? `/register?next=${encodeURIComponent(nextParam)}`
    : "/register";

  const oauthError = searchParams.get("error");
  const oauthErrorMessage =
    oauthError === "google-unavailable"
      ? "Google sign-in isn't configured yet."
      : oauthError === "account-disabled"
        ? "This account has been disabled."
        : oauthError
          ? "Google sign-in failed. Please try again."
          : null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fe = z.flattenError(parsed.error).fieldErrors;
      setErrors({ email: fe.email?.[0], password: fe.password?.[0] });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const user = await apiMutate<SessionUser>("/api/auth/login", {
        body: { ...parsed.data, turnstileToken: turnstileToken ?? undefined },
      });
      // The response already is the session: seed the cache instead of
      // refetching, and go straight to the destination. Staff land in their
      // console unless they were sent here from a specific page.
      await mutate(user, { revalidate: false });
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      router.replace(postLoginPath(user.role, nextParam));
    } catch (err) {
      toast.error(
        err instanceof FetchError
          ? err.message
          : "Login failed. Please try again.",
      );
      setTurnstileToken(null);
      setTurnstileRun((run) => run + 1);
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      showDemoHint={showDemoHint}
      title="Welcome back"
      description="Log in to order late-night essentials."
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link
            href={registerHref}
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </p>
      }
    >
      {oauthErrorMessage && (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {oauthErrorMessage}
        </p>
      )}
      <GoogleButton next={nextParam ?? undefined} />
      <AuthDivider />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <fieldset disabled={submitting} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {errors.email && (
              <p
                id="login-email-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.email}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <PasswordInput
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              aria-invalid={errors.password ? true : undefined}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
            />
            {errors.password && (
              <p
                id="login-password-error"
                role="alert"
                className="text-xs text-destructive"
              >
                {errors.password}
              </p>
            )}
          </div>
          <TurnstileWidget key={turnstileRun} onToken={setTurnstileToken} />
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting && <Loader2 className="animate-spin" aria-hidden />}
            {submitting ? "Logging in…" : "Log in"}
          </Button>
        </fieldset>
      </form>
    </AuthCard>
  );
}
