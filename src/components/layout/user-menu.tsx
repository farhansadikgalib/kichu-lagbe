"use client";

import Link from "next/link";
import { LogOut, Package, ShieldCheck, User as UserIcon, Bike } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useLogout } from "@/hooks/use-logout";
import { useSession } from "@/hooks/use-session";

export function UserMenu() {
  const { user, isLoading } = useSession();
  const handleLogout = useLogout();

  if (isLoading) return <div className="size-9 rounded-full bg-muted" aria-hidden />;

  if (!user) {
    return (
      <Button asChild size="sm">
        <Link href="/login">Login</Link>
      </Button>
    );
  }

  const initials = user.name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="rounded-full outline-none ring-primary/60 transition-transform duration-200 hover:scale-105 focus-visible:ring-2"
          aria-label="Account menu"
        >
          <Avatar className="size-9 border border-border">
            <AvatarFallback className="bg-secondary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Staff accounts go straight to their console — no shopper pages. */}
        {user.role === "admin" ? (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck /> Admin console
            </Link>
          </DropdownMenuItem>
        ) : user.role === "rider" ? (
          <DropdownMenuItem asChild>
            <Link href="/rider">
              <Bike /> Rider console
            </Link>
          </DropdownMenuItem>
        ) : (
          <>
            <DropdownMenuItem asChild>
              <Link href="/profile">
                <UserIcon /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/orders">
                <Package /> My orders
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={handleLogout} variant="destructive">
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
