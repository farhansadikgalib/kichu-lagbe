import { ApiError } from "@/lib/api/response";

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Turnstile is optional infrastructure: with no keys in the environment the
 * widget never renders and verification is a no-op, so auth keeps working on
 * fresh clones. Set both keys to turn bot protection on.
 */
export function isTurnstileConfigured(): boolean {
  return Boolean(
    process.env.TURNSTILE_SECRET_KEY && process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  );
}

/**
 * Validate a Turnstile token with Cloudflare. No-op when unconfigured;
 * throws a 403 `ApiError` for a missing or rejected token otherwise.
 */
export async function verifyTurnstile(
  token: string | undefined,
  request?: Request,
): Promise<void> {
  if (!isTurnstileConfigured()) return;
  if (!token) {
    throw new ApiError("Bot check didn't complete — please try again.", 403);
  }

  const body = new URLSearchParams({
    secret: process.env.TURNSTILE_SECRET_KEY!,
    response: token,
  });
  const remoteIp = request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (remoteIp) body.set("remoteip", remoteIp);

  let outcome: { success?: boolean };
  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body });
    outcome = (await res.json()) as { success?: boolean };
  } catch {
    // Cloudflare unreachable — fail closed for writes guarded by a bot check.
    throw new ApiError("Bot check is unavailable right now — please retry.", 503);
  }

  if (!outcome.success) {
    throw new ApiError("Bot check failed — please try again.", 403);
  }
}
