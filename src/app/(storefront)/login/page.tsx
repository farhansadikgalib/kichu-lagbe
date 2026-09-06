import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { isLocalHost } from "@/lib/dev-host";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Log in to your KichuLagbe account.",
};

export default async function LoginPage() {
  /* Demo credentials are a local convenience; never advertise them on a real host. */
  const showDemoHint = isLocalHost((await headers()).get("host"));
  return (
    <Suspense>
      <LoginForm showDemoHint={showDemoHint} />
    </Suspense>
  );
}
