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
  ArrowLeft,
} from "lucide-react";
import {
  GET_USER,
  PRODUCTS_BY_SELLER,
  SELLER_RATING,
  REVIEWS_BY_SELLER,
  GET_FOLLOWERS,
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

export default function PublicUserProfile() {
  const params = useParams();
  const id = (params?.id as string) ?? "";
  const router = useRouter();
  const { user: me, isAuthenticated } = useAuth();
  const isOwn = !!me?.id && me.id === id;

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
  const { data: followersData, refetch: refetchFollowers } = useQuery(GET_FOLLOWERS, {
    variables: { userId: id },
    skip: !id,
  }) as { data: any; refetch: () => void };
  const { data: isFollowingData } = useQuery(IS_FOLLOWING, {
    variables: { userId: id },
    skip: !id || !isAuthenticated || isOwn,
  }) as { data: any };

  // Followers is refetched manually below; also refresh the following list and
  // the follow state so they stay in sync app-wide.
  const followOpts = {
    refetchQueries: ["Following", "IsFollowing"],
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
  const followersCount = (followersData?.followers ?? []).length;

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
      refetchFollowers();
    } catch {
      setFollowing(!next); // revert on failure
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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Skeleton className="h-44 rounded-3xl" />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
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
    <div className="mx-auto max-w-7xl py-6">
      <div className="px-4 sm:px-6">
        <button
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-on-surface"
        >
          <ArrowLeft size={16} /> Volver
        </button>

        {/* Header card */}
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-outline-variant/30 bg-surface-lowest p-6 shadow-soft sm:flex-row sm:items-center">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImage(user.avatarUrl)}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-2xl font-extrabold text-primary">
              {user.name?.charAt(0) ?? "?"}
            </div>
          )}

          <div className="flex-1">
            <h1 className="flex items-center gap-1.5 text-xl font-extrabold">
              {user.name}
              {user.verified && (
                <BadgeCheck size={18} className="fill-primary text-white" strokeWidth={0} />
              )}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
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
            {user.bio && (
              <p className="mt-3 max-w-2xl text-sm text-on-surface-variant">{user.bio}</p>
            )}
          </div>

          {/* Actions — hidden on your own profile */}
          {!isOwn && (
            <div className="flex gap-2">
              <button
                onClick={onToggleFollow}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
                  following
                    ? "bg-surface-container text-on-surface hover:bg-surface-high"
                    : "bg-primary text-on-primary hover:opacity-90"
                }`}
              >
                {following ? <UserCheck size={16} /> : <UserPlus size={16} />}
                {following ? "Siguiendo" : "Seguir"}
              </button>
              <button
                onClick={onReport}
                className="flex items-center gap-1.5 rounded-full bg-danger-soft px-4 py-2 text-sm font-bold text-danger transition hover:opacity-80"
              >
                <Flag size={16} /> Reportar
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Anuncios" value={products.length} />
          <Stat label="Valoración" value={rating?.average ? rating.average.toFixed(1) : "—"} />
          <Stat label="Seguidores" value={followersCount} />
        </div>
      </div>

      {/* Listings */}
      <div className="mt-8">
        <h2 className="mb-3 px-4 text-lg font-extrabold sm:px-6">Anuncios</h2>
        {!prodLoading && products.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-muted">
            Este usuario no tiene anuncios publicados.
          </p>
        ) : (
          <ProductGrid products={products} loading={prodLoading} />
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
                className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4"
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
      <p className="text-2xl font-extrabold text-on-surface">
        {typeof value === "number" ? value.toLocaleString("es") : value}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
