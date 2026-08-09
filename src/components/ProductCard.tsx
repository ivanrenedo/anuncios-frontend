"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import {
  Heart,
  MapPin,
  BadgeCheck,
  Crown,
  Star,
  Zap,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Flame,
} from "lucide-react";
import type { Product } from "@/lib/types";
import { resolveImage } from "@/lib/config";
import { formatPrice, applyDiscount, timeAgo } from "@/lib/format";
import { useFavoriteIds, useToggleFavorite } from "@/hooks/useFavorites";
import { DELETE_PRODUCT } from "@/graphql/mutations";

interface Props {
  product: Product;
  /**
   * When true, replaces the heart/favorite button with owner actions
   * (edit + delete). Delete asks for a two-step confirmation inline. Used
   * on the owner's own profile view where "liking your own listing" makes
   * no sense.
   */
  ownerActions?: boolean;
}

export default function ProductCard({ product, ownerActions = false }: Props) {
  const { toggle, canFavorite } = useToggleFavorite();
  const favoriteIds = useFavoriteIds();
  const router = useRouter();
  // Heart reflects the user's actual favorites; override flips it instantly.
  const [override, setOverride] = useState<boolean | null>(null);
  const liked = override ?? favoriteIds.has(product.id);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteMut, { loading: deleting }] = useMutation(DELETE_PRODUCT, {
    // Keep every seller/user/home list in sync after removal.
    refetchQueries: [
      "ProductsBySeller",
      "SearchProducts",
      "GetProducts",
      "HomeSections",
    ],
    awaitRefetchQueries: false,
  });
  const img = resolveImage(product.images?.[0]?.url);
  const price = applyDiscount(product.price, product.discount);
  const isBoosted =
    !!product.boostedUntil && new Date(product.boostedUntil) > new Date();
  const sellerPlan = product.seller?.plan;

  const hasDiscount = (product.discount ?? 0) > 0 && (product.discount ?? 0) < 100;

  // "Rebajado hoy" chip (v2 Fase 6a). Backend stamps `priceReducedUntil` on
  // any price drop for 48 h; the chip is gated to Star/Premium sellers here
  // so BASIC and FREE sellers never render it even if the timestamp is set.
  const showRebajadoChip =
    !!product.priceReducedUntil &&
    new Date(product.priceReducedUntil) > new Date() &&
    (sellerPlan === "STAR" || sellerPlan === "PREMIUM");

    const tags: { label: string; bg: string; color: string }[] = [];
  if (product.propertyDetail?.operation || product.vehicleDetail?.operation) tags.push({ label: product.propertyDetail?.operation! ?? product.vehicleDetail?.operation!, bg: '#E1F5EE', color: '#0F6E56' });
  if (product.serviceDetail?.offerType) tags.push({ label: product.serviceDetail?.offerType, bg: '#EEEDFE', color: '#534AB7' });
  if (product.category?.label) tags.push({ label: product.category?.label, bg: '#E6F1FB', color: '#185FA5' });

  // Option A boost design: badges stack below the "Destacado" pill, so every
  // top-left overlay shifts one slot down per layer above it.
  const overlayLayers =
    (isBoosted ? 1 : 0) + (hasDiscount ? 1 : 0);


  const onLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!canFavorite) return;
    setOverride(!liked);
    toggle(product.id);
  };

  const onEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/edit-listing/${product.id}`);
  };

  const onDeleteAsk = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm(true);
  };

  const onDeleteCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConfirm(false);
  };

  const onDeleteConfirm = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await deleteMut({ variables: { id: product.id } });
    } catch (err: any) {
      alert(err?.message || "No se pudo eliminar el anuncio.");
      setDeleteConfirm(false);
    }
  };

  return (
    <Link
      href={`/product/${product.id}`}
      className={`flex flex-col h-full relative ${isBoosted ? " border-purple-600 border-2 rounded-xl" : ""}`}
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
        {isBoosted && (
          <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[10px] font-bold text-white shadow">
            <Zap size={10} className="fill-white" />
            Destacado
          </span>
        )}
        {price.hasDiscount && isBoosted && (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold text-white shadow" style={{...product.discount && { top: 34 }}}>
            −{price.percent}%
          </span>
        )}
        {price.hasDiscount && !isBoosted && (
          <span className="absolute left-2 top-2 rounded-full bg-danger px-2 py-0.5 text-[10px] font-extrabold text-white shadow" >
            −{price.percent}%
          </span>
        )}
        {product.condition && (
          <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-1 text-[10px] font-semibold tracking-wide text-white">
            {product.condition}
          </span>
        )}

       {tags.length > 0 && (
          <div className={`absolute top-2 left-2 row flex flex-wrap gap-1 max-w-[70%] z-8`} style={{...(overlayLayers > 0 && { top: 8 + overlayLayers * 26 })}}>
            {tags.map((t) => (
              <div key={t.label} style={{ backgroundColor: t.bg }} className="px-2 py-0.5 rounded-sm">
                <span style={{ color: t.color }} className="text-[11px] font-medium">{t.label}</span>
              </div>
            ))}
          </div>
        )}

        {ownerActions ? (
          <div className="absolute right-2 top-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onEdit}
              aria-label="Editar anuncio"
              className="grid h-8 w-8 place-items-center rounded-full bg-black/45 text-white backdrop-blur transition hover:bg-black/65"
            >
              <Pencil size={15} strokeWidth={1.9} />
            </button>
            <button
              type="button"
              onClick={onDeleteAsk}
              aria-label="Eliminar anuncio"
              className="grid h-8 w-8 place-items-center rounded-full bg-danger/85 text-white backdrop-blur transition hover:bg-danger"
            >
              <Trash2 size={15} strokeWidth={1.9} />
            </button>
          </div>
        ) : (
          canFavorite && (
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
          )
        )}

        {/* Owner delete confirmation overlay — sits on top of the image with
            the destructive action clearly gated. Clicking the backdrop or
            "Cancelar" dismisses. */}
        {ownerActions && deleteConfirm && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-black/70 p-3 text-center"
            onClick={onDeleteCancel}
          >
            <p className="text-sm font-bold leading-tight text-white">
              ¿Eliminar este anuncio?
            </p>
            <p className="text-[11px] leading-snug text-white/70">
              No se puede deshacer.
            </p>
            <div className="mt-1 flex gap-2">
              <button
                type="button"
                onClick={onDeleteConfirm}
                disabled={deleting}
                className="inline-flex items-center gap-1 rounded-lg bg-danger px-3 py-1.5 text-xs font-bold text-white shadow disabled:opacity-70"
              >
                {deleting ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Trash2 size={12} />
                )}
                Eliminar
              </button>
              <button
                type="button"
                onClick={onDeleteCancel}
                className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/25"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="px-3 py-4 group-[.grid]:px-2 group-[.grid]:py-3 sm:group-[.grid]:px-3 sm:group-[.grid]:py-4 sm:px-3 sm:py-4 flex flex-col flex-1">
        {/* Price first — the strongest signal */}
        <div className="flex flex-col flex-1">
          <div className="flex flex-wrap gap-1.5 items-center leading-3">
            <span className={`text-[17px] group-[.grid]:text-base sm:text-lg font-bold leading-5 ${price.hasDiscount ? "text-danger" : "text-primary"}`}>
              {formatPrice(price.final)}
            </span>
            {price.hasDiscount && (
              <span className="text-[13px] group-[.grid]:text-[11px] text-muted line-through">
                {formatPrice(price.original)}
              </span>
            )}
            {showRebajadoChip && (
              <span
                title="Precio bajado en las últimas 48 horas"
                className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-extrabold uppercase leading-none tracking-wide text-orange-600"
              >
                <Flame size={9} strokeWidth={2.5} />
                Rebajado
              </span>
            )}
          </div>

          <h3 className="mt-1.5 sm:mt-2 line-clamp-2 text-[17px] text-on-surface-variant group-[.grid]:text-sm flex-1">
            {product.title}
          </h3>

          {(product.city || product.createdAt) && (
            <div className="flex pb-1 row flex-wrap gap-1 text-[12px] group-[.grid]:text-[10px] sm:group-[.grid]:text-[11px] text-muted mt-1.5 items-center">
              {product.city && (
                <div className="flex gap-1 items-center">
                  <MapPin size={11} strokeWidth={1.5} className="shrink-0" />
                  <span className="line-clamp-1">{product.city}</span>
                </div>
              )}
              <span className="font-extrabold">·</span>
              {product.createdAt && (
                <div className="flex gap-1 items-center line-clamp-1 leading-0">
                  <Clock size={11} strokeWidth={1.5} className="shrink-0"/>
                  <span className="shrink-0">{timeAgo(product.createdAt)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {product.seller?.name && (
          <div className="flex gap-2 border-t z-10 border-outline-variant/25 relative items-center pt-1.5">
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
            <span className="line-clamp-1 text-[13px] group-[.grid]:text-[12px] font-semibold text-on-surface-variant flex-1">
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
              <BadgeCheck size={13} className="fill-primary text-white absolute ml-3.5 mt-4.5"  />
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
