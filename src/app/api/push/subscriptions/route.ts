import { db } from "@/lib/db";
import { pushSubscriptions } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { isPushConfigured, removePushSubscription } from "@/lib/push/server";
import { pushSubscriptionSchema, pushUnsubscribeSchema } from "@/lib/validation/push";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

/**
 * Register (or move to this user) the calling device's push subscription.
 * Called after the browser grants permission, and again on every app start
 * so a device that changed hands or rotated its endpoint stays current.
 */
export async function POST(request: Request) {
  try {
    const session = await requireUser();
    if (!isPushConfigured()) throw new ApiError("Push notifications are not configured.", 503);
    const input = pushSubscriptionSchema.parse(await request.json());
    const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? null;

    await db
      .insert(pushSubscriptions)
      .values({
        userId: session.sub,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent,
      })
      .onConflictDoUpdate({
        target: pushSubscriptions.endpoint,
        set: {
          userId: session.sub,
          p256dh: input.keys.p256dh,
          auth: input.keys.auth,
          userAgent,
          updatedAt: new Date(),
        },
      });
    return ok({ subscribed: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(request: Request) {
  try {
    await requireUser();
    const input = pushUnsubscribeSchema.parse(await request.json());
    await removePushSubscription(input.endpoint);
    return ok({ subscribed: false });
  } catch (err) {
    return handleApiError(err);
  }
}
