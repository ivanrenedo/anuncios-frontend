"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import type { Product } from "@/lib/types";

const DEFAULT_PAGE_SIZE = 8;

export default function ProductGrid({
  products,
  loading,
  skeletonCount = 20,
  ownerActions = false,
  paginate = true,
  pageSize = DEFAULT_PAGE_SIZE,
  initialCount,
  pinnedIds,
  autoBumpedIds,
  onTogglePin,
  onToggleAutoBump,
}: {
  products: Product[];
  loading?: boolean;
  skeletonCount?: number;
  /**
   * Forwarded to each ProductCard. When true, cards show edit + delete
   * instead of the heart. Used on the owner's own profile view.
   */
  ownerActions?: boolean;
  /**
   * When true (default), only the first `initialCount` items are shown and a
   * "Cargar más" button reveals the rest en incrementos de `pageSize` — mismo
   * comportamiento que la app móvil. Ponlo a false para renderizar todo de
   * golpe (por ejemplo, en la búsqueda paginada del servidor).
   */
  paginate?: boolean;
  /** Cuántos productos revela cada click en "Cargar más". */
  pageSize?: number;
  /** Cuántos productos mostrar de entrada. Por defecto == pageSize. */
  initialCount?: number;
  /** v2 Fase 11.2 — set de ids fijados; cada card los renderiza con badge. */
  pinnedIds?: Set<string>;
  /** v2 Fase 11.3 — set de ids con auto-bump; badge amarillo. */
  autoBumpedIds?: Set<string>;
  /** v2 Fase 11.3 — habilita botón pin por card cuando el user es owner y
   *  su plan lo permite. La factoría por-id vive en el padre. */
  onTogglePin?: (productId: string) => void;
  /** v2 Fase 11.3 — habilita botón auto-bump por card, mismo patrón. */
  onToggleAutoBump?: (productId: string) => void;
}) {
  const startCount = initialCount ?? pageSize;
  const [count, setCount] = useState(startCount);
  const [loadingMore, setLoadingMore] = useState(false);

  const visible = paginate ? products.slice(0, count) : products;
  const hasMore = paginate && count < products.length;

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    // Pequeña espera para dar feedback visual antes de renderizar el nuevo
    // lote — evita que el botón parezca no reaccionar en listas pequeñas.
    setTimeout(() => {
      setCount((c) => Math.min(c + pageSize, products.length));
      setLoadingMore(false);
    }, 250);
  };

  return (
    <div className="space-y-6 px-4 sm:px-6 group-[.explore]:px-0">
      <div className="grid grid-cols-2 gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-6 md:grid-cols-3 lg:grid-cols-4">
        {loading && products.length === 0
          ? Array.from({ length: skeletonCount }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))
          : visible.map((p) => (
            <div key={p.id} className="group grid animate-fade-in overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest transition hover:border-outline-variant/60 hover:shadow-card">
              <ProductCard
                key={p.id}
                product={p}
                ownerActions={ownerActions}
                isPinned={pinnedIds?.has(p.id) ?? false}
                isAutoBumped={autoBumpedIds?.has(p.id) ?? false}
                onTogglePin={onTogglePin ? () => onTogglePin(p.id) : undefined}
                onToggleAutoBump={
                  onToggleAutoBump ? () => onToggleAutoBump(p.id) : undefined
                }
              />
            </div>
            ))}
      </div>

      {hasMore ? (
        <button
          type="button"
          onClick={loadMore}
          disabled={loadingMore}
          className="mx-auto my-8 flex h-11 w-full max-w-xs items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-surface-container disabled:opacity-70"
          aria-label="Cargar más anuncios"
        >
          {loadingMore ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              <Plus size={16} strokeWidth={2} />
              Cargar más
            </>
          )}
        </button>
      ) : paginate && visible.length > 0 && products.length > startCount ? (
        <p className="text-center text-xs text-muted">
          Has visto todos los anuncios
        </p>
      ) : null}
    </div>
  );
}
