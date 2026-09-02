import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { changePasswordSchema } from "@/lib/validation/auth";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const session = await requireUser();
    const input = changePasswordSchema.parse(await request.json());

    const user = await db.query.users.findFirst({ where: eq(users.id, session.sub) });
    if (!user) throw new ApiError("Account not found.", 404);
    if (!(await verifyPassword(input.currentPassword, user.passwordHash))) {
      throw new ApiError("Current password is incorrect.", 401);
    }

    await db
      .update(users)
      .set({ passwordHash: await hashPassword(input.newPassword) })
      .where(eq(users.id, session.sub));

    return ok({ changed: true });
  } catch (err) {
    return handleApiError(err);
  }
}
