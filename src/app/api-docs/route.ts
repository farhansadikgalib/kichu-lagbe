import { BRAND } from "@/lib/constants";
import { renderSwaggerPage, swaggerResponse } from "@/lib/openapi/swagger-page";

/**
 * Public API reference — customer-facing endpoints only (browsing, checkout,
 * order tracking, account). Admin and rider operations are not published
 * here; see AUDIENCE in @/lib/openapi/spec if that ever needs to change.
 */
export function GET() {
  return swaggerResponse(
    renderSwaggerPage({
      pageTitle: `${BRAND.name} API — Customer`,
      specUrl: "/api/openapi.json",
    }),
  );
}
