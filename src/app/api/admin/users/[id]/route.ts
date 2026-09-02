import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

const updateSchema = z.object({
  role: z.enum(["customer", "rider", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireUser("admin");
    const { id } = await params;
    if (id === session.sub) throw new ApiError("You cannot modify your own account.", 422);

    const input = updateSchema.parse(await request.json());
    const [updated] = await db
      .update(users)
      .set({
        ...(input.role !== undefined && { role: input.role }),
        ...(input.isActive !== undefined && { isActive: input.isActive }),
      })
      .where(eq(users.id, id))
      .returning();
    if (!updated) throw new ApiError("User not found.", 404);

    const { passwordHash, ...safe } = updated;
    void passwordHash;
    return ok(safe);
  } catch (err) {
    return handleApiError(err);
  }
}
