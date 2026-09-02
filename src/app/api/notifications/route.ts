import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await requireUser();
    const rows = await db.query.notifications.findMany({
      where: eq(notifications.userId, session.sub),
      orderBy: [desc(notifications.createdAt)],
      limit: 30,
    });
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}

/** Mark all of the current user's notifications read. */
export async function PATCH() {
  try {
    const session = await requireUser();
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, session.sub));
    return ok({ read: true });
  } catch (err) {
    return handleApiError(err);
  }
}
