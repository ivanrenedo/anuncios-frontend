export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || `${API_URL}/graphql`;

export const UPLOAD_URL = `${API_URL}/upload`;

/** Consumer (shop) session token — issued via Google sign-in. */
export const TOKEN_KEY = "market_token";

/** Admin session token — issued via the email + PIN route handler. */
export const ADMIN_TOKEN_KEY = "market_admin_token";

/** Google OAuth Web Client ID (same one the mobile app uses). */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Resolve a possibly-relative image URL coming from the backend. */
export function resolveImage(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}
