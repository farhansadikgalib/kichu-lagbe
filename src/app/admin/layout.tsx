import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requirePageUser } from "@/lib/auth/guards";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin | KichuLagbe" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requirePageUser("admin");
  return <AdminShell>{children}</AdminShell>;
}
