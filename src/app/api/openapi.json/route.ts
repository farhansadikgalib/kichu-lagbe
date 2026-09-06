import { NextResponse } from "next/server";
import { buildOpenApiSpec } from "@/lib/openapi/spec";

/** The OpenAPI document Swagger UI (/api-docs) renders. Static per deployment. */
export function GET() {
  return NextResponse.json(buildOpenApiSpec(), {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
