import { destroySession } from "@/lib/auth/session";
import { handleApiError, ok } from "@/lib/api/response";

export async function POST() {
  try {
    await destroySession();
    return ok({ loggedOut: true });
  } catch (err) {
    return handleApiError(err);
  }
}
