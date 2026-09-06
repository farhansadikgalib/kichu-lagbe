import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { ApiError } from "@/lib/api/response";
import type { MediaAsset } from "@/types";
import { mediaUrl } from "./url";

/** Route-handler bodies are capped at ~4.5MB on Vercel; leave headroom. */
export const MAX_MEDIA_BYTES = 4 * 1024 * 1024;

/** Raster formats only — `next/image` will not optimise SVG sources. */
export const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

/** Validates and persists an uploaded image, returning its public metadata. */
export async function putImage(file: File): Promise<MediaAsset> {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new ApiError("Only JPEG, PNG, WebP, GIF or AVIF images are allowed.", 415);
  }
  if (file.size === 0) throw new ApiError("The file is empty.", 422);
  if (file.size > MAX_MEDIA_BYTES) {
    throw new ApiError(
      `Images must be ${Math.round(MAX_MEDIA_BYTES / 1024 / 1024)}MB or smaller.`,
      413,
    );
  }

  const data = Buffer.from(await file.arrayBuffer());
  const [row] = await db
    .insert(media)
    .values({
      filename: file.name.slice(0, 200) || "upload",
      mimeType: file.type,
      size: data.byteLength,
      data,
    })
    .returning({
      id: media.id,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      createdAt: media.createdAt,
    });
  return { ...row, url: mediaUrl(row.id) };
}

/** Full row including bytes — only the media route should need this. */
export async function getImage(id: string) {
  return db.query.media.findFirst({ where: eq(media.id, id) });
}
