const KEY = "market_viewer_key";

/**
 * Stable per-device id used to dedup product views server-side, so refreshing
 * (or React StrictMode's double-mount in dev) doesn't inflate the counter.
 */
export function getViewerKey(): string {
  if (typeof window === "undefined") return "";
  let k = localStorage.getItem(KEY);
  if (!k) {
    k =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(KEY, k);
  }
  return k;
}
