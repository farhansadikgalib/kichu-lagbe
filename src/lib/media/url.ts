/** Public path for an uploaded asset; safe to import from client code. */
export function mediaUrl(id: string) {
  return `/api/media/${id}`;
}

/**
 * Whether an image URL lives outside this deployment. External hosts aren't
 * in `images.remotePatterns`, so `next/image` must bypass the optimizer.
 */
export function isExternalImage(url: string) {
  return /^https?:\/\//i.test(url);
}
