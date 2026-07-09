"use client";

import Link from "next/link";
import { useCategories } from "@/hooks/useCategories";
import { ChevronRight } from "lucide-react";
import Skeleton from "@/components/Skeleton";

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  const roots = categories.filter((c: any) => !c.parentId);
  const childrenOf = (id: string) =>
    categories.filter((c: any) => c.parentId === id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Categorías</h1>
      <p className="mt-1 text-sm text-muted">
        Explora todo lo que se vende en Guinea Ecuatorial
      </p>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : roots.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          Todavía no hay categorías.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((root: any) => {
            const color = root.color || "#006b5e";
            const kids = childrenOf(root.id);
            return (
              <div
                key={root.id}
                className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest shadow-soft"
              >
                <Link
                  href={`/explore?cat=${root.slug}`}
                  className="block px-5 py-4 transition hover:opacity-90"
                  style={{ backgroundColor: `${color}14` }}
                >
                  <h2 className="text-lg font-extrabold" style={{ color }}>
                    {root.label}
                  </h2>
                </Link>
                <ul className="divide-y divide-outline-variant/20">
                  {kids.map((kid: any) => (
                    <li key={kid.id}>
                      <Link
                        href={`/explore?cat=${kid.slug}`}
                        className="flex items-center justify-between px-5 py-3 transition hover:bg-surface-container"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: kid.color || color }}
                          />
                          <p className="text-sm font-semibold text-on-surface">
                            {kid.label}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </Link>
                    </li>
                  ))}
                  {kids.length === 0 && (
                    <li className="px-5 py-3 text-sm text-muted">
                      Sin subcategorías
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
