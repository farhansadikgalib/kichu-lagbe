import { z } from "zod";

/** Shape of `PushSubscription.toJSON()` as sent by the browser. */
export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url().max(2000),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1).max(500),
    auth: z.string().min(1).max(200),
  }),
});

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url().max(2000),
});

export type PushSubscriptionInput = z.infer<typeof pushSubscriptionSchema>;
