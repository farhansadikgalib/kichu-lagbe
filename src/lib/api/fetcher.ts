/** Client-side data helpers shared by all SWR hooks and mutations. */

export class FetchError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "FetchError";
  }
}

async function parseError(res: Response): Promise<never> {
  let message = "Request failed";
  try {
    const body = (await res.json()) as { error?: string };
    if (body.error) message = body.error;
  } catch {
    /* non-JSON error body */
  }
  throw new FetchError(message, res.status);
}

/** SWR fetcher — unwraps the { data } envelope. */
export async function swrFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) await parseError(res);
  const body = (await res.json()) as { data: T };
  return body.data;
}

/** JSON mutation helper for POST/PATCH/DELETE. */
export async function apiMutate<T>(
  url: string,
  options: { method?: "POST" | "PATCH" | "DELETE" | "PUT"; body?: unknown } = {},
): Promise<T> {
  const res = await fetch(url, {
    method: options.method ?? "POST",
    headers: options.body !== undefined ? { "Content-Type": "application/json" } : undefined,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) await parseError(res);
  const body = (await res.json()) as { data: T };
  return body.data;
}

/** Multipart upload helper (files) — same envelope and error handling as `apiMutate`. */
export async function apiUpload<T>(url: string, form: FormData): Promise<T> {
  const res = await fetch(url, { method: "POST", body: form });
  if (!res.ok) await parseError(res);
  const body = (await res.json()) as { data: T };
  return body.data;
}
