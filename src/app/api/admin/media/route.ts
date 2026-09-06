import { requireUser } from "@/lib/auth/guards";
import { putImage } from "@/lib/media/storage";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

/** Multipart upload (`file` field). Returns the asset with its public URL. */
export async function POST(request: Request) {
  try {
    await requireUser("admin");
    const form = await request.formData().catch(() => {
      throw new ApiError("Expected a multipart form upload.", 400);
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("No file was uploaded.", 422);
    return ok(await putImage(file), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
