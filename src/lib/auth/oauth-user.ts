import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "./password";
import { createSession } from "./session";
import { ApiError } from "@/lib/api/response";

export interface OAuthProfile {
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
}

/**
 * Upserts a user from a verified OAuth/Firebase profile (matched by email)
 * and starts a session. Shared by the Google redirect and Firebase popup flows.
 */
export async function loginWithOAuthProfile(profile: OAuthProfile) {
  let user = await db.query.users.findFirst({ where: eq(users.email, profile.email) });

  if (user && !user.isActive) {
    throw new ApiError("This account has been disabled.", 403);
  }

  if (!user) {
    // New account — random password (login stays Google-only until reset).
    const randomSecret = crypto.randomUUID() + crypto.randomUUID();
    [user] = await db
      .insert(users)
      .values({
        name: profile.name,
        email: profile.email,
        passwordHash: await hashPassword(randomSecret),
        avatarUrl: profile.picture,
        emailVerified: profile.emailVerified,
      })
      .returning();
  } else if (!user.emailVerified && profile.emailVerified) {
    [user] = await db
      .update(users)
      .set({ emailVerified: true, avatarUrl: user.avatarUrl ?? profile.picture })
      .where(eq(users.id, user.id))
      .returning();
  }

  await createSession({
    sub: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return user;
}
