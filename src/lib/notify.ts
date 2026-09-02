import "server-only";
import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";

/** Create an in-app notification. Failures are logged, never thrown. */
export async function notify(
  userId: string,
  title: string,
  body: string,
  href?: string,
) {
  try {
    await db.insert(notifications).values({ userId, title, body, href });
  } catch (err) {
    console.error("[notify]", err);
  }
}
