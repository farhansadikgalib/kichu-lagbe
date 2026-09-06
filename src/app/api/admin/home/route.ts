import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth/guards";
import { getHomeLayout, setHomeLayout } from "@/lib/db/queries/home";
import { homeLayoutSchema } from "@/lib/home/schema";
import { handleApiError, ok } from "@/lib/api/response";

export async function GET() {
  try {
    await requireUser("admin");
    return ok(await getHomeLayout());
  } catch (err) {
    return handleApiError(err);
  }
}

/** Publish a full layout. The static home page is regenerated on its next visit. */
export async function PUT(request: Request) {
  try {
    await requireUser("admin");
    const layout = homeLayoutSchema.parse(await request.json());
    const saved = await setHomeLayout(layout);
    revalidatePath("/");
    return ok(saved);
  } catch (err) {
    return handleApiError(err);
  }
}
