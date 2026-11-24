/**
 * Resolves the Tijarah Backend API base URL (`/api/v1`) for both server-side
 * (Vercel Service Binding via `process.env.BACKEND_URL`) and client-side
 * (same-origin `/api/v1` rewrite on Vercel or localhost:5000 in local dev).
 */
export function getBackendApiBaseUrl(): string {
  // 1. Server-side (SSR / Route Handlers / Server Components)
  if (typeof window === "undefined") {
    const boundBackendUrl = process.env.BACKEND_URL;
    if (boundBackendUrl) {
      return new URL("/api/v1", boundBackendUrl).toString().replace(/\/$/, "");
    }

    const explicitServerUrl =
      process.env.NEXT_PUBLIC_BE_URL || process.env.NEXT_PUBLIC_API_URL;
    if (explicitServerUrl) {
      return explicitServerUrl.replace(/\/$/, "");
    }

    return "http://localhost:5000/api/v1";
  }

  // 2. Client-side (Browser)
  const explicitClientUrl =
    process.env.NEXT_PUBLIC_BE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (explicitClientUrl) {
    return explicitClientUrl.replace(/\/$/, "");
  }

  // Local standalone Next.js dev (port 3000) calling Fastify on port 5000
  if (
    window.location.hostname === "localhost" &&
    window.location.port === "3000"
  ) {
    return "http://localhost:5000/api/v1";
  }

  // Shared domain on Vercel (`vercel.json` routes `/api/(.*)` -> `back-end`)
  return "/api/v1";
}
