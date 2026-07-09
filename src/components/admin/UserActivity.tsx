"use client";

import { useState, type ReactNode } from "react";
import { useQuery } from "@apollo/client/react";
import {
  PRODUCTS_BY_SELLER,
  FAVORITES_BY_USER,
  REVIEWS_BY_AUTHOR,
  REVIEWS_BY_SELLER,
  GET_FOLLOWERS,
  GET_FOLLOWING,
} from "@/graphql/queries";
import Badge from "@/components/admin/Badge";
import ProductDetailModal from "@/components/admin/ProductDetailModal";
import Skeleton from "@/components/Skeleton";
import { resolveImage } from "@/lib/config";
import { formatDate } from "@/lib/format";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Tabbed activity for a user: anuncios, favoritos, reseñas dadas/recibidas,
 * seguidores y siguiendo. Shared by /admin/users/[id] and /admin/profile.
 */
export default function UserActivity({
  userId,
  onOpenUser,
}: {
  userId: string;
  onOpenUser?: (id: string) => void;
}) {
  const [tab, setTab] = useState("products");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const { data: prodData, loading: prodLoading } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: userId },
    skip: !userId,
  }) as { data: any; loading: boolean };
  const { data: favData, loading: favLoading } = useQuery(FAVORITES_BY_USER, {
    variables: { userId },
    skip: !userId,
  }) as { data: any; loading: boolean };
  const { data: givenData, loading: givenLoading } = useQuery(REVIEWS_BY_AUTHOR, {
    variables: { authorId: userId },
    skip: !userId,
  }) as { data: any; loading: boolean };
  const { data: receivedData, loading: receivedLoading } = useQuery(REVIEWS_BY_SELLER, {
    variables: { sellerId: userId },
    skip: !userId,
  }) as { data: any; loading: boolean };
  const { data: followersData, loading: followersLoading } = useQuery(GET_FOLLOWERS, {
    variables: { userId },
    skip: !userId,
  }) as { data: any; loading: boolean };
  const { data: followingData, loading: followingLoading } = useQuery(GET_FOLLOWING, {
    variables: { userId },
    skip: !userId,
  }) as { data: any; loading: boolean };

  const products = (prodData?.productsBySeller ?? []) as any[];
  const favorites = (favData?.favoritesByUser ?? []) as any[];
  const reviewsGiven = (givenData?.reviewsByAuthor ?? []) as any[];
  const reviewsReceived = (receivedData?.reviewsBySeller ?? []) as any[];
  const followers = (followersData?.followers ?? []) as any[];
  const following = (followingData?.following ?? []) as any[];

  const loadingByTab: Record<string, boolean> = {
    products: prodLoading,
    favorites: favLoading,
    given: givenLoading,
    received: receivedLoading,
    followers: followersLoading,
    following: followingLoading,
  };

  const tabs = [
    { key: "products", label: "Anuncios", count: products.length },
    { key: "favorites", label: "Favoritos", count: favorites.length },
    { key: "given", label: "Reseñas dadas", count: reviewsGiven.length },
    { key: "received", label: "Reseñas recibidas", count: reviewsReceived.length },
    { key: "followers", label: "Seguidores", count: followers.length },
    { key: "following", label: "Siguiendo", count: following.length },
  ];

  const open = onOpenUser ?? (() => {});

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 border-b border-outline-variant/30">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-semibold transition ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted hover:text-on-surface"
            }`}
          >
            {t.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                tab === t.key ? "bg-primary/15 text-primary" : "bg-surface-container text-muted"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div>
        {loadingByTab[tab] ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-44" />
            ))}
          </div>
        ) : (
          <>
            {tab === "products" && (
              <Paginated items={products} pageSize={12}>
                {(page) => <ProductGrid products={page} empty="Sin anuncios publicados." onProductClick={setSelectedProduct} />}
              </Paginated>
            )}
            {tab === "favorites" && (
              <Paginated items={favorites.map((f) => f.product).filter(Boolean)} pageSize={12}>
                {(page) => <ProductGrid products={page} empty="Sin favoritos." onProductClick={setSelectedProduct} />}
              </Paginated>
            )}
            {tab === "given" && (
              <Paginated items={reviewsGiven} pageSize={6}>
                {(page) => <ReviewList reviews={page} userKey="seller" empty="No ha dejado reseñas." />}
              </Paginated>
            )}
            {tab === "received" && (
              <Paginated items={reviewsReceived} pageSize={6}>
                {(page) => <ReviewList reviews={page} userKey="author" empty="No ha recibido reseñas." />}
              </Paginated>
            )}
            {tab === "followers" && (
              <Paginated items={followers} pageSize={8}>
                {(page) => <UserList rows={page} userKey="follower" empty="Sin seguidores." onOpen={open} />}
              </Paginated>
            )}
            {tab === "following" && (
              <Paginated items={following} pageSize={8}>
                {(page) => <UserList rows={page} userKey="followed" empty="No sigue a nadie." onOpen={open} />}
              </Paginated>
            )}
          </>
        )}
      </div>

      <ProductDetailModal
        productId={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-outline-variant/30 py-10 text-center text-sm text-muted">
      {text}
    </p>
  );
}

/**
 * Client-side pagination wrapper. Slices `items` to the current page and renders
 * the controls only when there's more than one page. Each tab mounts its own
 * instance, so switching tabs resets to page 1.
 */
function Paginated<T>({
  items,
  pageSize,
  children,
}: {
  items: T[];
  pageSize: number;
  children: (page: T[]) => ReactNode;
}) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages - 1);
  const slice = items.slice(current * pageSize, current * pageSize + pageSize);
  return (
    <>
      {children(slice)}
      {items.length > pageSize && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            {current * pageSize + 1}–{Math.min((current + 1) * pageSize, items.length)} de{" "}
            {items.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              aria-label="Anterior"
              className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages - 1}
              aria-label="Siguiente"
              className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={14}
          className={i <= rating ? "fill-amber-400 text-amber-400" : "text-outline-variant"}
        />
      ))}
    </div>
  );
}

function ProductGrid({ products, empty, onProductClick }: { products: any[]; empty: string; onProductClick?: (id: string) => void }) {
  if (products.length === 0) return <EmptyState text={empty} />;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onProductClick?.(p.id)}
          className="overflow-hidden rounded-xl border border-outline-variant/30 text-left transition hover:border-primary/40 hover:shadow-md"
        >
          <div className="aspect-square bg-surface-container">
            {p.images?.[0]?.url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveImage(p.images[0].url)} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="p-3">
            <p className="truncate text-sm font-semibold text-on-surface">{p.title}</p>
            <p className="text-sm font-bold text-primary">
              {Number(p.price).toLocaleString("es")} XAF
            </p>
            {p.status && (
              <div className="mt-1">
                <Badge variant={p.status === "active" ? "active" : "draft"}>{p.status}</Badge>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}

function ReviewList({
  reviews,
  userKey,
  empty,
}: {
  reviews: any[];
  userKey: "author" | "seller";
  empty: string;
}) {
  if (reviews.length === 0) return <EmptyState text={empty} />;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {reviews.map((r) => {
        const u = r[userKey];
        return (
          <div key={r.id} className="rounded-xl border border-outline-variant/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {u?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImage(u.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {u?.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-on-surface">{u?.name ?? "—"}</p>
                  <p className="text-xs text-muted">{formatDate(r.createdAt)}</p>
                </div>
              </div>
              <Stars rating={r.rating} />
            </div>
            {r.text && <p className="mt-2 text-sm text-on-surface-variant">{r.text}</p>}
          </div>
        );
      })}
    </div>
  );
}

function UserList({
  rows,
  userKey,
  empty,
  onOpen,
}: {
  rows: any[];
  userKey: "follower" | "followed";
  empty: string;
  onOpen: (id: string) => void;
}) {
  if (rows.length === 0) return <EmptyState text={empty} />;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {rows.map((row) => {
        const u = row[userKey];
        if (!u) return null;
        return (
          <button
            key={row.id}
            onClick={() => onOpen(u.id)}
            className="flex items-center gap-3 rounded-xl border border-outline-variant/30 p-3 text-left transition hover:bg-surface-container"
          >
            {u.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resolveImage(u.avatarUrl)} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary/15 font-bold text-primary">
                {u.name?.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-on-surface">{u.name}</p>
              {u.location && <p className="truncate text-xs text-muted">{u.location}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
