"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bike,
  LayoutDashboard,
  LayoutTemplate,
  LogOut,
  Menu,
  Package,
  ShoppingBasket,
  Store,
  TicketPercent,
  Users,
} from "lucide-react";
import { LiveOrderAlerts } from "@/components/admin/live-orders";
import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useLogout } from "@/hooks/use-logout";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: Package },
  { href: "/admin/products", label: "Products", icon: ShoppingBasket },
  { href: "/admin/home", label: "Home page", icon: LayoutTemplate },
  { href: "/admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/delivery", label: "Delivery", icon: Bike },
] as const;

/** Editors that need the whole viewport instead of the reading-width column. */
const WIDE_ROUTES = ["/admin/home"];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function Brand() {
  return (
    <Link href="/admin" className="flex items-center gap-2">
      <Image src="/images/logo.png" alt="" width={28} height={28} className="rounded-md" priority />
      <span className="flex items-baseline gap-1.5">
        <span className="text-lg font-bold tracking-tight">
          Kichu<span className="text-primary">Lagbe</span>
        </span>
        <span className="text-xs font-semibold text-muted-foreground uppercase">Admin</span>
      </span>
    </Link>
  );
}

function AdminNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Admin sections" className="flex flex-1 flex-col gap-1 p-3">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200",
              active
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

const FOOTER_LINK_CLASS =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors duration-200 hover:bg-accent hover:text-foreground";

/** Drawer footer: leave the console, or end the session. */
function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const logout = useLogout();
  return (
    <div className="flex flex-col gap-1 border-t border-border/60 p-3">
      <Link href="/" onClick={onNavigate} className={FOOTER_LINK_CLASS}>
        <Store className="size-4" aria-hidden />
        Back to store
      </Link>
      <button
        type="button"
        onClick={() => {
          onNavigate?.();
          void logout();
        }}
        className={cn(FOOTER_LINK_CLASS, "hover:text-destructive")}
      >
        <LogOut className="size-4" aria-hidden />
        Log out
      </button>
    </div>
  );
}

/** Admin console shell: desktop sidebar, mobile sheet nav, and a context header. */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const current = NAV_ITEMS.find((item) => isActive(pathname, item.href));
  const wide = WIDE_ROUTES.some((route) => pathname.startsWith(route));
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="flex min-h-dvh">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border/60 bg-card/40 md:flex">
        <div className="flex h-16 items-center border-b border-border/60 px-6">
          <Brand />
        </div>
        <AdminNav pathname={pathname} />
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-2 border-b border-border/60 bg-background/80 px-4 backdrop-blur-lg md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open admin menu"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-64 flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border/60 px-6 py-4">
                <SheetTitle asChild>
                  <div>
                    <Brand />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <AdminNav pathname={pathname} onNavigate={closeMobile} />
              <SidebarFooter onNavigate={closeMobile} />
            </SheetContent>
          </Sheet>

          <p className="min-w-0 truncate text-sm font-semibold">
            <span className="font-medium text-muted-foreground">Admin / </span>
            {current?.label ?? "Console"}
          </p>

          <div className="ml-auto flex items-center gap-1">
            <LiveOrderAlerts />
            <NotificationsMenu />
            <Button asChild variant="outline" size="sm" className="ml-1 max-sm:hidden">
              <Link href="/">
                <Store data-icon="inline-start" aria-hidden />
                Back to store
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <div className={cn("mx-auto w-full", wide ? "max-w-none" : "max-w-6xl")}>{children}</div>
        </main>
      </div>
    </div>
  );
}
