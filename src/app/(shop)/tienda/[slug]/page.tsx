"use client";

import { use, useMemo } from "react";
import { useRouter, notFound } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import {
  Crown,
  BadgeCheck,
  MapPin,
  ArrowLeft,
  MessageCircle,
} from "lucide-react";
import { GET_USER, PRODUCTS_BY_SELLER, PINNED_PRODUCTS } from "@/graphql/queries";
import { resolveImage } from "@/lib/config";
import type { Product } from "@/lib/types";
import ProductGrid from "@/components/ProductGrid";
import Spinner from "@/components/Spinner";

/**
 * v2 Fase 6b.1 — Premium storefront.
 *
 * `slug` accepts the user's id for now (vanity URL support requires a
 * `User.slug` column, out of scope for v2). Anyone can visit; if the target
 * user is not Premium (or their plan has expired), the page redirects them
 * to the normal `/user/[id]` profile — the tienda experience is a Premium
 * feature and shouldn't leak to Basic/Star/Free sellers.
 */
export default function PremiumStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();

  const { data: userData, loading: userLoading } = useQuery(GET_USER, {
    variables: { id: slug },
    skip: !slug,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean };
  const user = userData?.user;

  const { data: prodData, loading: prodLoading } = useQuery(
    PRODUCTS_BY_SELLER,
    { variables: { sellerId: slug }, skip: !slug },
  ) as { data: any; loading: boolean };

  const { data: pinnedData } = useQuery(PINNED_PRODUCTS, {
    variables: { userId: slug },
    skip: !slug,
  }) as { data: any };

  const isPremiumActive =
    user &&
    user.plan === "PREMIUM" &&
    (!user.planExpiresAt || new Date(user.planExpiresAt) > new Date());

  const products: Product[] = prodData?.productsBySeller ?? [];
  const activeProducts = products.filter((p) => p.status !== "hide");
  const pinnedProducts: Product[] = pinnedData?.pinnedProducts ?? [];
  const pinnedIds = new Set(pinnedProducts.map((p) => p.id));

  // Group non-pinned products by category label — keeps browsing fast in a
  // storefront with a large catalogue.
  const byCategory = useMemo(() => {
    const buckets = new Map<string, Product[]>();
    for (const p of activeProducts) {
      if (pinnedIds.has(p.id)) continue;
      const label = p.category?.label ?? "Otros";
      const bucket = buckets.get(label) ?? [];
      bucket.push(p);
      buckets.set(label, bucket);
    }
    return Array.from(buckets.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [activeProducts, pinnedIds]);

  if (userLoading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  if (!user) {
    notFound();
  }

  // Non-Premium sellers get bounced to the regular profile so the vanity URL
  // never accidentally advertises a plan the seller does not actually have.
  if (!isPremiumActive) {
    router.replace(`/user/${slug}`);
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner />
      </div>
    );
  }

  const verifiedSince = user.businessVerifiedAt
    ? new Date(user.businessVerifiedAt).toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mx-auto max-w-6xl pb-12">
      {/* Cover + logo */}
      <div className="relative">
        {user.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImage(user.coverUrl)}
            alt=""
            className="h-48 w-full object-cover sm:h-64"
          />
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-purple-600 via-purple-500 to-primary sm:h-64" />
        )}
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-black/45 text-white backdrop-blur"
          aria-label="Volver"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Header card */}
      <div className="relative -mt-10 mx-4 rounded-2xl bg-surface-lowest p-4 shadow-soft sm:mx-6 sm:p-6">
        <div className="flex items-start gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImage(user.avatarUrl)}
              alt={user.name}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover ring-4 ring-surface-lowest"
            />
          ) : (
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-primary/15 text-2xl font-extrabold text-primary ring-4 ring-surface-lowest">
              {user.name.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-extrabold sm:text-2xl">
                {user.name}
              </h1>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2 py-0.5 text-[11px] font-extrabold text-white">
                <Crown size={11} className="text-white" strokeWidth={2.5} />
                Premium
              </span>
              {user.verified && (
                <BadgeCheck
                  size={16}
                  className="fill-primary text-white"
                  aria-label="Cuenta verificada"
                />
              )}
            </div>

            {verifiedSince && (
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                Verificado desde {verifiedSince}
              </p>
            )}

            {user.location && (
              <p className="mt-1 inline-flex items-center gap-1 text-[13px] text-on-surface-variant">
                <MapPin size={12} strokeWidth={1.5} />
                {user.location}
              </p>
            )}

            {user.bio && (
              <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                {user.bio}
              </p>
            )}

            {user.phone && (
              <a
                href={`https://wa.me/${user.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hola, vi tu tienda en Bomelh — ${user.name}`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary transition hover:opacity-90"
              >
                <MessageCircle size={14} strokeWidth={2} />
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Pinned products */}
      {pinnedProducts.length > 0 && (
        <section className="mt-8 px-4 sm:px-6">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[11px] font-extrabold uppercase tracking-wide text-primary">
              📌 Destacados de la tienda
            </span>
          </div>
          <ProductGrid
            products={pinnedProducts}
            loading={false}
            pageSize={pinnedProducts.length}
          />
        </section>
      )}

      {/* Catalogue grouped by category */}
      <div className="mt-10">
        {prodLoading && activeProducts.length === 0 && (
          <div className="grid min-h-[30vh] place-items-center">
            <Spinner />
          </div>
        )}
        {!prodLoading && byCategory.length === 0 && pinnedProducts.length === 0 && (
          <p className="px-4 py-12 text-center text-sm text-muted sm:px-6">
            Esta tienda aún no tiene anuncios publicados.
          </p>
        )}
        {byCategory.map(([label, items]) => (
          <section key={label} className="mb-8 px-4 sm:px-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-extrabold tracking-tight">
                {label}
              </h2>
              <Link
                href={`/user/${user.id}`}
                className="text-xs font-semibold text-on-surface-variant hover:text-primary"
              >
                Ver perfil completo
              </Link>
            </div>
            <ProductGrid products={items} loading={false} pageSize={items.length} />
          </section>
        ))}
      </div>
    </div>
  );
}
