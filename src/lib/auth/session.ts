import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import type { UserRole } from "@/types";

const COOKIE_NAME = "dl_session";
/**
 * As close to "forever" as a cookie can get: 400 days is the hard ceiling
 * Chrome (and, since, Safari/Firefox) enforce on Set-Cookie Max-Age/Expires —
 * anything longer is silently clamped down to it, so there is no point
 * asking for more. Staying signed in past this needs an actual re-login;
 * a deactivated account or role change is caught much sooner regardless,
 * since every guarded request re-checks the live user row (see
 * `resolveLiveSession` in `@/lib/auth/guards`), not just the JWT.
 */
const SESSION_DAYS = 400;

export interface SessionPayload {
  /** User id (uuid). */
  sub: string;
  role: UserRole;
  name: string;
  email: string;
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecret());
    return {
      sub: payload.sub,
      role: payload.role,
      name: payload.name,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
