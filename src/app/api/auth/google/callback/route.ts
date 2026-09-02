import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeGoogleCode } from "@/lib/auth/google";
import { loginWithOAuthProfile } from "@/lib/auth/oauth-user";
import { ApiError } from "@/lib/api/response";

/** Google redirects here; upserts the user by email and starts a session. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/login?error=${reason}`, url.origin));

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    if (!code || !state) return fail("google-cancelled");

    const cookieStore = await cookies();
    const storedState = cookieStore.get("dl_oauth_state")?.value;
    cookieStore.delete("dl_oauth_state");
    if (!storedState || storedState !== state) return fail("google-state");

    const profile = await exchangeGoogleCode(url.origin, code);
    await loginWithOAuthProfile(profile);

    const next = decodeURIComponent(state.split(":").slice(1).join(":") || "/");
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
    return NextResponse.redirect(new URL(safeNext, url.origin));
  } catch (err) {
    if (err instanceof ApiError && err.status === 403) return fail("account-disabled");
    console.error("[google-oauth]", err);
    return fail("google-failed");
  }
}
