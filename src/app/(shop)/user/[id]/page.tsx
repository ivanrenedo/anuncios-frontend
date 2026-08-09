"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import {
  BadgeCheck,
  MapPin,
  Mail,
  Phone,
  Flag,
  UserPlus,
  UserCheck,
  Star,
  Crown,
  ArrowLeft,
  Users,
  Package,
  Share2,
  MessageSquare,
  Edit3,
  Trash2,
  Loader2,
} from "lucide-react";
import { GET_USER } from "@/graphql/queries";
import { PRODUCTS_BY_SELLER, PINNED_PRODUCTS } from "@/graphql/queries";
import { useAuth } from "@/hooks/useAuth";
import {
  useFollowers,
  useFollowing,
  useFollowersCount,
  useFollowingCount,
  useIsFollowing,
  useFollowToggle,
} from "@/hooks/useFollowers";
import {
  useReviewsBySeller,
  useSellerRating,
  useCreateReview,
  useUpdateReview,
  useDeleteReview,
} from "@/hooks/useReviews";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useShare } from "@/hooks/useShare";
import { resolveImage } from "@/lib/config";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import ProductGrid from "@/components/ProductGrid";
import ReportModal from "@/components/ReportModal";
import Skeleton from "@/components/Skeleton";
import ImageLightbox from "@/components/ImageLightbox";
import type { Product } from "@/lib/types";

type Tab = "listings" | "reviews" | "followers" | "following";

export default function PublicUserProfile() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const router = useRouter();
  const { user: me, isAuthenticated } = useAuth();
  const isOwn = !!me?.id && me.id === id;

  const [tab, setTab] = useState<Tab>("listings");
  const [reportOpen, setReportOpen] = useState(false);
  const [viewerUri, setViewerUri] = useState<string | null>(null);

  const { data, loading, refetch: refetchUser } = useQuery(GET_USER, {
    variables: { id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => Promise<any> };
  const user = data?.user;

  const {
    data: prodData,
    loading: prodLoading,
    refetch: refetchProducts,
  } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => Promise<any> };

  // v2 Fase 6a.5: pinned products render before the main grid on Star/Premium
  // seller profiles. The query is public but returns [] for plans that can't
  // pin anything, so we can call it unconditionally without a plan gate.
  const { data: pinnedData } = useQuery(PINNED_PRODUCTS, {
    variables: { userId: id },
    skip: !id,
    fetchPolicy: "cache-and-network",
  }) as { data: any };

  const {
    average: avgRating,
    count: ratingCount,
    refetch: refetchRating,
  } = useSellerRating(id);
  const { reviews, refetch: refetchReviews } = useReviewsBySeller(id);
  const {
    count: followersCount,
    refetch: refetchFollowersCount,
  } = useFollowersCount(id);
  const {
    count: followingCount,
    refetch: refetchFollowingCount,
  } = useFollowingCount(id);
  const { followers, refetch: refetchFollowers } = useFollowers(id);
  const { following: followingList, refetch: refetchFollowing } =
    useFollowing(id);
  const { isFollowing, refetch: refetchIsFollowing } = useIsFollowing(
    isAuthenticated && !isOwn ? id : "",
  );

  const { follow, unfollow } = useFollowToggle();
  const { share } = useShare();

  // Freshness on tab focus — follow-back, new reviews, new listings all show
  // up without a manual refresh.
  useRefetchOnFocus([
    refetchUser,
    refetchProducts,
    refetchRating,
    refetchReviews,
    refetchFollowers,
    refetchFollowing,
    refetchFollowersCount,
    refetchFollowingCount,
    refetchIsFollowing,
  ]);

  const [followingLocal, setFollowingLocal] = useState(false);
  useEffect(() => {
    setFollowingLocal(!!isFollowing);
  }, [isFollowing]);

  const products: Product[] = prodData?.productsBySeller ?? [];
  const visibleProducts = products.filter((p) => p.status !== "hide");
  const pinnedProducts: Product[] = pinnedData?.pinnedProducts ?? [];
  const pinnedIds = new Set(pinnedProducts.map((p) => p.id));

  // v2 Fase 11.2 — el perfil ES la tienda para Premium. Merge de pinned +
  // resto en una sola lista, pinned primero (por orden dado por el server),
  // no-pinned después por orden natural. El icono 📌 en la card viene por
  // props del ProductGrid.
  const sortedProducts = [
    ...pinnedProducts,
    ...visibleProducts.filter((p) => !pinnedIds.has(p.id)),
  ];

  // v2 Fase 11.2 — para Premium, exponemos las categorías del vendedor como
  // tabs (siguiendo el patrón de mobile). Se muestra solo si hay >1 categoría
  // distinta en su catálogo activo.
  const isPremiumActive =
    user?.plan === "PREMIUM" &&
    (!user?.planExpiresAt || new Date(user.planExpiresAt) > new Date());
  const categoryTabs = (() => {
    if (!isPremiumActive) return [];
    const map = new Map<string, string>();
    for (const p of visibleProducts) {
      if (p.category?.id && p.category?.label) {
        map.set(p.category.id, p.category.label);
      }
    }
    return Array.from(map.entries()).map(([id, label]) => ({ id, label }));
  })();
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const filteredSorted = selectedCat
    ? sortedProducts.filter((p) => p.category?.id === selectedCat)
    : sortedProducts;

  const verifiedSince =
    isPremiumActive && user?.businessVerifiedAt
      ? new Date(user.businessVerifiedAt).toLocaleDateString("es-ES", {
          month: "long",
          year: "numeric",
        })
      : null;

  const planLabel =
    user?.plan === "PREMIUM"
      ? "Premium"
      : user?.plan === "STAR"
        ? "Star"
        : null;

  const onToggleFollow = async () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    const next = !followingLocal;
    setFollowingLocal(next);
    try {
      if (next) await follow(id);
      else await unfollow(id);
    } catch {
      setFollowingLocal(!next);
    }
  };

  const onReport = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setReportOpen(true);
  };

  const onShare = async () => {
    await share({
      type: "profile",
      id,
      name: user?.name ?? "este vendedor",
    });
  };

  const openViewer = (url?: string | null) => {
    const resolved = url ? resolveImage(url) : "";
    if (resolved) setViewerUri(resolved);
  };

  if (loading && !user) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6">
        <Skeleton className="h-32 w-full rounded-b-3xl sm:h-48" />
        <div className="px-4">
          <Skeleton className="-mt-12 h-24 w-24 rounded-full border-4" />
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-6 py-24 text-center">
        <p className="text-lg font-bold">Usuario no encontrado</p>
        <Link
          href="/"
          className="mt-3 inline-block text-primary hover:underline"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl pb-8">
      {/* Back button */}
      <div className="px-4 pt-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-on-surface"
        >
          <ArrowLeft size={16} /> Volver
        </button>
      </div>

      {/* Cover photo */}
      <div className="relative mt-3">
        {user.coverUrl ? (
          <button
            type="button"
            onClick={() => openViewer(user.coverUrl)}
            className="block w-full"
            aria-label="Ver portada"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImage(user.coverUrl)}
              alt=""
              className="h-32 w-full rounded-xl object-cover transition hover:opacity-95 sm:h-48"
            />
          </button>
        ) : (
          <div className="mx-4 h-32 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-secondary sm:mx-6 sm:h-48" />
        )}

        <div className="absolute -bottom-12 left-8 sm:left-10">
          {user.avatarUrl ? (
            <button
              type="button"
              onClick={() => openViewer(user.avatarUrl)}
              className="block"
              aria-label="Ver foto de perfil"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImage(user.avatarUrl)}
                alt=""
                className="h-24 w-24 rounded-full border-4 border-surface object-cover shadow-card transition hover:opacity-90"
              />
            </button>
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-surface bg-primary/15 text-3xl font-extrabold text-primary shadow-card">
              {user.name?.charAt(0) ?? "?"}
            </div>
          )}
        </div>
      </div>

      {/* User info block */}
      <div className="mt-14 px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold text-on-surface">
                {user.name}
              </h1>
              {user.verified && (
                <BadgeCheck
                  size={20}
                  className="fill-primary text-white"
                  strokeWidth={0}
                />
              )}
              {planLabel && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    planLabel === "Premium"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  }`}
                >
                  {planLabel === "Premium" ? (
                    <Crown size={12} />
                  ) : (
                    <Star size={12} />
                  )}
                  {planLabel}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                {user.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              {user.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {user.location}
                </span>
              )}
              {user.showEmail && user.email && (
                <a
                  href={`mailto:${user.email}`}
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  <Mail size={14} /> {user.email}
                </a>
              )}
              {user.showPhone && user.phone && (
                <a
                  href={`tel:${String(user.phone).replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  <Phone size={14} /> {user.phone}
                </a>
              )}
              <span>Miembro desde {formatDate(user.createdAt)}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* v2 Fase 11.2 — "Ver tienda" CTA retirado: el perfil de un
                Premium ES la tienda. Verificado since chip informa el status
                del negocio directamente sobre la avatar/header. */}
            {verifiedSince && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-extrabold uppercase tracking-wide text-white">
                <Crown size={13} strokeWidth={2.5} />
                Verificado desde {verifiedSince}
              </span>
            )}
            {!isOwn && (
              <>
                <button
                  onClick={onToggleFollow}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition ${
                    followingLocal
                      ? "bg-surface-container text-on-surface hover:bg-surface-high"
                      : "bg-primary text-on-primary hover:bg-primary/90"
                  }`}
                >
                  {followingLocal ? (
                    <UserCheck size={16} />
                  ) : (
                    <UserPlus size={16} />
                  )}
                  {followingLocal ? "Siguiendo" : "Seguir"}
                </button>
                <button
                  onClick={onReport}
                  className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:opacity-80"
                >
                  <Flag size={16} /> Denunciar
                </button>
              </>
            )}
            <button
              onClick={onShare}
              aria-label="Compartir perfil"
              className="flex items-center justify-center rounded-lg bg-surface-container px-3 py-2 text-on-surface transition hover:bg-surface-high"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs styled as stat cards — the totals themselves are the tabs. */}
      <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <StatTab
          active={tab === "listings"}
          onClick={() => setTab("listings")}
          icon={<Package size={20} />}
          label="Anuncios"
          value={visibleProducts.length}
        />
        <StatTab
          active={tab === "reviews"}
          onClick={() => setTab("reviews")}
          icon={<Star size={20} />}
          label="Valoración"
          value={ratingCount > 0 ? avgRating.toFixed(1) : "-"}
        />
        <StatTab
          active={tab === "followers"}
          onClick={() => setTab("followers")}
          icon={<Users size={20} />}
          label="Seguidores"
          value={followersCount}
        />
        <StatTab
          active={tab === "following"}
          onClick={() => setTab("following")}
          icon={<UserPlus size={20} />}
          label="Siguiendo"
          value={followingCount}
        />
      </div>

      <div className="mt-4">
        {tab === "listings" &&
          (!prodLoading && visibleProducts.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted">
              Este usuario no tiene anuncios publicados.
            </p>
          ) : (
            <>
              {/* v2 Fase 11.2 — tabs por categoría en tiendas Premium.
                  Chip pill horizontal scroll con "Todos" + cada categoría
                  activa del vendedor. Auto-hide si <2 categorías. */}
              {categoryTabs.length > 1 && (
                <div className="mb-4 flex flex-wrap gap-2 px-4 sm:px-6">
                  <button
                    type="button"
                    onClick={() => setSelectedCat(null)}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                      selectedCat === null
                        ? "bg-primary text-on-primary"
                        : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
                    }`}
                  >
                    Todos ({visibleProducts.length})
                  </button>
                  {categoryTabs.map((c) => {
                    const count = visibleProducts.filter(
                      (p) => p.category?.id === c.id,
                    ).length;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCat(c.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                          selectedCat === c.id
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
                        }`}
                      >
                        {c.label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}
              <ProductGrid
                products={filteredSorted}
                loading={prodLoading}
                pageSize={16}
                pinnedIds={pinnedIds}
              />
            </>
          ))}

        {tab === "reviews" && (
          <ReviewsSection
            sellerId={id}
            sellerName={user.name}
            reviews={reviews}
            average={avgRating}
            count={ratingCount}
            currentUserId={me?.id}
            isOwn={isOwn}
            isAuthenticated={isAuthenticated}
            onNeedLogin={() => router.push("/login")}
          />
        )}
        {tab === "followers" && (
          <UsersList items={followers} kind="follower" />
        )}
        {tab === "following" && (
          <UsersList items={followingList} kind="following" />
        )}
      </div>

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        type="user"
        targetId={id}
        targetLabel={user.name}
      />

      {viewerUri && (
        <ImageLightbox
          images={[viewerUri]}
          index={0}
          onClose={() => setViewerUri(null)}
        />
      )}
    </div>
  );
}

function StatTab({
  active,
  onClick,
  icon,
  label,
  value,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-xl border p-4 text-center transition ${
        active
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-outline-variant/30 bg-surface-lowest hover:border-outline-variant/60"
      }`}
    >
      <div
        className={`mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl transition ${
          active ? "bg-primary text-on-primary" : "bg-primary/10 text-primary"
        }`}
      >
        {icon}
      </div>
      <p className="text-2xl font-extrabold tabular-nums text-on-surface">
        {typeof value === "number" ? formatNumber(value) : value}
      </p>
      <p
        className={`text-xs ${active ? "font-semibold text-primary" : "text-muted"}`}
      >
        {label}
      </p>
    </button>
  );
}

function ReviewsSection({
  sellerId,
  sellerName,
  reviews,
  average,
  count,
  currentUserId,
  isOwn,
  isAuthenticated,
  onNeedLogin,
}: {
  sellerId: string;
  sellerName: string;
  reviews: any[];
  average: number;
  count: number;
  currentUserId?: string;
  isOwn: boolean;
  isAuthenticated: boolean;
  onNeedLogin: () => void;
}) {
  const myReview = reviews.find(
    (r) => currentUserId && r.author?.id === currentUserId,
  );
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState<number>(myReview?.rating ?? 0);
  const [text, setText] = useState<string>(myReview?.text ?? "");
  const [visibleReviews, setVisibleReviews] = useState(10);

  useEffect(() => {
    setRating(myReview?.rating ?? 0);
    setText(myReview?.text ?? "");
  }, [myReview?.id]);

  const { create, loading: creating } = useCreateReview();
  const { update, loading: updating } = useUpdateReview();
  const { remove, loading: deleting } = useDeleteReview();
  const busy = creating || updating || deleting;

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      onNeedLogin();
      return;
    }
    if (rating < 1) return;
    try {
      if (myReview) {
        await update(myReview.id, { rating, text: text.trim() || undefined });
      } else {
        await create({
          sellerId,
          rating,
          text: text.trim() || undefined,
        });
      }
      setEditing(false);
    } catch (e: any) {
      alert(e?.message || "No se pudo guardar la valoración.");
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!confirm("¿Eliminar tu valoración?")) return;
    try {
      await remove(myReview.id);
      setEditing(false);
      setRating(0);
      setText("");
    } catch (e: any) {
      alert(e?.message || "No se pudo eliminar la valoración.");
    }
  };

  const canWriteReview = isAuthenticated && !isOwn;
  const showForm = canWriteReview && (editing || !myReview);

  return (
    <div className="px-4 sm:px-6">
      {reviews.length > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
          <p className="text-4xl font-extrabold tabular-nums text-on-surface">
            {average.toFixed(1)}
          </p>
          <div>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i <= Math.round(average)
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                  }
                />
              ))}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {count} valoración{count === 1 ? "" : "es"}
            </p>
          </div>
        </div>
      )}

      {canWriteReview && !showForm && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
          <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
            <Edit3 size={16} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-on-surface">
              {myReview ? "Tu valoración" : `Valora a ${sellerName}`}
            </p>
            {myReview ? (
              <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      size={11}
                      className={
                        i <= myReview.rating
                          ? "fill-amber-400 text-amber-400"
                          : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                      }
                    />
                  ))}
                </div>
                {myReview.text && <span className="truncate">{myReview.text}</span>}
              </div>
            ) : (
              <p className="mt-0.5 text-xs text-muted">
                Ayuda a otros compartiendo tu experiencia.
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing(true)}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-on-primary transition hover:bg-primary/90"
          >
            {myReview ? "Editar" : "Escribir"}
          </button>
          {myReview && (
            <button
              onClick={handleDelete}
              disabled={busy}
              className="rounded-lg bg-danger-soft p-1.5 text-danger transition hover:opacity-80 disabled:opacity-60"
              aria-label="Eliminar mi valoración"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}

      {showForm && (
        <div className="mb-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
          <p className="text-sm font-semibold text-on-surface">
            {myReview ? "Editar valoración" : `Valora a ${sellerName}`}
          </p>
          <div className="mt-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="p-0.5"
                aria-label={`${i} estrellas`}
              >
                <Star
                  size={26}
                  className={
                    i <= rating
                      ? "fill-amber-400 text-amber-400"
                      : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                  }
                />
              </button>
            ))}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Comparte cómo fue tu experiencia (opcional)"
            rows={3}
            maxLength={500}
            className="mt-3 w-full rounded-lg border border-outline-variant/40 bg-surface-lowest p-3 text-sm text-on-surface outline-none focus:border-primary"
          />
          <div className="mt-3 flex justify-end gap-2">
            {myReview && (
              <button
                onClick={() => setEditing(false)}
                className="rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
              >
                Cancelar
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={busy || rating < 1}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition hover:bg-primary/90 disabled:opacity-60"
            >
              {busy && <Loader2 size={14} className="animate-spin" />}
              {myReview ? "Guardar" : "Publicar"}
            </button>
          </div>
        </div>
      )}

      {reviews.length === 0 && !showForm && (
        <div className="py-12 text-center">
          <MessageSquare
            size={40}
            className="mx-auto mb-3 text-outline-variant"
            strokeWidth={1}
          />
          <p className="text-sm text-muted">
            Aún no hay valoraciones para este vendedor.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {reviews.slice(0, visibleReviews).map((r: any) => (
          <div
            key={r.id}
            className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {r.author?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImage(r.author.avatarUrl)}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {r.author?.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-on-surface">
                    {r.author?.name}
                    {currentUserId && r.author?.id === currentUserId && (
                      <span className="ml-1.5 text-xs font-normal text-muted">
                        (tú)
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">{timeAgo(r.createdAt)}</p>
                </div>
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={
                      i <= r.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
                    }
                  />
                ))}
              </div>
            </div>
            {r.text && (
              <p className="mt-2 text-sm text-on-surface-variant">{r.text}</p>
            )}
          </div>
        ))}
      </div>

      {visibleReviews < reviews.length ? (
        <button
          type="button"
          onClick={() =>
            setVisibleReviews((c) => Math.min(c + 10, reviews.length))
          }
          className="mx-auto mt-4 flex h-11 w-full max-w-xs items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-surface-container"
        >
          Cargar más
        </button>
      ) : reviews.length > 10 ? (
        <p className="mt-4 text-center text-xs text-muted">
          Has visto todas las valoraciones
        </p>
      ) : null}
    </div>
  );
}

const USERS_PAGE_SIZE_UP = 20;

function UsersList({
  items,
  kind,
}: {
  items: any[];
  kind: "follower" | "following";
}) {
  const [visible, setVisible] = useState(USERS_PAGE_SIZE_UP);
  const shown = items.slice(0, visible);
  const hasMore = visible < items.length;

  if (items.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        {kind === "follower" ? (
          <Users
            size={40}
            className="mx-auto mb-3 text-outline-variant"
            strokeWidth={1}
          />
        ) : (
          <UserCheck
            size={40}
            className="mx-auto mb-3 text-outline-variant"
            strokeWidth={1}
          />
        )}
        <p className="text-sm text-muted">
          {kind === "follower"
            ? "Este usuario aún no tiene seguidores."
            : "Este usuario aún no sigue a nadie."}
        </p>
      </div>
    );
  }
  return (
    <div className="px-4 sm:px-6">
    <div className="grid gap-3 sm:grid-cols-2">
      {shown.map((entry: any) => {
        const u = kind === "follower" ? entry.follower : entry.followed;
        if (!u) return null;
        const plan = u.effectivePlan ?? u.plan ?? "FREE";
        return (
          <Link
            key={entry.id}
            href={`/user/${u.id}`}
            className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-3 transition hover:border-primary/40"
          >
            {u.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImage(u.avatarUrl)}
                alt=""
                className="h-11 w-11 rounded-full object-cover"
              />
            ) : (
              <div className="grid h-11 w-11 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                {u.name?.charAt(0) ?? "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 truncate font-semibold text-on-surface">
                {u.name}
                {u.verified && (
                  <BadgeCheck
                    size={13}
                    className="fill-primary text-white"
                    strokeWidth={0}
                  />
                )}
                {plan === "PREMIUM" && (
                  <Crown size={12} className="text-purple-600" />
                )}
                {plan === "STAR" && (
                  <Star
                    size={12}
                    className="fill-amber-400 text-amber-500"
                    strokeWidth={0}
                  />
                )}
              </p>
              <p className="truncate text-xs text-muted">
                {u.location || ""}
                {entry.createdAt && ` · ${timeAgo(entry.createdAt)}`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>

    {hasMore ? (
      <button
        type="button"
        onClick={() =>
          setVisible((c) => Math.min(c + USERS_PAGE_SIZE_UP, items.length))
        }
        className="mx-auto mt-4 flex h-11 w-full max-w-xs items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-surface-container"
      >
        Cargar más
      </button>
    ) : items.length > USERS_PAGE_SIZE_UP ? (
      <p className="mt-4 text-center text-xs text-muted">
        {kind === "follower"
          ? "Has visto todos los seguidores"
          : "Has visto todos los seguidos"}
      </p>
    ) : null}
    </div>
  );
}
