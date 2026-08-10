"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Heart, Package, Tag, X } from "lucide-react";
import { MY_FAVORITES } from "@/graphql/queries";
import { useAuth } from "@/hooks/useAuth";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { formatPrice } from "@/lib/format";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

const ALL = "__all__";

export default function SavedPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading, refetch } = useQuery(MY_FAVORITES, {
    skip: !isAuthenticated,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => Promise<any> };

  // New favorites (added from another page or the app) show up on return.
  useRefetchOnFocus([refetch]);

  const [activeCat, setActiveCat] = useState<string>(ALL);

  const products: Product[] = useMemo(
    () =>
      (data?.myFavorites ?? [])
        .map((f: any) => f.product)
        .filter(Boolean),
    [data],
  );

  // Distinct categories (id + label) present in the favorites list.
  const categoryChips = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of products) {
      const id = p.category?.id;
      const label = p.category?.label;
      if (id && label && !map.has(id)) map.set(id, label);
    }
    return Array.from(map, ([id, label]) => ({ id, label }));
  }, [products]);

  const visibleProducts = useMemo(
    () =>
      activeCat === ALL
        ? products
        : products.filter((p) => p.category?.id === activeCat),
    [products, activeCat],
  );

  // Sum of prices across the currently visible favorites — helps size up the
  // wishlist at a glance (mirrors mobile).
  const priceSum = useMemo(
    () => visibleProducts.reduce((s, p) => s + (Number(p.price) || 0), 0),
    [visibleProducts],
  );

  if (!authLoading && !isAuthenticated) {
    return (
      <EmptyState
        title="Guarda tus favoritos"
        body="Inicia sesión para guardar anuncios y verlos en cualquier momento."
        cta={{ href: "/login", label: "Iniciar sesión" }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl py-6">
      <div className="px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Favoritos</h1>
        <p className="mt-1 text-sm text-muted">
          {products.length} anuncios guardados
        </p>

        {/* Summary strip — total items + sum of prices */}
        {products.length > 0 && (
          <div className="mt-4 grid sm:grid-cols-2 grid-cols-1 gap-3">
            <SummaryCell
              icon={<Package size={16} />}
              label="Anuncios"
              value={String(visibleProducts.length)}
              hint={
                activeCat === ALL
                  ? "en tu lista"
                  : `de ${products.length} totales`
              }
            />
            <SummaryCell
              icon={<Tag size={16} />}
              label="Valor total"
              value={formatPrice(priceSum)}
              hint="suma de precios"
            />
          </div>
        )}

        {/* Category filter chips */}
        {categoryChips.length > 1 && (
          <div className="mt-4 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setActiveCat(ALL)}
              className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                activeCat === ALL
                  ? "border-primary bg-primary text-on-primary font-semibold"
                  : "border-outline-variant/40 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              Todos ({products.length})
            </button>
            {categoryChips.map((c) => {
              const count = products.filter(
                (p) => p.category?.id === c.id,
              ).length;
              const active = activeCat === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
                    active
                      ? "border-primary bg-primary text-on-primary font-semibold"
                      : "border-outline-variant/40 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
                  }`}
                >
                  {c.label} ({count})
                </button>
              );
            })}
            {activeCat !== ALL && (
              <button
                onClick={() => setActiveCat(ALL)}
                aria-label="Quitar filtro"
                className="shrink-0 grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-6">
        {!loading && visibleProducts.length === 0 ? (
          <EmptyState
            title={
              products.length === 0
                ? "Aún no tienes favoritos"
                : "Sin favoritos en esta categoría"
            }
            body={
              products.length === 0
                ? "Toca el corazón en cualquier anuncio para guardarlo aquí."
                : "Prueba con otra categoría o quita el filtro."
            }
            cta={{ href: "/explore", label: "Explorar anuncios" }}
            inline
          />
        ) : (
          <ProductGrid products={visibleProducts} loading={loading} />
        )}
      </div>
    </div>
  );
}

function SummaryCell({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
        </p>
        <p className="mt-0.5 truncate text-lg font-extrabold text-on-surface">
          {value}
        </p>
        <p className="text-[11px] text-muted">{hint}</p>
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
  inline,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
  inline?: boolean;
}) {
  return (
    <div className={`px-6 text-center ${inline ? "py-16" : "py-28"}`}>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Heart size={28} />
      </div>
      <p className="mt-4 text-lg font-bold text-on-surface">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      <Link
        href={cta.href}
        className="mt-5 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary/90"
      >
        {cta.label}
      </Link>
    </div>
  );
}
