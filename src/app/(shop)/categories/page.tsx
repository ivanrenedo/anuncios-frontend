"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { CATEGORY_TREE } from "@/graphql/queries";
import { ChevronRight } from "lucide-react";
import Skeleton from "@/components/Skeleton";
import type { CategoryTreeNode } from "@/lib/types";

export default function CategoriesPage() {
  const { data, loading } = useQuery(CATEGORY_TREE) as {
    data: any;
    loading: boolean;
  };

  const roots: CategoryTreeNode[] = data?.categoryTree ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Categorías</h1>
      <p className="mt-1 text-sm text-muted">
        Explora todo lo que se vende en Guinea Ecuatorial
      </p>

      {loading ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      ) : roots.length === 0 ? (
        <p className="mt-10 text-center text-sm text-muted">
          Todavía no hay categorías.
        </p>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {roots.map((root) => {
            const color = root.color || "#006b5e";
            const kids = root.children ?? [];
            return (
              <div
                key={root.id}
                className="overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest transition hover:shadow-card"
              >
                {/* Colored header */}
                <Link
                  href={`/explore?cat=${root.slug}`}
                  className="block px-5 py-4 transition hover:opacity-90"
                  style={{ backgroundColor: `${color}18` }}
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold" style={{ color }}>
                      {root.label}
                    </h2>
                    <ChevronRight size={20} style={{ color }} />
                  </div>
                </Link>

                {/* Subcategories as chips */}
                {kids.length > 0 ? (
                  <div className="flex flex-wrap gap-2 px-5 py-4">
                    {kids.map((kid) => (
                      <Link
                        key={kid.id}
                        href={`/explore?cat=${kid.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/30 px-3 py-1.5 text-sm font-medium text-on-surface transition hover:bg-surface-container hover:border-primary/40"
                      >
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: kid.color || color }}
                        />
                        {kid.label}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="px-5 py-4">
                    <p className="text-sm text-muted">Sin subcategorías</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
