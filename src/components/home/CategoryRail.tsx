"use client";

import Link from "next/link";
import { Shirt, Cpu, Car, Home as HomeIcon, Handshake, Briefcase, Building2, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  moda: Shirt,
  tech: Cpu,
  tecnologia: Cpu,
  coches: Car,
  vehiculos: Car,
  hogar: HomeIcon,
  servicios: Handshake,
  empleo: Briefcase,
  inmobiliaria: Building2,
};

export interface RailCategory {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
}

export default function CategoryRail({ categories }: { categories: RailCategory[] }) {
  if (!categories.length) return null;

  return (
    <section className="pt-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex gap-3 overflow-x-auto px-4 pb-2 scrollbar-hide sm:px-6">
          {categories.map((c) => {
            const Icon = ICONS[c.slug] || Sparkles;
            const color = c.color || "#006b5e";
            return (
              <Link
                key={c.id}
                href={`/explore?cat=${c.slug}`}
                className="flex shrink-0 flex-col items-center gap-2"
              >
                <span
                  className="grid h-16 w-16 place-items-center rounded-2xl transition hover:scale-105"
                  style={{ backgroundColor: `${color}1a`, color }}
                >
                  <Icon size={26} strokeWidth={1.8} />
                </span>
                <span className="max-w-[72px] truncate text-xs font-semibold text-on-surface-variant">
                  {c.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
