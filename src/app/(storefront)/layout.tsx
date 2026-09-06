import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileNav } from "@/components/layout/mobile-nav";
import { LiveOrderUpdates } from "@/components/orders/live-order-updates";

// Scrolling is native: it runs on the compositor thread, tracks the input
// device 1:1, and stays smooth while the main thread is busy. Scroll-linked
// motion (scrubs, reveals, the header) hangs off ScrollTrigger instead.
export default function StorefrontLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
      <MobileNav />
      <LiveOrderUpdates />
    </>
  );
}
