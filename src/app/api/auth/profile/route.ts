import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { createSession } from "@/lib/auth/session";
import { updateProfileSchema } from "@/lib/validation/auth";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await requireUser();
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.sub),
      columns: { passwordHash: false },
    });
    if (!user) throw new ApiError("Account not found.", 404);
    return ok(user);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireUser();
    const input = updateProfileSchema.parse(await request.json());

    const [updated] = await db
      .update(users)
      .set({
        ...(input.name !== undefined && { name: input.name }),
        ...(input.phone !== undefined && { phone: input.phone }),
        ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl || null }),
      })
      .where(eq(users.id, session.sub))
      .returning();
    if (!updated) throw new ApiError("Account not found.", 404);

    // Keep the session name in sync with the profile.
    await createSession({
      sub: updated.id,
      role: updated.role,
      name: updated.name,
      email: updated.email,
    });

    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return ok(safe);
  } catch (err) {
    return handleApiError(err);
  }
}
