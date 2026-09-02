import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Throw inside route handlers to short-circuit with a typed HTTP error. */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Uniform error handling for all route handlers. */
export function handleApiError(err: unknown) {
  if (err instanceof ApiError) return fail(err.message, err.status);
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const path = first.path.join(".");
    return fail(path ? `${path}: ${first.message}` : first.message, 422);
  }
  console.error("[api]", err);
  return fail("Something went wrong. Please try again.", 500);
}
