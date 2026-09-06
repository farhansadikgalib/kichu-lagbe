import type { UserRole } from "@/types";

/** Where each role lands after signing in when no explicit destination was requested. */
const ROLE_HOME: Record<UserRole, string> = {
  admin: "/admin",
  rider: "/rider",
  customer: "/",
};

/** Only same-origin paths are honoured, never protocol-relative or absolute URLs. */
export function safeNextPath(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

/**
 * Post-login destination: an explicit `next` wins (the user was sent to login
 * from a protected page), otherwise staff go to their console and customers
 * to the storefront. Shared by email, Google popup and Google redirect flows.
 */
export function postLoginPath(role: UserRole, next?: string | null): string {
  return safeNextPath(next) ?? ROLE_HOME[role] ?? "/";
}
