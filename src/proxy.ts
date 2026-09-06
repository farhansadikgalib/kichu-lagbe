import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED: Array<{ prefix: string; roles?: string[] }> = [
  { prefix: "/admin", roles: ["admin"] },
  { prefix: "/preview", roles: ["admin"] },
  { prefix: "/rider", roles: ["rider", "admin"] },
  { prefix: "/checkout" },
  { prefix: "/orders" },
  { prefix: "/profile" },
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rule = PROTECTED.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return NextResponse.next();

  const token = request.cookies.get("dl_session")?.value;
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", pathname);

  if (!token) return NextResponse.redirect(loginUrl);

  try {
    const secret = new TextEncoder().encode(process.env.SESSION_SECRET);
    const { payload } = await jwtVerify<{ role: string }>(token, secret);
    if (rule.roles && !rule.roles.includes(payload.role)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/preview/:path*",
    "/rider/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/profile/:path*",
  ],
};
