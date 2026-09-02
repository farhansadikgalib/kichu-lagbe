import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Reveal } from "@/components/motion";
import { DemoHint } from "@/components/auth/demo-hint";

interface AuthCardProps {
  title: string;
  description: string;
  /** Link row shown under the form (e.g. switch between login/register). */
  footer: ReactNode;
  children: ReactNode;
}

/** Centered card shell shared by the login and register pages. */
export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-10 md:py-16">
      <Reveal className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <Link href="/" className="mx-auto mb-2" aria-label="KichuLagbe home">
              <Image src="/images/logo.png" alt="" width={48} height={48} className="rounded-xl" priority />
            </Link>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>{children}</CardContent>
          <CardFooter className="justify-center text-sm text-muted-foreground">
            {footer}
          </CardFooter>
        </Card>
        <DemoHint />
      </Reveal>
    </div>
  );
}
