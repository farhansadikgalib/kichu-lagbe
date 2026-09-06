import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminPageSkeleton } from "@/components/admin/page-skeleton";
import { requirePageUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin | KichuLagbe" },
  robots: { index: false, follow: false },
};

/**
 * The proxy already turns away anyone without an admin token, so the shell
 * can paint at once; this re-check against the live account (deactivation,
 * role changes) streams in behind a skeleton instead of blanking the page.
 */
async function AdminGuard({ children }: { children: ReactNode }) {
  await requirePageUser("admin");
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <Suspense fallback={<AdminPageSkeleton />}>
        <AdminGuard>{children}</AdminGuard>
      </Suspense>
    </AdminShell>
  );
}
