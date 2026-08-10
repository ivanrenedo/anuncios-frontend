/** Format a numeric price as XAF, e.g. 85000 -> "85.000 XAF". */
export function formatPrice(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0 XAF";
  return `${n.toLocaleString("es")} XAF`;
}

/** Apply a percentage discount to a price. `discount` is 0–100. */
export function applyDiscount(
  price: number | string | null | undefined,
  discount?: number | null,
) {
  const original = Number(price) || 0;
  const percent = discount ?? 0;
  const final =
    percent > 0 ? Math.round(original * (1 - percent / 100)) : original;
  return {
    original,
    final,
    percent,
    savings: original - final,
    hasDiscount: percent > 0,
  };
}

/** Relative "time ago" in Spanish from an ISO date string. */
export function timeAgo(iso?: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const diff = Date.now() - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "hace un momento";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `hace ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `hace ${months} meses`;
  const years = Math.floor(days / 365);
  return `hace ${years} años`;
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** Compact numeric formatter for counters (e.g. "1.234", "12,3 K"). */
export function formatNumber(
  value: number | string | null | undefined,
): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "0";
  if (Math.abs(n) >= 1_000_000_000) {
    let result = (n / 1_000_000_000)
      .toFixed(1)
      .replace(/\.0$/, "")
      .replace(".", ",");
    return `${Math.round(Number(result)).toLocaleString("es")} B`;
  }
  if (Math.abs(n) >= 1_000_000) {
    let result = (n / 1_000_000)
      .toFixed(1)
      .replace(/\.0$/, "")
      .replace(".", ",");
    return `${Math.round(Number(result)).toLocaleString("es")} M`;
  }
  if (Math.abs(n) >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "").replace(".", ",")} K`;
  }
  return Math.round(n).toLocaleString("es");
}
