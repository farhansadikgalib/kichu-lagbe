import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/auth";
import { verifyTurnstile } from "@/lib/turnstile";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

export async function POST(request: Request) {
  try {
    const input = registerSchema.parse(await request.json());
    await verifyTurnstile(input.turnstileToken, request);

    const existing = await db.query.users.findFirst({
      where: eq(users.email, input.email),
      columns: { id: true },
    });
    if (existing) throw new ApiError("An account with this email already exists.", 409);

    let user;
    try {
      [user] = await db
        .insert(users)
        .values({
          name: input.name,
          email: input.email,
          phone: input.phone,
          passwordHash: await hashPassword(input.password),
        })
        .returning();
    } catch (err) {
      // Unique-violation race: two concurrent registrations for the same email.
      const pgCode =
        (err as { code?: string })?.code ??
        (err as { cause?: { code?: string } })?.cause?.code;
      if (pgCode === "23505") {
        throw new ApiError("An account with this email already exists.", 409);
      }
      throw err;
    }

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
