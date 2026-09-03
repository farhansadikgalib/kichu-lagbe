"use client";

// Replaces the root layout when it crashes — must render its own <html>/<body>
// and cannot rely on app CSS, fonts, or UI components.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "1rem",
          padding: "1.5rem",
          textAlign: "center",
          background: "#09090b",
          color: "#fafafa",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, margin: 0 }}>Something went wrong</h1>
        <p style={{ maxWidth: "24rem", color: "#a1a1aa", margin: 0 }}>
          KichuLagbe hit an unexpected error{error.digest ? ` (${error.digest})` : ""}. Please try
          again.
        </p>
        <button
          onClick={() => retry()}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.5rem",
            border: "none",
            background: "#fafafa",
            color: "#09090b",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
