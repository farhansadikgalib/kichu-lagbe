import "server-only";
import { eq } from "drizzle-orm";
import sharp from "sharp";
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

/**
 * Output dimensions per placement, matching how the image is displayed:
 * product shots fill a square tile, section art a 16:9 banner. Sized for 2×
 * (retina) at the largest rendered width so the optimizer never upscales.
 */
export const IMAGE_FITS = {
  square: { width: 800, height: 800 },
  wide: { width: 1600, height: 900 },
} as const;
export type ImageFit = keyof typeof IMAGE_FITS;

export function isImageFit(value: unknown): value is ImageFit {
  return typeof value === "string" && value in IMAGE_FITS;
}

const WEBP_QUALITY = 82;

/**
 * Normalises an upload into a WebP at exactly the display size: honours EXIF
 * rotation, cover-crops to the target shape (subject-aware, never stretched)
 * and keeps GIF animation. Every stored asset therefore has the same
 * dimensions as the slot it's shown in.
 */
async function toWebp(input: Buffer, fit: ImageFit) {
  const { width, height } = IMAGE_FITS[fit];
  try {
    return await sharp(input, { animated: true })
      .rotate()
      .resize(width, height, { fit: "cover", position: "attention" })
      .webp({ quality: WEBP_QUALITY, effort: 4 })
      .toBuffer();
  } catch {
    throw new ApiError("That file isn't a readable image.", 422);
  }
}

/** Validates, resizes to `fit`, converts to WebP and persists an uploaded image. */
export async function putImage(file: File, fit: ImageFit = "square"): Promise<MediaAsset> {
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

  const data = await toWebp(Buffer.from(await file.arrayBuffer()), fit);
  const baseName = (file.name || "upload").replace(/\.[^.]+$/, "").slice(0, 190) || "upload";
  const [row] = await db
    .insert(media)
    .values({
      filename: `${baseName}.webp`,
      mimeType: "image/webp",
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
