import "server-only";
import { after } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications, users } from "@/lib/db/schema";
import type { PushPayload } from "@/lib/push/payload";
import { sendPushToUsers } from "@/lib/push/server";

/**
 * Push delivery runs after the response is sent so it never slows a request.
 * Outside a request scope (scripts) `after` is unavailable; deliver inline.
 */
function pushLater(userIds: string[], payload: PushPayload) {
  const deliver = () => sendPushToUsers(userIds, payload);
  try {
    after(deliver);
  } catch {
    void deliver();
  }
}

/** Create an in-app notification and push it to the user's devices. Failures are logged, never thrown. */
export async function notify(
  userId: string,
  title: string,
  body: string,
  href?: string,
) {
  try {
    await db.insert(notifications).values({ userId, title, body, href });
    pushLater([userId], { title, body, href, tag: href });
  } catch (err) {
    console.error("[notify]", err);
  }
}

/** Create the same notification for every active admin, and push it to their devices. */
export async function notifyAdmins(title: string, body: string, href?: string) {
  try {
    const admins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.role, "admin"), eq(users.isActive, true)));
    if (admins.length === 0) return;
    await db
      .insert(notifications)
      .values(admins.map((admin) => ({ userId: admin.id, title, body, href })));
    pushLater(
      admins.map((a) => a.id),
      // New orders must each be seen: no tag, so they stack instead of replacing.
      { title, body, href },
    );
  } catch (err) {
    console.error("[notifyAdmins]", err);
  }
}
