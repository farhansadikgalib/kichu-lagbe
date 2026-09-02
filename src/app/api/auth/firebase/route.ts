import { createRemoteJWKSet, jwtVerify } from "jose";
import { z } from "zod";
import { loginWithOAuthProfile } from "@/lib/auth/oauth-user";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

const bodySchema = z.object({ idToken: z.string().min(10) });

/** Google's signing keys for Firebase ID tokens (cached by jose). */
const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"),
);

/**
 * Verifies a Firebase ID token (from the Google popup) and starts a session.
 */
export async function POST(request: Request) {
  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId) throw new ApiError("Google sign-in isn't configured.", 503);

    const { idToken } = bodySchema.parse(await request.json());

    let payload;
    try {
      ({ payload } = await jwtVerify(idToken, FIREBASE_JWKS, {
        issuer: `https://securetoken.google.com/${projectId}`,
        audience: projectId,
      }));
    } catch {
      throw new ApiError("Invalid Google sign-in token.", 401);
    }

    const email = typeof payload.email === "string" ? payload.email.toLowerCase() : null;
    if (!email) throw new ApiError("Google account has no email.", 422);

    const user = await loginWithOAuthProfile({
      email,
      emailVerified: payload.email_verified === true,
      name:
        typeof payload.name === "string" && payload.name.trim()
          ? payload.name
          : email.split("@")[0],
      picture: typeof payload.picture === "string" ? payload.picture : null,
    });

    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return handleApiError(err);
  }
}
