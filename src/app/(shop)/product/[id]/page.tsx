"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
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
  Crown,
  Zap,
  ArrowUpCircle,
  MessageCircle,
  Car,
  Gauge,
  Calendar,
  Settings2,
  Fuel,
  BedDouble,
  Bath,
  Building2,
  Ruler,
  ExternalLink,
  Sparkles,
  Flame,
} from "lucide-react";
import { useProduct } from "@/hooks/useProducts";
import {
  VIEW_PRODUCT,
  CONTACT_PRODUCT,
} from "@/graphql/mutations";
import {
  SELLER_RATING,
  PRODUCTS_BY_CATEGORY,
} from "@/graphql/queries";
import { useToggleFavorite, useFavoriteIds } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useShare } from "@/hooks/useShare";
import { useBusinessContact } from "@/hooks/useBusinessContact";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { resolveImage, SHARE_URL } from "@/lib/config";
import { getViewerKey } from "@/lib/viewer";
import { formatPrice, timeAgo, applyDiscount } from "@/lib/format";
import Skeleton from "@/components/Skeleton";
import ReportModal from "@/components/ReportModal";
import ProductCard, { ProductCardSkeleton } from "@/components/ProductCard";
import ImageLightbox from "@/components/ImageLightbox";
import SafetyModal, { type SafetyModalMode } from "@/components/SafetyModal";
import type { Product } from "@/lib/types";
import AdSenseSlot from "@/components/AdSenseSlot";

/* ─── Inline helpers ─────────────────────────────────────────────────────── */

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

function SpecCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-low p-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="truncate text-sm font-semibold text-on-surface">{value}</p>
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "PREMIUM") {
    return (
      <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-100 text-purple-600">
        <Crown size={12} />
      </span>
    );
  }
  if (plan === "STAR") {
    return (
      <span className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-amber-600">
        <Star size={12} />
      </span>
    );
  }
  return null;
}

/* ─── Main component ──────────────────────────────────────────────────── */

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
  const { user } = useAuth();
  const [trackView] = useMutation(VIEW_PRODUCT);
  const [trackContact] = useMutation(CONTACT_PRODUCT);
  const { share } = useShare();
  const { phone: contactNumber } = useBusinessContact();
  const [likeOverride, setLikeOverride] = useState<boolean | null>(null);
  const liked = likeOverride ?? (product ? favoriteIds.has(product.id) : false);
  const [active, setActive] = useState(0);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [safetyMode, setSafetyMode] = useState<SafetyModalMode | null>(null);
  const contactedRef = useRef(false);

  // Track view
  const tracked = useRef<string | null>(null);
  useEffect(() => {
    if (!id || tracked.current === id) return;
    tracked.current = id;
    trackView({ variables: { id, viewerKey: getViewerKey() } }).catch(() => {});
  }, [id, trackView]);

  // Seller rating (mostrado en la card del vendedor)
  const sellerId = product?.seller?.id;
  const { data: ratingData, refetch: refetchRating } = useQuery(SELLER_RATING, {
    variables: { sellerId: sellerId || "" },
    skip: !sellerId,
  }) as { data: any; refetch: () => Promise<any> };
  const rating = ratingData?.sellerRating as
    | { average: number; count: number }
    | undefined;

  // Related products — pedimos más para el rail horizontal (mobile-style)
  const categoryId = product?.category?.id;
  const { data: relatedData, loading: relatedLoading, refetch: refetchRelated } =
    useQuery(PRODUCTS_BY_CATEGORY, {
      variables: { categoryId: categoryId || "", take: 12 },
      skip: !categoryId,
    }) as { data: any; loading: boolean; refetch: () => Promise<any> };
  const relatedProducts: Product[] = (relatedData?.productsByCategory ?? [])
    .filter((p: Product) => p.id !== id)
    .slice(0, 10);

  // Precio, favs y rating del vendedor pueden cambiar mientras estás en la
  // ficha — recarga al recuperar foco (volver de otra tab / re-visitar).
  useRefetchOnFocus([refetchRating, refetchRelated]);

  if (loading && !product) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-2">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-9 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-12 rounded-xl" />
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

  const onShare = async () => {
    await share({
      type: "product",
      id: product.id,
      title: product.title,
      price: formatPrice(price.final),
    });
  };

  const isBoosted =
    product.boostedUntil && new Date(product.boostedUntil) > new Date();
  const isOwner = user?.id && sellerId && user.id === sellerId;
  const sellerPlan = product.seller?.plan;
  const sellerPhone = product.seller?.phone;
  const canShowPhone = product.seller?.showPhone && sellerPhone;

  // WhatsApp va al vendedor cuando tenga teléfono; si no, cae al contacto del
  // negocio como intermediario.
  const waNumber = (sellerPhone || contactNumber)?.replace(
    /[^0-9]/g,
    "",
  );

  // Contacto vía WhatsApp / llamada. Se abre primero el SafetyModal con
  // los consejos de seguridad, como en la app móvil, y desde ahí se lanza
  // la acción real. Registramos la métrica una vez por visita a la ficha.
  const openContact = (type: "whatsapp" | "call") => {
    if (!contactedRef.current) {
      contactedRef.current = true;
      trackContact({ variables: { id: product.id } }).catch(() => {});
    }
    setSafetyMode(type);
  };

  // Category-specific detail shorthands
  const veh = product.vehicleDetail;
  const prop = product.propertyDetail;
  const svc = product.serviceDetail;
  const job = product.jobDetail;
  const mkt = product.marketplaceDetail;

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-6 sm:py-5">
      {/* Top banner ad — Billboard 970x250 en desktop, 320x100 en móvil.
          Placeholder mientras no hay AdSense; el div interno queda listo
          para pegar el <ins class="adsbygoogle"> cuando exista slot. */}
      {/* v2 Fase 12 — 320×50 mobile / 728×90 tablet+desktop */}
      <AdSenseSlot
        slot="9280849367"
        mobileSlot="9107061724"
        width={728}
        height={90}
        mobileWidth={320}
        mobileHeight={100}
        className="mb-5 mx-auto"
      />

      {/* Layout Wallapop-style: contenido centrado con dos rails de anuncios
          Half Page (300×600) sticky a los lados en escritorios anchos (≥ xl).
          El contenido se apila (gallery arriba, info debajo) como en la app
          móvil. `grid-cols-1` explícito en móvil evita que el track se
          dimensione por min-content y desborde el viewport. */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[300px_minmax(0,1fr)_300px] xl:gap-8">
        {/* Left sticky ad rail — Half Page 300×600, sólo se muestra en xl+ */}
        <aside className="hidden xl:block">
          <AdSenseSlot slot="4548035461" width={300} height={600} className="sticky top-24"  />
        </aside>

        {/* Center content — gallery + info apilados. `min-w-0` es clave: sin
            él, el flex-col hereda min-width: auto y se expande al contenido
            mínimo (imágenes, rails), rompiendo el layout en móvil. */}
        <div className="mx-auto flex w-full min-w-0 max-w-3xl flex-col gap-6 sm:gap-8">
        {/* ── Gallery ── Mobile: ocupa todo el ancho (aspect-square).
            Desktop: capamos a ~480px para que no domine el layout. */}
        <div className="mx-auto w-full max-w-[520px]">
           {/* Back */}
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-1 text-sm font-semibold text-primary transition hover:gap-2"
            >
              <ChevronLeft size={20} /> Volver
            </button>
          <div className="group relative aspect-square overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container">
            {images[active] ? (
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="block h-full w-full cursor-zoom-in"
                aria-label="Ver imagen en pantalla completa"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={active}
                  src={images[active]}
                  alt={product.title}
                  className="h-full w-full animate-fade-in object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </button>
            ) : (
              <div className="grid h-full w-full place-items-center text-6xl text-muted">
                📦
              </div>
            )}

            {/* Discount ribbon */}
            {price.hasDiscount && (
              <div className="absolute left-4 top-4 rounded-full bg-danger px-3 py-1 text-sm font-extrabold text-white shadow-lg">
                -{price.percent}%
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
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-black shadow backdrop-blur transition hover:scale-110"
                  aria-label="Guardar"
                >
                  <Heart size={19} className={liked ? "fill-danger text-danger" : ""} />
                </button>
              )}
              <button
                onClick={onShare}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/85 text-black shadow backdrop-blur transition hover:scale-110"
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
                  className="absolute left-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black shadow backdrop-blur transition hover:bg-white"
                  aria-label="Anterior"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={next}
                  className="absolute right-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-black shadow backdrop-blur transition hover:bg-white"
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

          {/* Thumbnails — scroll horizontal cuando hay más miniaturas de las
              que caben. `min-w-0` en el track evita que flex/grid le den un
              min-content y hagan crecer al padre; el envoltorio limita la
              anchura visual al ancho real del gallery. */}
          {images.length > 1 && (
            <div className="mt-3 w-full max-w-full">
              <div className="flex min-w-0 gap-2 overflow-x-auto scrollbar-hide">
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
            </div>
          )}
        </div>

        {/* ── Info ── */}
        <div className="animate-fade-in">
          {/* Boosted indicator */}
          {isBoosted && (
            <div className="mb-3 inline-flex items-center mr-2 gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 border border-amber-200">
              <Zap size={13} className="fill-amber-500 text-amber-500" />
              Anuncio destacado
            </div>
          )}

          {product.category?.label && (
            <Link
              href={`/explore?cat=${product.category.slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
            >
              <Tag size={12} /> {product.category.label}
            </Link>
          )}
          <h1 className="mt-2 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl md:text-3xl">
            {product.title}
          </h1>

          {/* Price block — mobile-first: precio grande en su propia línea y
              el resto (tachado + porcentaje) por debajo con flex-wrap para
              que no se rompan en pantallas estrechas. En sm+ vuelven a la
              misma línea si hay espacio. */}
          {price.final > 0 ? (<div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
            <div className="flex gap-2 flex-row flex-wrap items-center sm:gap-x-3 sm:gap-y-2">
              <span className="text-3xl font-extrabold leading-none tracking-tight text-primary sm:text-4xl">
                {formatPrice(price.final)}
              </span>
              {price.hasDiscount && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base text-muted line-through sm:text-lg">
                    {formatPrice(price.original)}
                  </span>
                  <span className="rounded-full bg-danger px-2.5 py-0.5 text-xs font-extrabold text-white sm:text-sm">
                    -{price.percent}%
                  </span>
                </div>
              )}
              {/* v2 Fase 11.1 — chip "Rebajado" 48h para vendedores Star/Premium */}
              {product.priceReducedUntil &&
                new Date(product.priceReducedUntil) > new Date() &&
                (sellerPlan === "STAR" || sellerPlan === "PREMIUM") && (
                  <span
                    title="Precio bajado en las últimas 48 horas"
                    className="inline-flex items-center gap-1 rounded-full bg-orange-500/15 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide text-orange-600"
                  >
                    <Flame size={12} strokeWidth={2.5} />
                    Rebajado
                  </span>
                )}
            </div>
            {price.hasDiscount && (
              <p className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 sm:text-sm">
                <Tag size={14} className="shrink-0" />
                <span className="min-w-0 truncate">
                  Ahorras {formatPrice(price.savings)}
                </span>
              </p>
            )}
          </div>) : <></>}

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
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-lowest p-4">
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
                    {product.seller.plan && (
                      <PlanBadge plan={product.seller.plan} />
                    )}
                  </p>
                  {/* Rating siempre visible — señal clave de confianza. Si no
                      hay valoraciones, mostramos "sin valoraciones" en vez de
                      esconderla, para que el vendedor sepa que existe. */}
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={13}
                          className={
                            rating && i <= Math.round(rating.average)
                              ? "fill-amber-400 text-amber-400"
                              : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                          }
                        />
                      ))}
                    </span>
                    {rating && rating.count > 0 ? (
                      <>
                        <span className="font-semibold text-on-surface">
                          {rating.average.toFixed(1)}
                        </span>
                        <span className="text-muted">
                          ({rating.count.toLocaleString('es')} valoración
                          {rating.count === 1 ? "" : "es"})
                        </span>
                      </>
                    ) : (
                      <span className="text-muted">Sin valoraciones aún</span>
                    )}
                    {product.seller.location && (
                      <>
                        <span className="text-muted">·</span>
                        <span className="text-muted">
                          {product.seller.location}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight />
              </Link>
            </div>
          )}

          {/* Safety */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-tertiary/40 bg-tertiary/10 p-4">
            <Shield size={20} className="mt-0.5 shrink-0 text-tertiary" />
            <p className="text-sm text-on-surface-variant">
              <span className="font-bold text-on-surface">
                Pago en persona únicamente.
              </span>{" "}
              Nunca envíes dinero por adelantado y queda en un lugar público.
            </p>
          </div>

          {/* Contact buttons */}
          {canShowPhone ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => openContact("call")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-secondary font-bold text-white shadow-soft transition hover:bg-secondary/90"
              >
                <Phone size={18} /> Llamar
              </button>
              <button
                onClick={() => openContact("whatsapp")}
                className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-lg bg-[#25D366] font-bold text-white shadow-soft transition hover:opacity-90"
              >
                <WhatsAppIcon /> WhatsApp
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-outline-variant/30 bg-surface-low p-3 text-center text-sm text-muted">
              El vendedor no ha compartido su teléfono
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div className="mt-6">
              <h3 className="mb-2 text-base font-bold">Descripción</h3>
              <p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                {product.description}
              </p>
            </div>
          )}

          {/* ── Category-specific detail sections ── */}

          {/* Vehicle detail */}
          {veh && (
            <div className="mt-6">
              <h3 className="mb-3 text-base font-bold">Ficha técnica</h3>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {veh.operation && (
                  <SpecCard icon={<Car size={16} />} label="Operación" value={veh.operation} />
                )}
                {veh.brand && (
                  <SpecCard icon={<Car size={16} />} label="Marca" value={veh.brand} />
                )}
                {veh.model && (
                  <SpecCard icon={<Car size={16} />} label="Modelo" value={veh.model} />
                )}
                {veh.year != null && (
                  <SpecCard icon={<Calendar size={16} />} label="Año" value={veh.year} />
                )}
                {veh.kilometrage != null && (
                  <SpecCard
                    icon={<Gauge size={16} />}
                    label="Kilometraje"
                    value={`${Number(veh.kilometrage).toLocaleString("es")} km`}
                  />
                )}
                {veh.transmission && (
                  <SpecCard icon={<Settings2 size={16} />} label="Transmisión" value={veh.transmission} />
                )}
                {veh.engine && (
                  <SpecCard icon={<Fuel size={16} />} label="Motor" value={veh.engine} />
                )}
              </div>
              {Array.isArray(veh.colors) && veh.colors.length > 0 && (
                <ColorsRow colors={veh.colors} label="Colores" />
              )}
            </div>
          )}

          {/* Property detail */}
          {prop && (
            <div className="mt-6">
              <h3 className="mb-3 text-base font-bold">Características</h3>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {prop.operation && (
                  <SpecCard icon={<Building2 size={16} />} label="Operación" value={prop.operation} />
                )}
                {prop.bedrooms != null && prop.bedrooms > 0 && (
                  <SpecCard icon={<BedDouble size={16} />} label="Dormitorios" value={prop.bedrooms} />
                )}
                {prop.bathrooms != null && prop.bathrooms > 0 && (
                  <SpecCard icon={<Bath size={16} />} label="Baños" value={prop.bathrooms} />
                )}
                {prop.floor != null && prop.floor > 0 && (
                  <SpecCard icon={<Building2 size={16} />} label="Planta" value={`${prop.floor}a`} />
                )}
                {prop.surface != null && prop.surface > 0 && (
                  <SpecCard icon={<Ruler size={16} />} label="Superficie" value={`${prop.surface} m2`} />
                )}
                {prop.address && (
                  <SpecCard icon={<MapPin size={16} />} label="Direccion" value={prop.address} />
                )}
              </div>
            </div>
          )}

          {/* Service detail */}
          {svc?.offerType && (
            <div className="mt-6">
              <h3 className="mb-3 text-base font-bold">Tipo de servicio</h3>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold ${
                  svc.offerType === "Oferta"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-blue-50 text-blue-700 border border-blue-200"
                }`}
              >
                <Tag size={14} />
                {svc.offerType === "Oferta" ? "Oferta de servicio" : "Demanda de servicio"}
              </span>
            </div>
          )}

          {/* Job detail */}
          {job?.link && (
            <div className="mt-6">
              <a
                href={job.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/10"
              >
                <ExternalLink size={16} />
                Ver oferta de empleo
              </a>
            </div>
          )}

          {/* Marketplace detail */}
          {mkt &&
            (mkt.brand ||
              mkt.model ||
              (Array.isArray(mkt.colors) && mkt.colors.length > 0)) && (
              <div className="mt-6">
                <h3 className="mb-3 text-base font-bold">Detalles del producto</h3>
                <div className="flex flex-wrap gap-2">
                  {mkt.brand && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-low px-3.5 py-2 text-sm font-medium text-on-surface-variant">
                      Marca: {mkt.brand}
                    </span>
                  )}
                  {mkt.model && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-low px-3.5 py-2 text-sm font-medium text-on-surface-variant">
                      Modelo: {mkt.model}
                    </span>
                  )}
                </div>
                {Array.isArray(mkt.colors) && mkt.colors.length > 0 && (
                  <ColorsRow colors={mkt.colors} label="Colores" />
                )}
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

          {/* Owner boost CTA — contactamos por WhatsApp con la cuenta de negocio
              para gestionar el destaque manualmente. */}
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                const msg = encodeURIComponent(
                  `Hola, quiero destacar mi anuncio "${product.title}" (${SHARE_URL}/product/${product.id}) durante 7 días.`,
                );
                window.open(
                  `https://wa.me/${contactNumber}?text=${msg}`,
                  "_blank",
                );
              }}
              className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-5 text-left transition hover:bg-primary/10"
            >
              <ArrowUpCircle
                size={22}
                strokeWidth={1.5}
                className="mt-0.5 shrink-0 text-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-on-surface">
                  Destacar un anuncio suelto
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-on-surface-variant">
                  ¿No quieres un plan todavía? Destaca un anuncio individual:
                  1.000 XAF por 3 días, 2.000 XAF por 7 días o 5.000 XAF por
                  30 días. Aparecerá en las primeras posiciones de su categoría.
                </span>
                <span className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary">
                  <MessageCircle size={13} strokeWidth={2} />
                  Solicitar por WhatsApp
                </span>
              </span>
            </button>
          )}
          {/* Report — hidden for the owner; other users see a prominent CTA
              so misleading or fraudulent listings are one tap away. */}
          {!isOwner && (
            <button
              onClick={() => {
                if (!canFavorite) {
                  router.push("/login");
                  return;
                }
                setReportOpen(true);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-danger/40 bg-danger/10 py-3 text-sm font-bold text-danger transition hover:border-danger hover:bg-danger/20"
            >
              <Flag size={16} strokeWidth={2} /> Denunciar este anuncio
            </button>
          )}
        </div>
        {/* /info column */}
        </div>
        {/* /center content wrapper */}

        {/* Right sticky ad rail — Half Page 300×600, sólo se muestra en xl+ */}
        <aside className="hidden xl:block">
          <AdSenseSlot slot="4548035461" width={300} height={600} className="sticky top-24"  />
        </aside>
      </div>
      {/* /grid */}

      {/* Related products — rail horizontal ancho estilo mobile ProductRail.
          Se sale del centro para ocupar todo el ancho útil del layout. */}
      {(relatedProducts.length > 0 || relatedLoading) && (
        <RelatedRail products={relatedProducts} loading={relatedLoading} />
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        type="product"
        targetId={product.id}
        targetLabel={product.title}
      />

      <SafetyModal
        open={safetyMode !== null}
        mode={safetyMode ?? "tips"}
        onClose={() => setSafetyMode(null)}
        phoneNumber={sellerPhone || undefined}
        whatsappNumber={waNumber}
        whatsappMessage={`Hola, me interesa tu anuncio: ${product.title} — ${SHARE_URL}/product/${product.id}`}
      />

      {lightboxOpen && images.length > 0 && (
        <ImageLightbox
          images={images.filter((s): s is string => !!s)}
          index={active}
          onClose={() => setLightboxOpen(false)}
          onPrev={() =>
            setActive((a) => (a - 1 + images.length) % images.length)
          }
          onNext={() => setActive((a) => (a + 1) % images.length)}
        />
      )}
    </div>
  );
}

/**
 * Rail horizontal de productos relacionados — inspirado en el ProductRail
 * mobile. Se sale del centro para ocupar todo el ancho útil, con scroll
 * horizontal, snap por card y cards ensanchadas (w-56) para que destaquen
 * más que en la retícula estándar.
 */
function RelatedRail({
  products,
  loading,
}: {
  products: Product[];
  loading?: boolean;
}) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/12 text-primary">
          <Sparkles size={17} strokeWidth={2.2} />
        </span>
        <h2 className="text-lg font-extrabold tracking-tight text-on-surface sm:text-xl">
          Anuncios relacionados
        </h2>
      </div>
      <div
        className="-mx-3 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-3 px-3 pb-3 scrollbar-hide sm:-mx-6 sm:scroll-px-6 sm:px-6"
        role="list"
      >
        {loading && products.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="w-56 shrink-0 snap-start"
                role="listitem"
              >
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p) => (
              <div
                key={p.id}
                className="group rail w-56 shrink-0 sm:w-64 animate-fade-in overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest transition hover:border-outline-variant/60 hover:shadow-card"
                role="listitem"
              >
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </section>
  );
}

/**
 * Compact swatch list used inside the vehicle / marketplace detail sections
 * to show the seller-provided colors. Mirrors the chip style used by the
 * publish/edit color pickers so users see the same objects across flows.
 */
function ColorsRow({ colors, label }: { colors: string[]; label: string }) {
  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <span
            key={`${c}-${i}`}
            className="inline-flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-low py-1 pl-1.5 pr-3 text-xs font-semibold text-on-surface-variant"
          >
            <span
              className="h-5 w-5 rounded-full border border-black/10"
              style={{ backgroundColor: c }}
              aria-hidden
            />
            <span className="tabular-nums">{c}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
