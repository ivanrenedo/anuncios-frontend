"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MapPin, BadgeCheck } from "lucide-react";
import type { Product } from "@/lib/types";
import { resolveImage } from "@/lib/config";
import { formatPrice, applyDiscount } from "@/lib/format";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { toggle, canFavorite } = useToggleFavorite();
  const favoriteIds = useFavoriteIds();
  // Heart reflects the user's actual favorites; override flips it instantly.
  const [override, setOverride] = useState<boolean | null>(null);
  const liked = override ?? favoriteIds.has(product.id);
  const img = resolveImage(product.images?.[0]?.url);
  const sold = product.status === "sold";
  const accent = product.category?.color || undefined;
  const price = applyDiscount(product.price, product.discount);

  const onLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canFavorite) return;
    setOverride(!liked);
    toggle(product.id);
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className="group block animate-fade-in"
    >
      {/* Image */}
      <div className="relative mb-2 aspect-square overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-low">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl text-muted">
            📦
          </div>
        )}

        {sold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45">
            <span className="rounded-full bg-danger px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
              Vendido
            </span>
          </div>
        )}

        {product.condition && !sold && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
            {product.condition}
          </span>
        )}

        {price.hasDiscount && !sold && (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold text-white shadow">
            −{price.percent}%
          </span>
        )}

        {canFavorite && (
          <button
            onClick={onLike}
            aria-label={liked ? "Quitar de favoritos" : "Guardar"}
            className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50"
          >
            <Heart
              size={18}
              className={liked ? "fill-danger text-danger" : ""}
              strokeWidth={1.6}
            />
          </button>
        )}
      </div>

      {/* Title + price */}
      <h3 className="line-clamp-2 text-[15px] leading-5 text-on-surface">
        {product.title}
      </h3>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <span
          className="text-[15px] font-semibold leading-5"
          style={{ color: accent ?? "var(--color-primary)" }}
        >
          {formatPrice(price.final)}
        </span>
        {price.hasDiscount && (
          <span className="text-[11px] text-muted line-through">
            {formatPrice(price.original)}
          </span>
        )}
      </div>

      {product.city && (
        <div className="mt-1 flex items-center gap-1 text-[11px] text-muted">
          <MapPin size={11} strokeWidth={1.5} />
          <span className="truncate">{product.city}</span>
        </div>
      )}

      {product.seller?.name && (
        <div className="mt-3 flex items-center gap-2 border-t border-outline-variant/25 pt-2">
          {product.seller.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImage(product.seller.avatarUrl)}
              alt=""
              className="h-5 w-5 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-[9px] font-bold text-primary">
              {product.seller.name.charAt(0)}
            </div>
          )}
          <span className="flex-1 truncate text-[11px] font-semibold text-on-surface-variant">
            {product.seller.name}
          </span>
          {product.seller.verified && (
            <BadgeCheck size={13} className="fill-primary text-white" strokeWidth={0} />
          )}
        </div>
      )}
    </Link>
  );
}

/** Skeleton placeholder matching the card footprint. */
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-2 aspect-square rounded-2xl bg-surface-container" />
      <div className="h-4 w-3/4 rounded bg-surface-container" />
      <div className="mt-2 h-4 w-1/2 rounded bg-surface-container" />
    </div>
  );
}
