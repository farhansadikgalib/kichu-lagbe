import { Suspense } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { isLocalHost } from "@/lib/dev-host";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a KichuLagbe account for late-night delivery.",
};

export default async function RegisterPage() {
  /* Demo credentials are a local convenience; never advertise them on a real host. */
  const showDemoHint = isLocalHost((await headers()).get("host"));
  return (
    <Suspense>
      <RegisterForm showDemoHint={showDemoHint} />
    </Suspense>
  );
}
