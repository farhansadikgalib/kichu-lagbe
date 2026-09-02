import "server-only";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/response";
import { getSession, type SessionPayload } from "./session";
import type { UserRole } from "@/types";

/**
 * Loads the live account for a session, so deactivation and role changes
 * take effect immediately instead of when the 7-day JWT expires.
 */
async function resolveLiveSession(session: SessionPayload): Promise<SessionPayload | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.sub),
    columns: { role: true, isActive: true },
  });
  if (!user || !user.isActive) return null;
  return { ...session, role: user.role };
}

/**
 * Route-handler guard. Throws ApiError (401/403) — pair with handleApiError.
 */
export async function requireUser(...roles: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new ApiError("You must be logged in.", 401);

  const live = await resolveLiveSession(session);
  if (!live) throw new ApiError("This account has been disabled.", 403);
  if (roles.length > 0 && !roles.includes(live.role)) {
    throw new ApiError("You do not have access to this resource.", 403);
  }
  return live;
}

/**
 * Server-component guard. Redirects to login (or home on role mismatch).
 */
export async function requirePageUser(...roles: UserRole[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) redirect("/login");

  const live = await resolveLiveSession(session);
  if (!live) redirect("/login");
  if (roles.length > 0 && !roles.includes(live.role)) redirect("/");
  return live;
}
