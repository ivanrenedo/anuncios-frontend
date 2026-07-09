import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SectionHeader({
  title,
  href,
}: {
  title: string;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between px-4 sm:px-6">
      <h2 className="text-lg font-extrabold tracking-tight text-on-surface sm:text-xl">
        {title}
      </h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-0.5 text-sm font-semibold text-primary hover:underline"
        >
          Ver todo
          <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}
