"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LayoutGrid, Search } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { useCategoryTree } from "@/hooks/useCategories";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { resolveImage } from "@/lib/config";
import Skeleton from "@/components/Skeleton";
import type { CategoryTreeNode } from "@/lib/types";

/**
 * Categories browser. Layout mirrors the mobile experience: a left sidebar
 * of top-level categories drives the right panel of subcategories rendered
 * as tiles with thumbnails pulled from real published products. On mobile
 * (< sm) the sidebar collapses into a horizontal chip strip above the
 * grid so the vertical layout still fits.
 */
export default function CategoriesPage() {
  const { tree, loading: loadingTree, refetch: refetchTree } = useCategoryTree();
  const { products, refetch: refetchProducts } = useProducts(100);

  // First image found per leaf category id — used as the tile thumbnail so
  // subcategories with real listings look populated. Same shape as mobile.
  const imageByCategory = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of products) {
      const cid = p.category?.id;
      const raw = p.images?.[0]?.url;
      if (cid && raw && !map[cid]) {
        map[cid] = resolveImage(raw);
      }
    }
    return map;
  }, [products]);

  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const active: CategoryTreeNode | null =
    tree.find((c) => c.slug === activeSlug) ?? tree[0] ?? null;
  const subs: CategoryTreeNode[] = active?.children ?? [];

  // New categories from admin and new products supplying thumbnails to
  // previously-empty categories become visible on refocus without a manual
  // reload.
  useRefetchOnFocus([refetchTree, refetchProducts]);

  const accentColor = active?.color || "#006b5e";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Categorías</h1>
      <p className="mt-1 text-sm text-muted">
        Explora todo lo que se vende en Guinea Ecuatorial
      </p>

      {/* Search shortcut */}
      <Link
        href="/explore"
        className="mt-4 flex items-center gap-2 rounded-xl border border-outline-variant/40 bg-surface-lowest px-4 py-2.5 text-sm text-muted transition hover:bg-surface-container"
      >
        <Search size={16} className="text-muted" />
        Buscar en Bomelh
      </Link>

      {/* Body */}
      {loadingTree && tree.length === 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : !active ? (
        <p className="mt-10 text-center text-sm text-muted">
          Todavía no hay categorías.
        </p>
      ) : (
        <>
          {/* Mobile: horizontal category strip */}
          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {tree.map((cat) => {
              const isActive = cat.slug === active.slug;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveSlug(cat.slug)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                    isActive
                      ? "border-primary bg-primary/10 font-semibold text-primary"
                      : "border-outline-variant/40 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
                  }`}
                  style={
                    isActive
                      ? { borderColor: cat.color || undefined, color: cat.color || undefined, background: (cat.color || "#006b5e") + "18" }
                      : undefined
                  }
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 gap-6 lg:flex">
            {/* Desktop sidebar */}
            <aside className="hidden w-[220px] shrink-0 lg:block">
              <div className="sticky top-32 overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest">
                {tree.map((cat) => {
                  const isActive = cat.slug === active.slug;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveSlug(cat.slug)}
                      className={`relative flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition ${
                        isActive
                          ? "bg-surface-container font-bold text-on-surface"
                          : "text-on-surface-variant hover:bg-surface-container/60"
                      }`}
                    >
                      {isActive && (
                        <span
                          className="absolute left-0 top-2 bottom-2 w-1 rounded-r"
                          style={{ backgroundColor: cat.color || accentColor }}
                        />
                      )}
                      <span className="flex-1 truncate">{cat.label}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right detail */}
            <div className="min-w-0 flex-1">
              <h2 className="mb-4 text-lg font-extrabold text-on-surface">
                {active.label}
              </h2>

              {subs.length === 0 ? (
                <p className="text-sm text-muted">Sin subcategorías por ahora.</p>
              ) : (
                <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                  {subs.map((sub) => {
                    const img = imageByCategory[sub.id];
                    return (
                      <Link
                        key={sub.id}
                        href={`/explore?q=${encodeURIComponent(sub.label)}`}
                        className="group flex flex-col items-center gap-2"
                      >
                        <div
                          className="grid aspect-square w-full place-items-center overflow-hidden rounded-full border border-outline-variant/30 bg-surface-container transition group-hover:border-primary/40"
                          style={
                            img
                              ? undefined
                              : { color: accentColor }
                          }
                        >
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={img}
                              alt={sub.label}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <LayoutGrid size={24} strokeWidth={1.5} />
                          )}
                        </div>
                        <span className="text-center text-xs leading-snug text-on-surface">
                          {sub.label}
                        </span>
                      </Link>
                    );
                  })}

                  {/* Ver todo → search by the category label */}
                  <Link
                    href={`/explore?q=${encodeURIComponent(active.label)}`}
                    className="group flex flex-col items-center gap-2"
                  >
                    <div
                      className="grid aspect-square w-full place-items-center rounded-full border-2 border-dashed transition group-hover:border-primary"
                      style={{
                        borderColor: accentColor + "88",
                        backgroundColor: accentColor + "10",
                        color: accentColor,
                      }}
                    >
                      <LayoutGrid size={26} strokeWidth={1.6} />
                    </div>
                    <span
                      className="text-center text-xs font-semibold leading-snug"
                      style={{ color: accentColor }}
                    >
                      Ver todo
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
