import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";
import type { UserRole } from "@/types";

const ROLES = ["customer", "rider", "admin"];

export async function GET(request: Request) {
  try {
    await requireUser("admin");
    const url = new URL(request.url);
    const role = url.searchParams.get("role");

    const rows = await db.query.users.findMany({
      where: role && ROLES.includes(role) ? eq(users.role, role as UserRole) : undefined,
      orderBy: [desc(users.createdAt)],
      columns: { passwordHash: false },
      limit: 500,
    });
    return ok(rows);
  } catch (err) {
    return handleApiError(err);
  }
}
