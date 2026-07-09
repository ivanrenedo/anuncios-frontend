import type { ReactNode } from "react";

const COLORS: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  green: "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  purple: "bg-purple-100 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  orange: "bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300",
  amber: "bg-yellow-100 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-300",
};

export default function StatCard({
  label,
  value,
  icon,
  color = "primary",
  trend,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  color?: string;
  trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className={`grid h-10 w-10 place-items-center rounded-xl text-lg ${COLORS[color]}`}>
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-on-surface">{value}</div>
      {trend && <p className="mt-1 text-xs text-muted">{trend}</p>}
    </div>
  );
}
