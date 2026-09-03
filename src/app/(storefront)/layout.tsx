import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SmoothScrollProvider } from "@/components/motion";

export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
    </SmoothScrollProvider>
  );
}
