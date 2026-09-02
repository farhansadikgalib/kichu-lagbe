import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { buildGoogleAuthUrl, isGoogleConfigured } from "@/lib/auth/google";

/** Starts the Google sign-in flow. */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (!isGoogleConfigured()) {
    return NextResponse.redirect(new URL("/login?error=google-unavailable", url.origin));
  }

  const next = url.searchParams.get("next") ?? "/";
  const state = `${crypto.randomUUID()}:${encodeURIComponent(next)}`;

  const cookieStore = await cookies();
  cookieStore.set("dl_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 10 * 60,
  });

  return NextResponse.redirect(buildGoogleAuthUrl(url.origin, state));
}
