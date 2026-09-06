import { requireUser } from "@/lib/auth/guards";
import { isImageFit, putImage } from "@/lib/media/storage";
import { ApiError, handleApiError, ok } from "@/lib/api/response";

/**
 * Multipart upload (`file` field, optional `fit` = square | wide). The image
 * is resized to its display shape and stored as WebP; returns the asset with
 * its public URL.
 */
export async function POST(request: Request) {
  try {
    await requireUser("admin");
    const form = await request.formData().catch(() => {
      throw new ApiError("Expected a multipart form upload.", 400);
    });
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("No file was uploaded.", 422);
    const fit = form.get("fit");
    if (fit !== null && !isImageFit(fit)) {
      throw new ApiError("fit must be 'square' or 'wide'.", 422);
    }
    return ok(await putImage(file, fit ?? "square"), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
