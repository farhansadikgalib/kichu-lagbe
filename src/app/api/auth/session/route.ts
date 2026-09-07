import { getSession, renewSession } from "@/lib/auth/session";
import { resolveLiveSession } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return ok(null);

    // Re-check the live account, not just the JWT — with a long-lived
    // session cookie, a deactivated or role-changed account must stop
    // looking signed-in immediately, not whenever it next hits a guarded
    // route/page.
    const live = await resolveLiveSession(session);
    if (!live) return ok(null);

    // Every page load lands here, so this is where the "stay signed in"
    // window slides forward for anyone still active.
    await renewSession(session, live);

    return ok({
      id: live.sub,
      name: live.name,
      email: live.email,
      role: live.role,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
