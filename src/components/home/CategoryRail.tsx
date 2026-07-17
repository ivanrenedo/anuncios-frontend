"use client";

import Link from "next/link";
import {
  Shirt,
  Cpu,
  Car,
  Home as HomeIcon,
  Handshake,
  Briefcase,
  Building2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
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
  marketplace: ShoppingBag,
};

export interface RailCategory {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
}

/**
 * Category card grid (reference-style "Explora por categoría").
 * Renders real backend categories only.
 */
export default function CategoryRail({ categories }: { categories: RailCategory[] }) {
  if (!categories.length) return null;

  return (
    <div className="grid grid-cols-2 gap-3 px-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-5">
      {categories.map((c) => {
        const Icon = ICONS[c.slug] || Sparkles;
        const color = c.color || "#006b5e";
        return (
          <Link
            key={c.id}
            href={`/explore?cat=${c.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-3.5 transition hover:border-primary/40 hover:shadow-soft"
          >
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl transition group-hover:scale-105"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon size={22} strokeWidth={1.8} />
            </span>
            <span className="truncate text-sm font-bold text-on-surface">
              {c.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
