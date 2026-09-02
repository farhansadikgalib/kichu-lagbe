import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/auth";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await request.json());

    const user = await db.query.users.findFirst({ where: eq(users.email, input.email) });
    if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
      throw new ApiError("Invalid email or password.", 401);
    }
    if (!user.isActive) throw new ApiError("This account has been disabled.", 403);

    await createSession({
      sub: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
    });

    return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    return handleApiError(err);
  }
}
