import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi/spec";

/**
 * The OpenAPI document Swagger UI (/api-docs) renders — customer-facing
 * operations only. Admin and rider endpoints are intentionally not published.
 */
export function GET() {
  return NextResponse.json(buildOpenApiSpec("customer"), {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
