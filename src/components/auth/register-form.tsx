"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthDivider } from "@/components/auth/auth-divider";
import { GoogleButton } from "@/components/auth/google-button";
import { PasswordInput } from "@/components/auth/password-input";
import { useSession } from "@/hooks/use-session";
import { apiMutate, FetchError } from "@/lib/api/fetcher";
import { registerSchema } from "@/lib/validation/auth";
import type { SessionUser } from "@/types";

interface FieldErrors {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
}

/** Account registration form; logs the user in and redirects on success. */
interface RegisterFormProps {
  /** Forwarded to the card: show the seeded demo accounts (localhost only). */
  showDemoHint?: boolean;
}

export function RegisterForm({ showDemoHint }: RegisterFormProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutate } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const nextParam = searchParams.get("next");
  const nextPath =
    nextParam?.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";
  const loginHref = nextParam
    ? `/login?next=${encodeURIComponent(nextParam)}`
    : "/login";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse({ name, email, phone, password });
    if (!parsed.success) {
      const fe = z.flattenError(parsed.error).fieldErrors;
      setErrors({
        name: fe.name?.[0],
        email: fe.email?.[0],
        phone: fe.phone?.[0],
        password: fe.password?.[0],
      });
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const user = await apiMutate<SessionUser>("/api/auth/register", {
        body: parsed.data,
      });
      await mutate();
      toast.success(`Welcome to KichuLagbe, ${user.name.split(" ")[0]}!`);
      router.push(nextPath);
      router.refresh();
    } catch (err) {
      toast.error(
        err instanceof FetchError
          ? err.message
          : "Registration failed. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AuthCard
      showDemoHint={showDemoHint}
      title="Create your account"
      description="Late-night snacks and essentials — delivered to your door."
      footer={
        <p>
          Already have an account?{" "}
          <Link
            href={loginHref}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </Link>
        </p>
      }
    >
      <GoogleButton next={nextParam ?? undefined} />
      <AuthDivider />
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="register-name">Full name</Label>
          <Input
            id="register-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "register-name-error" : undefined}
          />
          {errors.name && (
            <p
              id="register-name-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.name}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-email">Email</Label>
          <Input
            id="register-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "register-email-error" : undefined}
          />
          {errors.email && (
            <p
              id="register-email-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.email}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-phone">Phone number</Label>
          <PhoneInput
            id="register-phone"
            value={phone}
            onValueChange={setPhone}
            aria-invalid={errors.phone ? true : undefined}
            aria-describedby={errors.phone ? "register-phone-error" : undefined}
          />
          {errors.phone && (
            <p
              id="register-phone-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.phone}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="register-password">Password</Label>
          <PasswordInput
            id="register-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={
              errors.password ? "register-password-error" : undefined
            }
          />
          {errors.password ? (
            <p
              id="register-password-error"
              role="alert"
              className="text-xs text-destructive"
            >
              {errors.password}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              At least 8 characters.
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthCard>
  );
}
