"use client";

import Link from "next/link";
import {
  Baby,
  BookOpen,
  Briefcase,
  Building2,
  Car,
  Dumbbell,
  HelpCircle,
  House,
  LayoutGrid,
  Laptop,
  Refrigerator,
  Shirt,
  Smartphone,
  Sparkles,
  Watch,
  Wrench,
  type LucideIcon,
} from "lucide-react";

// Iconos por `icon` que expone el backend — mismo mapa que la app móvil.
const ICON_MAP: Record<string, LucideIcon> = {
  baby: Baby,
  sparkles: Sparkles,
  bookOpen: BookOpen,
  "briefcase-business": Briefcase,
  wrench: Wrench,
  dumbbell: Dumbbell,
  building2: Building2,
  car: Car,
  refrigerator: Refrigerator,
  house: House,
  laptop: Laptop,
  smartphone: Smartphone,
  shirt: Shirt,
  watch: Watch,
};

const DEFAULT_COLOR = "#006b5e";

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export interface RailCategory {
  id: string;
  slug: string;
  label: string;
  color?: string | null;
  icon?: string | null;
}

/**
 * Rail horizontal de categorías (mismo diseño que CategoryScroll de la app
 * móvil): círculo con el icono, label debajo, scroll horizontal. Cierra con
 * un item "Todo" que enlaza al listado completo de categorías.
 */
export default function CategoryRail({ categories }: { categories: RailCategory[] }) {
  if (!categories.length) return null;

  return (
    <div className="flex gap-3.5 sm:gap-5 overflow-x-auto w-full scrollbar-hide px-4 py-2.5 sm:px-6">
      {categories.map((cat) => {
        const Icon = ICON_MAP[cat.icon ?? ""] ?? HelpCircle;
        const color = cat.color || DEFAULT_COLOR;
        return (
          <Link
            key={cat.id}
            href={`/explore?filterCat=${encodeURIComponent(cat.label)}`}
            className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
            aria-label={`Buscar ${cat.label}`}
          >
            <span
              className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-full transition group-hover:scale-105"
              style={{ backgroundColor: hexToRgba(color, 0.12), color }}
            >
              <Icon size={25} strokeWidth={1.8} />
            </span>
            <span className="block w-full truncate text-[11px] font-semibold leading-[14px] text-on-surface-variant">
              {cat.label}
            </span>
          </Link>
        );
      })}
      <Link
        href="/categories"
        className="flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
        aria-label="Ver todas las categorías"
      >
        <span className="grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-full bg-primary/10 text-primary transition group-hover:scale-105">
          <LayoutGrid size={25} strokeWidth={1.9} />
        </span>
        <span className="block w-full truncate text-[11px] font-semibold leading-[14px] text-primary">
          Todo
        </span>
      </Link>
    </div>
  );
}
