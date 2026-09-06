import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { PushToggle } from "@/components/pwa/push-toggle";
import { QueueSkeleton } from "@/components/rider";
import { requirePageUser } from "@/lib/auth/guards";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Rider Console",
};

/** Live-account re-check (the proxy already checked the token) streams behind a skeleton. */
async function RiderGuard({ children }: { children: ReactNode }) {
  await requirePageUser("rider", "admin");
  return <>{children}</>;
}

export default function RiderLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="container-page flex h-14 items-center justify-between gap-3">
          <Link
            href="/rider"
            className="flex items-center gap-2.5"
            aria-label="Rider console home"
          >
            <Image
              src="/images/logo.png"
              alt=""
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span className="font-bold tracking-tight">
              Rider <span className="text-primary">Console</span>
            </span>
          </Link>

          <div className="flex items-center gap-1.5">
            <PushToggle variant="button" />
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground"
            >
              <ArrowLeftIcon aria-hidden className="size-4" />
              <span className="hidden sm:inline">Back to {BRAND.name}</span>
              <span className="sm:hidden">Store</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Narrower than container-page: the console is a single-column, phone-first workboard. */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        <Suspense fallback={<QueueSkeleton />}>
          <RiderGuard>{children}</RiderGuard>
        </Suspense>
      </main>
    </div>
  );
}
