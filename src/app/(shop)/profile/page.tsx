"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  MapPin,
  Mail,
  Phone,
  Edit3,
  Crown,
  Star,
  ShieldCheck,
  Eye,
  Users,
  UserPlus,
  UserCheck,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquare,
  TrendingUp,
  Heart,
  Search as SearchIcon,
  Settings,
  Share2,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import {
  useVerificationRequest,
  useRequestVerification,
} from "@/hooks/useVerification";
import {
  useFollowers,
  useFollowing,
  useFollowersCount,
  useFollowingCount,
} from "@/hooks/useFollowers";
import { useReviewsBySeller, useSellerRating } from "@/hooks/useReviews";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useShare } from "@/hooks/useShare";
import { useQuery } from "@apollo/client/react";
import { PRODUCTS_BY_SELLER, MY_VIEWS_DAILY } from "@/graphql/queries";
import { resolveImage } from "@/lib/config";
import { formatDate, formatNumber, timeAgo } from "@/lib/format";
import ProductGrid from "@/components/ProductGrid";
import PlanFeaturesPanel from "@/components/PlanFeaturesPanel";
import VerificationRequestModal from "@/components/VerificationRequestModal";
import Skeleton from "@/components/Skeleton";
import ImageLightbox from "@/components/ImageLightbox";
import SettingsModal from "@/components/SettingsModal";
import type { Product } from "@/lib/types";

type Tab = "listings" | "reviews" | "followers" | "following";

/** Days a rejected verification request stays in cooldown before the user
 *  can retry. Mirrors the mobile app so the two clients agree. */
const VERIFICATION_COOLDOWN_DAYS = 7;

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const userId = user?.id ?? "";

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("listings");
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const { share } = useShare(); 

  const {
    data: prodData,
    loading: prodLoading,
    refetch: refetchProducts,
  } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: userId },
    skip: !userId,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => Promise<any> };

  const {
    count: followersCount,
    refetch: refetchFollowersCount,
  } = useFollowersCount(userId);
  const {
    count: followingCount,
    refetch: refetchFollowingCount,
  } = useFollowingCount(userId);
  const { followers, refetch: refetchFollowers } = useFollowers(userId);
  const { following, refetch: refetchFollowing } = useFollowing(userId);

  const { reviews, refetch: refetchReviews } = useReviewsBySeller(userId);
  const { average: avgRating, count: ratingCount, refetch: refetchRating } =
    useSellerRating(userId);

  const {
    request: verificationRequest,
    refetch: refetchVerification,
  } = useVerificationRequest();
  const { requestVerification, loading: requestingVerification } =
    useRequestVerification();

  const effectivePlan = profile?.effectivePlan ?? profile?.plan ?? "FREE";
  const hasStatsAccess = effectivePlan === "STAR" || effectivePlan === "PREMIUM";
  const hasFullStats = effectivePlan === "PREMIUM";

  // Daily views chart is PREMIUM-only.
  const { data: viewsData } = useQuery(MY_VIEWS_DAILY, {
    variables: { days: 7 },
    skip: !hasFullStats || !isAuthenticated,
    fetchPolicy: "cache-and-network",
  }) as { data: any };

  // Refetch all owner-scoped data when the tab regains focus (e.g. after
  // publishing a listing in another tab, or receiving a follow from another
  // device).
  useRefetchOnFocus([
    refetchProducts,
    refetchReviews,
    refetchRating,
    refetchFollowers,
    refetchFollowing,
    refetchFollowersCount,
    refetchFollowingCount,
    refetchVerification,
  ]);

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-6 py-28 text-center">
        <p className="text-lg font-bold">Tu perfil</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Inicia sesión para ver tu perfil, tus anuncios y tus favoritos.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary transition hover:bg-primary/90"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  if (authLoading || profileLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-0 sm:px-6">
        <Skeleton className="h-32 w-full rounded-b-3xl sm:h-48" />
        <div className="px-4">
          <Skeleton className="-mt-12 h-24 w-24 rounded-full border-4" />
          <Skeleton className="mt-3 h-6 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const p = profile;
  const products: Product[] = prodData?.productsBySeller ?? [];
  const totalViews = products.reduce((s, pr) => s + (pr.views ?? 0), 0);
  const totalFavorites = products.reduce(
    (s, pr) => s + (pr.favoritesCount ?? 0),
    0,
  );
  const totalContacts = products.reduce((s, pr) => s + ((pr as any).contacts ?? 0), 0);
  const totalImpressions = products.reduce(
    (s, pr) => s + ((pr as any).impressions ?? 0),
    0,
  );
  const topProduct = products.reduce<Product | null>(
    (best, pr) => ((pr.views ?? 0) > (best?.views ?? 0) ? pr : best),
    null,
  );
  const viewsDaily: { date: string; count: number }[] =
    viewsData?.myViewsDaily ?? [];
  const maxDaily = Math.max(1, ...viewsDaily.map((d) => d.count));

  const planLabel =
    effectivePlan === "PREMIUM"
      ? "Premium"
      : effectivePlan === "STAR"
        ? "Star"
        : null;

  // Verification cooldown: if the user was rejected, they must wait N days
  // before re-submitting. Mirrors mobile behaviour.
  const cooldownDaysLeft =
    verificationRequest?.status === "rejected" &&
    verificationRequest.reviewedAt
      ? Math.max(
          0,
          Math.ceil(
            VERIFICATION_COOLDOWN_DAYS -
              (Date.now() - new Date(verificationRequest.reviewedAt).getTime()) /
                86_400_000,
          ),
        )
      : 0;
  const onCooldown = cooldownDaysLeft > 0;

  // Plan expiry warning: last 7 days.
  const planExpiresAt = p?.planExpiresAt
    ? new Date(p.planExpiresAt as string)
    : null;
  const planDaysLeft = planExpiresAt
    ? Math.ceil((planExpiresAt.getTime() - Date.now()) / 86_400_000)
    : null;
  const planExpiringSoon =
    !!planExpiresAt && planDaysLeft !== null && planDaysLeft <= 7 && planDaysLeft > 0;

  // v2 Fase 10c: en lugar de disparar la mutation directamente, abrimos el
  // modal que permite adjuntar docs (mejor evidencia para el admin, menos
  // rechazos por falta de info). El submit dentro del modal llama a la
  // misma requestVerification con docs opcionales.
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const handleRequestVerification = () => {
    setVerificationModalOpen(true);
  };

  const openViewer = (url?: string | null) => {
    const resolved = url ? resolveImage(url) : "";
    if (resolved) setViewerUri(resolved);
  };

  const onShare = async () => {
    if (!p?.id) return;
    await share({ type: "profile", id: p.id, name: p.name ?? "este perfil" });
  };

  return (
    <div className="mx-auto max-w-7xl pb-8">
      {/* Cover photo */}
      <div className="relative">
        {p?.coverUrl ? (
          <button
            type="button"
            onClick={() => openViewer(p.coverUrl)}
            className="block w-full"
            aria-label="Ver portada"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImage(p.coverUrl)}
              alt=""
              className="h-32 w-full rounded-b-3xl object-cover transition hover:opacity-95 sm:h-48"
            />
          </button>
        ) : (
          <div className="h-32 w-full rounded-b-3xl bg-gradient-to-br from-primary via-primary/80 to-secondary sm:h-48" />
        )}

        {/* Avatar overlapping cover */}
        <div className="absolute -bottom-12 left-4 sm:left-6">
          {p?.avatarUrl ? (
            <button
              type="button"
              onClick={() => openViewer(p.avatarUrl)}
              className="block"
              aria-label="Ver foto de perfil"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveImage(p.avatarUrl)}
                alt=""
                className="h-24 w-24 rounded-full border-4 border-surface object-cover shadow-card transition hover:opacity-90"
              />
            </button>
          ) : (
            <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-surface bg-primary/15 text-3xl font-extrabold text-primary shadow-card">
              {p?.name?.charAt(0) ?? "?"}
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
                {p?.name}
              </h1>
              {p?.verified && (
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

            {p?.bio && (
              <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
                {p.bio}
              </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              {p?.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {p.location}
                </span>
              )}
              {p?.showEmail && p?.email && (
                <a
                  href={`mailto:${p.email}`}
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  <Mail size={14} /> {p.email}
                </a>
              )}
              {p?.showPhone && p?.phone && (
                <a
                  href={`tel:${String(p.phone).replace(/\s+/g, "")}`}
                  className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
                >
                  <Phone size={14} /> {p.phone}
                </a>
              )}
              {p?.createdAt && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={14} /> Miembro desde {formatDate(p.createdAt)}
                </span>
              )}
            </div>

            {p?.verified ? (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck size={14} /> Cuenta verificada
              </p>
            ) : (
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted">
                <ShieldCheck size={14} /> Cuenta no verificada
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/edit-profile"
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
            >
              <Edit3 size={16} /> Editar perfil
            </Link>
            <Link
              href="/plans"
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
            >
              <Crown size={16} /> Planes
            </Link>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-high"
            >
              <Settings size={16} /> Ajustes
            </button>
            <button
              type="button"
              onClick={onShare}
              aria-label="Compartir perfil"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary transition hover:bg-primary/90"
            >
              <Share2 size={16} /> Compartir
            </button>
          </div>
        </div>
      </div>

      {/* Plan expiring banner */}
      {planExpiringSoon && (
        <div className="mx-4 mt-6 flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-950/30 sm:mx-6">
          <Clock
            size={18}
            className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
          />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Tu plan {planLabel} expira en {planDaysLeft} día
              {planDaysLeft === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 text-sm text-amber-800/80 dark:text-amber-200/80">
              Renueva antes del {formatDate(p?.planExpiresAt)} para no perder
              las ventajas.
            </p>
          </div>
          <Link
            href="/plans"
            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
          >
            Renovar
          </Link>
        </div>
      )}

      {/* Verification request section */}
      {!p?.verified && (
        <div className="mx-4 mt-6 rounded-xl border border-outline-variant/30 bg-surface-lowest p-5 sm:mx-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-on-surface">
            <ShieldCheck size={18} /> Verificar cuenta
          </h3>
          {!verificationRequest ? (
            <div className="mt-3">
              <p className="text-sm text-muted">
                Solicita la verificación para obtener la insignia de cuenta
                verificada.
              </p>
              <button
                onClick={handleRequestVerification}
                disabled={requestingVerification}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
              >
                {requestingVerification ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <ShieldCheck size={16} />
                )}
                Solicitar verificación
              </button>
            </div>
          ) : (
            <div className="mt-3">
              {verificationRequest.status === "pending" && (
                <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <Clock size={16} /> Solicitud en revisión (enviada{" "}
                  {formatDate(verificationRequest.createdAt)})
                </p>
              )}
              {verificationRequest.status === "approved" && (
                <p className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={16} /> Verificación aprobada
                </p>
              )}
              {verificationRequest.status === "rejected" && (
                <div>
                  <p className="flex items-center gap-2 text-sm text-danger">
                    <XCircle size={16} /> Solicitud rechazada
                  </p>
                  {verificationRequest.rejectedReason && (
                    <p className="mt-1 text-sm text-muted">
                      Motivo: {verificationRequest.rejectedReason}
                    </p>
                  )}
                  {onCooldown ? (
                    <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted">
                      <Clock size={14} /> Podrás reintentar en{" "}
                      {cooldownDaysLeft} día
                      {cooldownDaysLeft === 1 ? "" : "s"}
                    </p>
                  ) : (
                    <button
                      onClick={handleRequestVerification}
                      disabled={requestingVerification}
                      className="mt-3 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
                    >
                      {requestingVerification ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <ShieldCheck size={16} />
                      )}
                      Solicitar de nuevo
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Extended stats (STAR / PREMIUM) */}
      {products.length > 0 &&
        (hasStatsAccess ? (
          <div className="mx-4 mt-6 rounded-xl border border-outline-variant/30 bg-surface-lowest p-5 sm:mx-6">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-on-surface">
                Estadísticas
              </h3>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-4">
              <MiniStat
                icon={<Eye size={14} />}
                label="Visitas"
                value={formatNumber(totalViews)}
              />
              <MiniStat
                icon={<Heart size={14} />}
                label="Favoritos"
                value={formatNumber(totalFavorites)}
              />
              {hasFullStats && (
                <>
                  <MiniStat
                    icon={<Phone size={14} />}
                    label="Contactos"
                    value={formatNumber(totalContacts)}
                  />
                  <MiniStat
                    icon={<SearchIcon size={14} />}
                    label="Búsquedas"
                    value={formatNumber(totalImpressions)}
                  />
                </>
              )}
            </div>

            {hasFullStats && viewsDaily.length > 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-muted">
                  Visitas últimos 7 días
                </p>
                {/* Grid with explicit rows: bars area (flexible) + label area
                    (fixed). Fixes the previous flex-column-with-percent-height
                    bug where the inner bar had no reference height. */}
                <div
                  className="mt-3 grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${viewsDaily.length}, minmax(0, 1fr))`,
                    gridTemplateRows: "6rem auto",
                  }}
                >
                  {viewsDaily.map((d) => (
                    <div
                      key={`${d.date}-bar`}
                      className="flex items-end"
                      style={{ gridRow: 1 }}
                    >
                      <div
                        className="w-full rounded-t bg-primary/70 transition hover:bg-primary"
                        style={{
                          height: `${Math.max(4, (d.count / maxDaily) * 100)}%`,
                        }}
                        title={`${d.count} visita${d.count === 1 ? "" : "s"}`}
                      />
                    </div>
                  ))}
                  {viewsDaily.map((d) => (
                    <span
                      key={`${d.date}-lbl`}
                      className="mt-1 text-center text-[10px] text-muted"
                      style={{ gridRow: 2 }}
                    >
                      {new Date(d.date + "T00:00:00").toLocaleDateString(
                        "es-ES",
                        { weekday: "narrow" },
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hasFullStats && topProduct && (topProduct.views ?? 0) > 0 && (
              <p className="mt-4 text-sm text-muted">
                Más visto:{" "}
                <Link
                  href={`/product/${topProduct.id}`}
                  className="font-semibold text-on-surface hover:underline"
                >
                  {topProduct.title}
                </Link>{" "}
                ({formatNumber(topProduct.views ?? 0)} visitas)
              </p>
            )}
          </div>
        ) : (
          <Link
            href="/plans"
            className="mx-4 mt-6 flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-5 transition hover:border-primary/40 sm:mx-6"
          >
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10 text-primary">
              <TrendingUp size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-on-surface">
                Estadísticas de tus anuncios
              </p>
              <p className="text-sm text-muted">
                Visitas, favoritos y tu anuncio más popular. Disponible con el
                plan Estrella.
              </p>
            </div>
            <span className="text-sm font-bold text-primary">Ver planes →</span>
          </Link>
        ))}

      {/* Tabs — styled as stat cards. Replaces the old separate stats row so
          the totals ARE the tabs the user clicks. */}
      <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <StatTab
          active={tab === "listings"}
          onClick={() => setTab("listings")}
          icon={<Package size={20} />}
          label="Anuncios"
          value={products.length}
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

      {/* Tab content */}
      <div className="mt-4">
        {tab === "listings" &&
          (!prodLoading && products.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-muted">
                No tienes anuncios publicados.{" "}
                <Link href="/post" className="font-semibold text-primary">
                  Publica tu primer anuncio
                </Link>
                .
              </p>
            </div>
          ) : (
            <>
              {/* v2 Fase 10b — panel plan-gateado para gestionar pins de
                  perfil y pool de auto-bump. Renderiza null para Free/Basic. */}
              {profile?.id && (
                <PlanFeaturesPanel
                  userId={profile.id}
                  effectivePlan={effectivePlan}
                  products={products}
                />
              )}
              <ProductGrid
                products={products}
                loading={prodLoading}
                ownerActions
                pageSize={16}
              />
            </>
          ))}

        {tab === "reviews" && (
          <ReviewsList
            reviews={reviews}
            average={avgRating}
            count={ratingCount}
          />
        )}
        {tab === "followers" && (
          <UsersList items={followers} kind="follower" />
        )}
        {tab === "following" && (
          <UsersList items={following} kind="following" />
        )}
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <VerificationRequestModal
        open={verificationModalOpen}
        onClose={() => setVerificationModalOpen(false)}
        onSubmitted={() => refetchVerification()}
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
      className={`rounded-xl border p-4 text-center transition relative ${
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
      <p className="text-2xl font-extrabold tabular-nums text-on-surface wrap-break-word">
        {typeof value === "number" ? formatNumber(value)  : value}
      </p>
      <p
        className={`text-xs ${active ? "font-semibold text-primary" : "text-muted"}`}
      >
        {label}
      </p>
    </button>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg bg-surface-container p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-extrabold tabular-nums text-on-surface">
        {value}
      </p>
    </div>
  );
}

const REVIEWS_PAGE_SIZE = 10;

function ReviewsList({
  reviews,
  average,
  count,
}: {
  reviews: any[];
  average: number;
  count: number;
}) {
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PAGE_SIZE);
  const visible = reviews.slice(0, visibleCount);
  const hasMore = visibleCount < reviews.length;

  if (reviews.length === 0) {
    return (
      <div className="px-6 py-16 text-center">
        <MessageSquare
          size={40}
          className="mx-auto mb-3 text-outline-variant"
          strokeWidth={1}
        />
        <p className="text-sm text-muted">Aún no tienes valoraciones.</p>
      </div>
    );
  }
  return (
    <div className="px-4 sm:px-6">
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
      <div className="space-y-3">
        {visible.map((r) => (
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
                <span className="text-sm font-semibold text-on-surface">
                  {r.author?.name}
                </span>
              </div>
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={12}
                    className={
                      i <= r.rating
                        ? "fill-amber-400 text-amber-400"
                        : "fill-gray-200 text-gray-200 dark:fill-gray-700 dark:text-gray-700"
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

      {hasMore ? (
        <button
          type="button"
          onClick={() =>
            setVisibleCount((c) =>
              Math.min(c + REVIEWS_PAGE_SIZE, reviews.length),
            )
          }
          className="mx-auto mt-4 flex h-11 w-full max-w-xs items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-surface-container"
        >
          <Plus size={16} strokeWidth={2} />
          Cargar más
        </button>
      ) : reviews.length > REVIEWS_PAGE_SIZE ? (
        <p className="mt-4 text-center text-xs text-muted">
          Has visto todas las valoraciones
        </p>
      ) : null}
    </div>
  );
}

const USERS_PAGE_SIZE = 20;

function UsersList({
  items,
  kind,
}: {
  items: any[];
  kind: "follower" | "following";
}) {
  const [visibleCount, setVisibleCount] = useState(USERS_PAGE_SIZE);
  const visible = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

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
            ? "Aún no tienes seguidores."
            : "Aún no sigues a nadie."}
        </p>
      </div>
    );
  }
  return (
    <div className="px-4 sm:px-6">
    <div className="grid gap-3 sm:grid-cols-2">
      {visible.map((entry: any) => {
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
          setVisibleCount((c) => Math.min(c + USERS_PAGE_SIZE, items.length))
        }
        className="mx-auto mt-4 flex h-11 w-full max-w-xs items-center justify-center gap-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-sm font-semibold text-primary transition hover:border-primary/40 hover:bg-surface-container"
      >
        <Plus size={16} strokeWidth={2} />
        Cargar más
      </button>
    ) : items.length > USERS_PAGE_SIZE ? (
      <p className="mt-4 text-center text-xs text-muted">
        {kind === "follower"
          ? "Has visto todos los seguidores"
          : "Has visto todos los seguidos"}
      </p>
    ) : null}
    </div>
  );
}
