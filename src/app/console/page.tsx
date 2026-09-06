import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { isLocalHost } from "@/lib/dev-host";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Console Login",
  description: "Sign in to the KichuLagbe admin and rider console.",
  robots: { index: false, follow: false },
};

/**
 * Email/password login for staff (admin/rider) and anyone else who signs in
 * with a password. Outside the (storefront) group — no storefront header,
 * footer, or mobile nav. `/admin` and `/rider` redirect here when signed out.
 */
export default async function ConsoleLoginPage() {
  /* Demo credentials are a local convenience; never advertise them on a real host. */
  const showDemoHint = isLocalHost((await headers()).get("host"));
  return (
    <Suspense>
      <LoginForm mode="console" showDemoHint={showDemoHint} />
    </Suspense>
  );
}
