import "server-only";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import type { UserRole } from "@/types";

const COOKIE_NAME = "dl_session";
/**
 * As close to "forever" as a cookie can get: 400 days is the hard ceiling
 * Chrome (and, since, Safari/Firefox) enforce on Set-Cookie Max-Age/Expires —
 * anything longer is silently clamped down to it, so there is no point
 * asking for more. The window slides, though: `renewSession` re-issues the
 * cookie on any visit once it is a day old, so a user who comes back at
 * least once every 400 days never has to log in again. A deactivated
 * account or role change is caught much sooner regardless, since every
 * guarded request re-checks the live user row (see `resolveLiveSession`
 * in `@/lib/auth/guards`), not just the JWT.
 */
const SESSION_DAYS = 400;
/** Re-issue at most this often so ordinary page loads don't all carry Set-Cookie. */
const RENEW_AFTER_SECONDS = 24 * 60 * 60;

export interface SessionPayload {
  /** User id (uuid). */
  sub: string;
  role: UserRole;
  name: string;
  email: string;
}

/** A verified session cookie: the claims plus when the token was signed. */
export interface Session extends SessionPayload {
  /** Unix seconds; drives `renewSession`. */
  issuedAt: number;
}

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSession(payload: SessionPayload) {
  const { sub, role, name, email } = payload;
  const token = await new SignJWT({ sub, role, name, email })
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

export async function getSession(): Promise<Session | null> {
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
      issuedAt: payload.iat ?? 0,
    };
  } catch {
    return null;
  }
}

/**
 * Sliding expiry. Once the token is `RENEW_AFTER_SECONDS` old, sign a fresh
 * one from the live account (so a role change also lands in the JWT the
 * proxy reads) and push the cookie's 400-day window out again. Only valid
 * where cookies can be written: a Route Handler or Server Function.
 */
export async function renewSession(session: Session, live: SessionPayload) {
  const ageSeconds = Math.floor(Date.now() / 1000) - session.issuedAt;
  if (ageSeconds < RENEW_AFTER_SECONDS) return;
  await createSession(live);
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export { COOKIE_NAME as SESSION_COOKIE_NAME };
