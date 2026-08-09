import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export default function SectionHeader({
  title,
  subtitle,
  icon,
  href,
  onClick,
}: {
  title: ReactNode;
  subtitle?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
}) {
  return (
    <div className="mb-4 flex items-end justify-between px-4 sm:px-6">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {href && (
        <Link
          href={href}
          onClick={onClick}
          className="hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface sm:flex"
        >
          Ver todos
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
