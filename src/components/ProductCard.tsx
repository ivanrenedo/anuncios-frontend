"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, MapPin, BadgeCheck, Crown, Star, Zap } from "lucide-react";
import type { Product } from "@/lib/types";
import { resolveImage } from "@/lib/config";
import { formatPrice, applyDiscount, timeAgo } from "@/lib/format";
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
  const price = applyDiscount(product.price, product.discount);
  const isBoosted =
    !!product.boostedUntil && new Date(product.boostedUntil) > new Date();
  const sellerPlan = product.seller?.plan;
  const operationTag =
    product.propertyDetail?.operation ||
    product.serviceDetail?.offerType ||
    product.vehicleDetail?.operation ||
    null;

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
      className="group block animate-fade-in overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest transition hover:border-outline-variant/60 hover:shadow-card"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-surface-low">
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

        {isBoosted && !sold && !price.hasDiscount && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <Zap size={10} className="fill-white" />
            Destacado
          </span>
        )}

        {operationTag && !sold && (
          <span className="absolute bottom-2 right-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
            {operationTag}
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

      {/* Body */}
      <div className="p-3">
        {/* Price first — the strongest signal */}
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold leading-5 text-on-surface">
            {formatPrice(price.final)}
          </span>
          {price.hasDiscount && (
            <span className="text-[11px] text-muted line-through">
              {formatPrice(price.original)}
            </span>
          )}
        </div>

        <h3 className="mt-1 line-clamp-2 text-[13px] leading-[18px] text-on-surface-variant">
          {product.title}
        </h3>

        {(product.city || product.createdAt) && (
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted">
            {product.city && (
              <>
                <MapPin size={11} strokeWidth={1.5} className="shrink-0" />
                <span className="truncate">{product.city}</span>
              </>
            )}
            {product.city && product.createdAt && (
              <span className="px-0.5">·</span>
            )}
            {product.createdAt && (
              <span className="shrink-0">{timeAgo(product.createdAt)}</span>
            )}
          </div>
        )}

        {product.seller?.name && (
          <div className="mt-2.5 flex items-center gap-2 border-t border-outline-variant/25 pt-2">
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
            {sellerPlan === "PREMIUM" && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-purple-600">
                <Crown size={10} className="text-white" strokeWidth={2} />
              </span>
            )}
            {sellerPlan === "STAR" && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-amber-500">
                <Star size={10} className="fill-white text-white" strokeWidth={0} />
              </span>
            )}
            {product.seller.verified && (
              <BadgeCheck size={13} className="fill-primary text-white" strokeWidth={0} />
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

/** Skeleton placeholder matching the card footprint. */
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest">
      <div className="aspect-square bg-surface-container" />
      <div className="space-y-2 p-3">
        <div className="h-5 w-20 rounded bg-surface-container" />
        <div className="h-4 w-full rounded bg-surface-container" />
        <div className="h-3 w-2/3 rounded bg-surface-container" />
      </div>
    </div>
  );
}
