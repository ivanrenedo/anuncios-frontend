"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Share2,
  Phone,
  Shield,
  BadgeCheck,
  MapPin,
  Eye,
  Star,
  Clock,
  Tag,
  Flag,
} from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import { useMutation, useQuery } from "@apollo/client/react";
import { VIEW_PRODUCT } from "@/graphql/mutations";
import { SELLER_RATING, REVIEWS_BY_SELLER } from "@/graphql/queries";
import { useToggleFavorite, useFavoriteIds } from "@/hooks/useFavorites";
import { resolveImage } from "@/lib/config";
import { getViewerKey } from "@/lib/viewer";
import { formatPrice, timeAgo, applyDiscount } from "@/lib/format";
import Skeleton from "@/components/Skeleton";
import ReportModal from "@/components/ReportModal";

function WhatsAppIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-lowest px-3 py-1.5 text-xs font-medium text-on-surface-variant">
      {icon}
      {children}
    </span>
  );
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { product, loading } = useProduct(id);
  const { toggle, canFavorite } = useToggleFavorite();
  const favoriteIds = useFavoriteIds();
  const [trackView] = useMutation(VIEW_PRODUCT);
  const [likeOverride, setLikeOverride] = useState<boolean | null>(null);
  const liked = likeOverride ?? (product ? favoriteIds.has(product.id) : false);
  const [active, setActive] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);

  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (!id || tracked.current === id) return;
    tracked.current = id;
    trackView({ variables: { id, viewerKey: getViewerKey() } }).catch(() => {});
  }, [id, trackView]);

  const sellerId = product?.seller?.id;
  const { data: ratingData } = useQuery(SELLER_RATING, {
    variables: { sellerId: sellerId || "" },
    skip: !sellerId,
  }) as { data: any };
  const { data: reviewsData } = useQuery(REVIEWS_BY_SELLER, {
    variables: { sellerId: sellerId || "" },
    skip: !sellerId,
  }) as { data: any };
  const rating = ratingData?.sellerRating as
    | { average: number; count: number }
    | undefined;
  const reviews: {
    id: string;
    rating: number;
    text?: string;
    createdAt: string;
    author?: { name: string; avatarUrl?: string };
  }[] = reviewsData?.reviewsBySeller ?? [];

  if (loading && !product) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-3xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-12 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-lg font-bold">Anuncio no encontrado</p>
        <Link href="/" className="mt-3 inline-block text-primary hover:underline">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const images = product.images?.length
    ? product.images.map((i) => resolveImage(i.url))
    : [];
  const price = applyDiscount(product.price, product.discount);

  const prev = () => setActive((a) => (a - 1 + images.length) % images.length);
  const next = () => setActive((a) => (a + 1) % images.length);

  const onShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: product.title,
          text: `Mira este anuncio en Market EG: ${product.title}`,
          url: typeof window !== "undefined" ? window.location.href : "",
        })
        .catch(() => {});
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-1 text-sm font-semibold text-primary transition hover:gap-2"
      >
        <ChevronLeft size={20} /> Volver
      </button>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Gallery ── */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="group relative aspect-square overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container shadow-card">
            {images[active] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={active}
                src={images[active]}
                alt={product.title}
                className="h-full w-full animate-fade-in object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-6xl text-muted">
                📦
              </div>
            )}

            {/* Discount ribbon */}
            {price.hasDiscount && (
              <div className="absolute left-4 top-4 rounded-full bg-danger px-3 py-1 text-sm font-extrabold text-white shadow-lg">
                −{price.percent}%
              </div>
            )}

            {/* Top-right actions */}
            <div className="absolute right-4 top-4 flex flex-col gap-2">
              {canFavorite && (
                <button
                  onClick={() => {
                    setLikeOverride(!liked);
                    toggle(product.id);
                  }}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-on-surface shadow backdrop-blur transition hover:scale-110"
                  aria-label="Guardar"
                >
                  <Heart size={19} className={liked ? "fill-danger text-danger" : ""} />
                </button>
              )}
              <button
                onClick={onShare}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-on-surface shadow backdrop-blur transition hover:scale-110"
                aria-label="Compartir"
              >
                <Share2 size={18} />
              </button>
            </div>

            {/* Condition + counter */}
            {product.condition && (
              <span className="absolute bottom-3 left-3 rounded-lg bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                {product.condition}
              </span>
            )}
            {images.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-on-surface shadow backdrop-blur transition hover:bg-white"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-on-surface shadow backdrop-blur transition hover:bg-white"
                  aria-label="Siguiente"
                >
                  <ChevronRight size={18} />
                </button>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/55 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
                  {active + 1} / {images.length}
                </div>
              </>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                    i === active
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="animate-fade-in">
          {product.category?.label && (
            <Link
              href={`/explore?cat=${product.category.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              <Tag size={12} /> {product.category.label}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
            {product.title}
          </h1>

          {/* Price block */}
          <div className="mt-4 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
            <div className="flex flex-wrap items-end gap-3">
              <span className="text-4xl font-extrabold tracking-tight text-primary">
                {formatPrice(price.final)}
              </span>
              {price.hasDiscount && (
                <>
                  <span className="mb-1 text-lg text-muted line-through">
                    {formatPrice(price.original)}
                  </span>
                  <span className="mb-1.5 rounded-full bg-danger px-2.5 py-0.5 text-sm font-extrabold text-white">
                    −{price.percent}%
                  </span>
                </>
              )}
            </div>
            {price.hasDiscount && (
              <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-sm font-semibold text-emerald-700">
                <Tag size={14} /> Ahorras {formatPrice(price.savings)}
              </p>
            )}
          </div>

          {/* Meta chips */}
          <div className="mt-4 flex flex-wrap gap-2">
            {product.city && (
              <Chip icon={<MapPin size={13} />}>{product.city}</Chip>
            )}
            <Chip icon={<Eye size={13} />}>{product.views ?? 0} vistas</Chip>
            {(product.favoritesCount ?? 0) > 0 && (
              <Chip icon={<Heart size={13} />}>{product.favoritesCount} guardados</Chip>
            )}
            {product.createdAt && (
              <Chip icon={<Clock size={13} />}>{timeAgo(product.createdAt)}</Chip>
            )}
          </div>

          {/* Seller */}
          {product.seller && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-surface-lowest p-4 shadow-soft">
              <Link
                href={`/user/${product.seller.id}`}
                className="flex min-w-0 flex-1 items-center gap-3 transition hover:opacity-90"
              >
                {product.seller.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImage(product.seller.avatarUrl)}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/15 font-bold text-primary">
                    {product.seller.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 font-semibold text-on-surface">
                    {product.seller.name}
                    {product.seller.verified && (
                      <BadgeCheck size={15} className="fill-primary text-white" strokeWidth={0} />
                    )}
                  </p>
                  {rating && rating.count > 0 ? (
                    <div className="mt-0.5 flex items-center gap-1.5 text-xs">
                      <span className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={13}
                            className={
                              i <= Math.round(rating.average)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                            }
                          />
                        ))}
                      </span>
                      <span className="font-semibold text-on-surface">
                        {rating.average.toFixed(1)}
                      </span>
                      <span className="text-muted">({rating.count} valoraciones)</span>
                    </div>
                  ) : (
                    product.seller.location && (
                      <p className="text-xs text-muted">{product.seller.location}</p>
                    )
                  )}
                </div>
              </Link>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                En línea
              </span>
            </div>
          )}

          {/* Contact */}
          <div className="mt-4 flex gap-3">
            <button className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-secondary font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
              <Phone size={18} /> Llamar
            </button>
            <button className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-2xl bg-[#25D366] font-bold text-white shadow-soft transition hover:-translate-y-0.5 hover:shadow-card">
              <WhatsAppIcon /> WhatsApp
            </button>
          </div>

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h3 className="mb-2 text-base font-bold">Descripción</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                {product.description}
              </p>
            </div>
          )}

          {/* Attributes */}
          {product.attributes && product.attributes.length > 0 && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {product.attributes.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl border border-outline-variant/20 bg-surface-low p-3"
                >
                  <p className="text-xs text-muted">{a.label}</p>
                  <p className="text-sm font-semibold text-on-surface">{a.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Safety */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-tertiary/40 bg-tertiary/10 p-4">
            <Shield size={20} className="mt-0.5 shrink-0 text-tertiary" />
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">
                Pago en persona únicamente.
              </span>{" "}
              Nunca envíes dinero por adelantado y queda en un lugar público.
            </p>
          </div>

          {/* Reportar anuncio */}
          <button
            onClick={() => {
              if (!canFavorite) {
                router.push("/login");
                return;
              }
              setReportOpen(true);
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted transition hover:text-danger"
          >
            <Flag size={15} /> Reportar anuncio
          </button>

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-base font-bold">Valoraciones del vendedor</h3>
                {rating && (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-on-surface">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {rating.average.toFixed(1)}
                    <span className="font-normal text-muted">· {rating.count}</span>
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {reviews.slice(0, 4).map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {r.author?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveImage(r.author.avatarUrl)}
                            alt=""
                            className="h-7 w-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                            {r.author?.name?.charAt(0) ?? "?"}
                          </div>
                        )}
                        <span className="text-sm font-semibold text-on-surface">
                          {r.author?.name}
                        </span>
                      </div>
                      <span className="flex">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i <= r.rating
                                ? "fill-amber-400 text-amber-400"
                                : "fill-gray-200 text-gray-200"
                            }
                          />
                        ))}
                      </span>
                    </div>
                    {r.text && (
                      <p className="mt-2 text-sm text-on-surface-variant">{r.text}</p>
                    )}
                    {r.createdAt && (
                      <p className="mt-1 text-xs text-muted">{timeAgo(r.createdAt)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        type="product"
        targetId={product.id}
        targetLabel={product.title}
      />
    </div>
  );
}
