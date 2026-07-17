"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@apollo/client/react";
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
} from "lucide-react";
import {
  GET_USER,
  PRODUCTS_BY_SELLER,
  SELLER_RATING,
  REVIEWS_BY_SELLER,
  FOLLOWERS_COUNT,
  FOLLOWING_COUNT,
  IS_FOLLOWING,
} from "@/graphql/queries";
import { FOLLOW_USER, UNFOLLOW_USER } from "@/graphql/mutations";
import { useAuth } from "@/hooks/useAuth";
import { resolveImage } from "@/lib/config";
import { formatDate } from "@/lib/format";
import ProductGrid from "@/components/ProductGrid";
import ReportModal from "@/components/ReportModal";
import Skeleton from "@/components/Skeleton";
import type { Product } from "@/lib/types";

type Tab = "active" | "sold";

export default function PublicUserProfile() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const router = useRouter();
  const { user: me, isAuthenticated } = useAuth();
  const isOwn = !!me?.id && me.id === id;

  const [activeTab, setActiveTab] = useState<Tab>("active");

  const { data, loading } = useQuery(GET_USER, {
    variables: { id },
    skip: !id,
  }) as { data: any; loading: boolean };
  const user = data?.user;

  const { data: prodData, loading: prodLoading } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: id },
    skip: !id,
  }) as { data: any; loading: boolean };
  const { data: ratingData } = useQuery(SELLER_RATING, {
    variables: { sellerId: id },
    skip: !id,
  }) as { data: any };
  const { data: reviewsData } = useQuery(REVIEWS_BY_SELLER, {
    variables: { sellerId: id },
    skip: !id,
  }) as { data: any };
  const { data: followersData } = useQuery(FOLLOWERS_COUNT, {
    variables: { userId: id },
    skip: !id,
  }) as { data: any };
  const { data: followingData } = useQuery(FOLLOWING_COUNT, {
    variables: { userId: id },
    skip: !id,
  }) as { data: any };
  const { data: isFollowingData } = useQuery(IS_FOLLOWING, {
    variables: { userId: id },
    skip: !id || !isAuthenticated || isOwn,
  }) as { data: any };

  const followOpts = {
    refetchQueries: ["Following", "IsFollowing", "FollowersCount"],
    awaitRefetchQueries: true,
  };
  const [followUser] = useMutation(FOLLOW_USER, followOpts);
  const [unfollowUser] = useMutation(UNFOLLOW_USER, followOpts);
  const [following, setFollowing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    setFollowing(!!isFollowingData?.isFollowing);
  }, [isFollowingData]);

  const products: Product[] = prodData?.productsBySeller ?? [];
  const rating = ratingData?.sellerRating;
  const reviews: any[] = reviewsData?.reviewsBySeller ?? [];
  const followersCount = followersData?.followersCount ?? 0;
  const followingCount = followingData?.followingCount ?? 0;

  const activeProducts = products.filter((p) => p.status === "active");
  const soldProducts = products.filter((p) => p.status === "sold");
  const tabProducts = activeTab === "active" ? activeProducts : soldProducts;

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
    const next = !following;
    setFollowing(next);
    try {
      if (next) await followUser({ variables: { userId: id } });
      else await unfollowUser({ variables: { userId: id } });
    } catch {
      setFollowing(!next);
    }
  };

  const onReport = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setReportOpen(true);
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
        <Link href="/" className="mt-3 inline-block text-primary hover:underline">
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImage(user.coverUrl)}
            alt=""
            className="h-32 w-full rounded-3xl object-cover sm:h-48 sm:mx-4 sm:w-[calc(100%-2rem)] md:mx-6 md:w-[calc(100%-3rem)]"
          />
        ) : (
          <div className="mx-4 h-32 rounded-3xl bg-gradient-to-br from-primary via-primary/80 to-secondary sm:mx-6 sm:h-48" />
        )}

        {/* Avatar overlapping cover */}
        <div className="absolute -bottom-12 left-8 sm:left-10">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImage(user.avatarUrl)}
              alt=""
              className="h-24 w-24 rounded-full border-4 border-surface object-cover shadow-card"
            />
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
              <h1 className="text-2xl font-extrabold text-on-surface">{user.name}</h1>
              {user.verified && (
                <BadgeCheck size={20} className="fill-primary text-white" strokeWidth={0} />
              )}
              {planLabel && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    planLabel === "Premium"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                      : "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                  }`}
                >
                  {planLabel === "Premium" ? <Crown size={12} /> : <Star size={12} />}
                  {planLabel}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">{user.bio}</p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
              {user.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {user.location}
                </span>
              )}
              {user.showEmail && user.email && (
                <span className="inline-flex items-center gap-1">
                  <Mail size={14} /> {user.email}
                </span>
              )}
              {user.showPhone && user.phone && (
                <span className="inline-flex items-center gap-1">
                  <Phone size={14} /> {user.phone}
                </span>
              )}
              <span>Miembro desde {formatDate(user.createdAt)}</span>
            </div>
          </div>

          {/* Actions */}
          {!isOwn && (
            <div className="flex gap-2">
              <button
                onClick={onToggleFollow}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition ${
                  following
                    ? "bg-surface-container text-on-surface hover:bg-surface-high"
                    : "bg-primary text-on-primary hover:bg-primary/90"
                }`}
              >
                {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {following ? "Siguiendo" : "Seguir"}
              </button>
              <button
                onClick={onReport}
                className="flex items-center gap-1.5 rounded-lg bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:opacity-80"
              >
                <Flag size={16} /> Reportar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-6 grid grid-cols-2 gap-3 px-4 sm:grid-cols-4 sm:px-6">
        <StatCard icon={<Package size={20} />} label="Anuncios" value={products.length} />
        <StatCard
          icon={<Star size={20} />}
          label="Valoración"
          value={rating?.average ? rating.average.toFixed(1) : "--"}
        />
        <StatCard icon={<Users size={20} />} label="Seguidores" value={followersCount} />
        <StatCard icon={<UserPlus size={20} />} label="Siguiendo" value={followingCount} />
      </div>

      {/* Product tabs */}
      <div className="mt-8 px-4 sm:px-6">
        <div className="flex items-center gap-1 rounded-xl bg-surface-container p-1">
          {([
            { key: "active" as Tab, label: "Activos", count: activeProducts.length },
            { key: "sold" as Tab, label: "Vendidos", count: soldProducts.length },
          ]).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
                activeTab === tab.key
                  ? "bg-surface-lowest text-on-surface shadow-sm"
                  : "text-muted hover:text-on-surface-variant"
              }`}
            >
              {tab.label}{" "}
              <span
                className={`ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
                  activeTab === tab.key
                    ? "bg-primary/15 text-primary"
                    : "bg-surface-high text-muted"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        {!prodLoading && tabProducts.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted">
            {activeTab === "active"
              ? "Este usuario no tiene anuncios activos."
              : "Este usuario no tiene productos vendidos."}
          </p>
        ) : (
          <ProductGrid products={tabProducts} loading={prodLoading} />
        )}
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-10 px-4 sm:px-6">
          <h2 className="mb-3 text-lg font-extrabold">Valoraciones</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
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
                      <p className="text-sm font-semibold text-on-surface">{r.author?.name}</p>
                      <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        className={
                          i <= r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-outline-variant"
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
        </div>
      )}

      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        type="user"
        targetId={id}
        targetLabel={user.name}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
      <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-2xl font-extrabold text-on-surface">
        {typeof value === "number" ? value.toLocaleString("es") : value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
