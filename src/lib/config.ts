export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const GRAPHQL_URL =
  process.env.NEXT_PUBLIC_GRAPHQL_URL || `${API_URL}/graphql`;

export const UPLOAD_URL = `${API_URL}/upload`;

/** Public-facing URL used for share links. The shop IS this URL, so we
 *  prefer `window.location.origin` at runtime and fall back to the env var
 *  for SSR/first render. */
export const SHARE_URL =
  process.env.NEXT_PUBLIC_SHARE_URL || "https://bomelh.com";

/** Consumer (shop) session token — issued via Google sign-in. */
export const TOKEN_KEY = "market_token";

/** Admin session token — issued via the email + PIN route handler. */
export const ADMIN_TOKEN_KEY = "market_admin_token";

/** Same-tab signal used after admin login/logout because `storage` only fires
 *  in other tabs. */
export const ADMIN_AUTH_EVENT = "market_admin_auth_changed";

/** Google OAuth Web Client ID (same one the mobile app uses). */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

/** Canonical share URL for a seller's public profile, tagged so the backend
 *  can attribute the visit to a QR-card scan. Uses `window.location.origin`
 *  at runtime so previews/staging don't hard-code the production domain. */
export function getQrProfileUrl(sellerId: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : SHARE_URL;
  return `${origin}/user/${sellerId}?src=qr`;
}

/** Resolve a possibly-relative image URL coming from the backend. */
export function resolveImage(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return `${API_URL}${url}`;
  return url;
}
