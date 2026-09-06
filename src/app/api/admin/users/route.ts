import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { handleApiError, ok } from "@/lib/api/response";
import { paginate, parsePagination } from "@/lib/api/pagination";
import type { UserRole } from "@/types";

const ROLES = ["customer", "rider", "admin"];

export async function GET(request: Request) {
  try {
    await requireUser("admin");
    const url = new URL(request.url);
    const role = url.searchParams.get("role");
    const search = url.searchParams.get("search")?.trim();
    const { page, pageSize, offset } = parsePagination(url);

    const conditions = [];
    if (role && ROLES.includes(role)) conditions.push(eq(users.role, role as UserRole));
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`),
          ilike(users.phone, `%${search}%`),
        ),
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [{ total }] = await db.select({ total: count() }).from(users).where(where);
    const rows = await db.query.users.findMany({
      where,
      orderBy: [desc(users.createdAt)],
      columns: { passwordHash: false },
      limit: pageSize,
      offset,
    });
    return ok(paginate(rows, total, page, pageSize));
  } catch (err) {
    return handleApiError(err);
  }
}
