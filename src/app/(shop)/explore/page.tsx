"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

type SortKey = "recent" | "price-asc" | "price-desc" | "views";

function ExploreInner() {
  const params = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const initialCat = params.get("cat") ?? "all";

  const { products, loading } = useProducts(100);
  const { categories } = useCategories();

  const [q, setQ] = useState(initialQ);
  const [cat, setCat] = useState(initialCat);
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<SortKey>("recent");

  const filtered = useMemo(() => {
    let list: Product[] = [...products];
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(t) ||
          p.description?.toLowerCase().includes(t) ||
          p.category?.label?.toLowerCase().includes(t)
      );
    }
    if (cat !== "all") list = list.filter((p) => p.category?.slug === cat);
    if (city.trim())
      list = list.filter((p) =>
        p.city?.toLowerCase().includes(city.trim().toLowerCase())
      );

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price-desc":
        list.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "views":
        list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
        break;
      default:
        list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));
    }
    return list;
  }, [products, q, cat, city, sort]);

  return (
    <div className="mx-auto max-w-7xl py-5">
      {/* Search bar */}
      <div className="px-4 sm:px-6">
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar anuncios, marcas y más…"
            className="h-12 w-full rounded-full border border-outline-variant/50 bg-surface-lowest pl-11 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide sm:px-6">
        <Chip active={cat === "all"} onClick={() => setCat("all")}>
          Todas
        </Chip>
        {categories.map((c: any) => (
          <Chip key={c.id} active={cat === c.slug} onClick={() => setCat(c.slug)}>
            {c.label}
          </Chip>
        ))}
      </div>

      {/* Filters row */}
      <div className="mt-3 flex flex-wrap items-center gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-on-surface-variant">
          <SlidersHorizontal size={16} />
          Filtros
        </div>
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ubicación (Ciudad)"
          className="rounded-full border border-outline-variant/50 bg-surface-lowest px-3 py-1.5 text-sm outline-none"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-full border border-outline-variant/50 bg-surface-lowest px-3 py-1.5 text-sm outline-none"
        >
          <option value="recent">Más recientes</option>
          <option value="price-asc">Precio: menor a mayor</option>
          <option value="price-desc">Precio: mayor a menor</option>
          <option value="views">Más vistos</option>
        </select>
        <span className="ml-auto text-sm text-muted">
          {filtered.length} resultados
        </span>
      </div>

      {/* Results */}
      <div className="mt-6">
        {!loading && filtered.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <p className="text-lg font-bold text-on-surface">Sin resultados</p>
            <p className="mt-1 text-sm text-muted">
              Prueba con otra búsqueda o quita algún filtro.
            </p>
          </div>
        ) : (
          <ProductGrid products={filtered} loading={loading} />
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-primary text-on-primary"
          : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
      }`}
    >
      {children}
    </button>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted">Cargando…</div>}>
      <ExploreInner />
    </Suspense>
  );
}
