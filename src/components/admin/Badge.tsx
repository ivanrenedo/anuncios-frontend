import type { ReactNode } from "react";

const VARIANTS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  hide: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-on-surface-variant",
  sold: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-on-surface-variant",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  danger: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  draft: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-muted",
  verified: "bg-primary/15 text-primary",
  unverified: "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-muted",
};

export default function Badge({
  variant = "draft",
  children,
}: {
  variant?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        VARIANTS[variant] ?? VARIANTS.draft
      }`}
    >
      {children}
    </span>
  );
}
