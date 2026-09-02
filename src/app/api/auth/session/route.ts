import { getSession } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return ok(null);
    return ok({
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
    });
  } catch (err) {
    return handleApiError(err);
  }
}
