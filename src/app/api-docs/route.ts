import { BRAND } from "@/lib/constants";

const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5";

/**
 * Interactive API reference (Swagger UI) for /api/openapi.json. Plain HTML
 * from a route handler — no React or bundle cost; the UI loads from a CDN.
 * "Try it out" sends the browser's own session cookie, so sign in through
 * the login operation first and every protected call works from here.
 */
export function GET() {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${BRAND.name} API — Reference</title>
  <link rel="icon" href="/icon.svg" />
  <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0b0b0d; }
    .swagger-ui, .swagger-ui .info .title, .swagger-ui .opblock-tag, .swagger-ui .info p,
    .swagger-ui .info li, .swagger-ui .opblock .opblock-summary-description,
    .swagger-ui .model-title, .swagger-ui .model, .swagger-ui table thead tr th,
    .swagger-ui .parameter__name, .swagger-ui .response-col_status,
    .swagger-ui .response-col_description, .swagger-ui .opblock-description-wrapper p,
    .swagger-ui .tab li, .swagger-ui label, .swagger-ui .parameter__type,
    .swagger-ui section.models h4, .swagger-ui .info a { color: #e7e7ea; }
    .swagger-ui .info code, .swagger-ui .opblock-description-wrapper code { color: #f5b544; }
    .swagger-ui .topbar { display: none; }
    .swagger-ui .scheme-container { background: #131316; box-shadow: none; }
    .swagger-ui section.models, .swagger-ui section.models .model-container { background: #131316; }
    .swagger-ui .opblock .opblock-section-header { background: #1a1a1e; }
    .swagger-ui input[type=text], .swagger-ui textarea, .swagger-ui select { background: #1a1a1e; color: #e7e7ea; }
    .swagger-ui .btn { color: #e7e7ea; }
    .swagger-ui .info .title small pre { color: #0b0b0d; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI}/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.ui = SwaggerUIBundle({
      url: "/api/openapi.json",
      dom_id: "#swagger-ui",
      deepLinking: true,
      persistAuthorization: true,
      withCredentials: true,
      tryItOutEnabled: true,
      displayRequestDuration: true,
      docExpansion: "list",
      tagsSorter: "alpha",
    });
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
