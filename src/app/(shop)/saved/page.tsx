"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { Heart } from "lucide-react";
import { MY_FAVORITES } from "@/graphql/queries";
import { useAuth } from "@/hooks/useAuth";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

export default function SavedPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data, loading } = useQuery(MY_FAVORITES, {
    skip: !isAuthenticated,
  }) as { data: any; loading: boolean };

  if (!authLoading && !isAuthenticated) {
    return (
      <EmptyState
        title="Guarda tus favoritos"
        body="Inicia sesión para guardar anuncios y verlos en cualquier momento."
        cta={{ href: "/login", label: "Iniciar sesión" }}
      />
    );
  }

  const products: Product[] = (data?.myFavorites ?? [])
    .map((f: any) => f.product)
    .filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl py-6">
      <div className="px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight">Favoritos</h1>
        <p className="mt-1 text-sm text-muted">
          {products.length} anuncios guardados
        </p>
      </div>

      <div className="mt-6">
        {!loading && products.length === 0 ? (
          <EmptyState
            title="Aún no tienes favoritos"
            body="Toca el corazón en cualquier anuncio para guardarlo aquí."
            cta={{ href: "/explore", label: "Explorar anuncios" }}
            inline
          />
        ) : (
          <ProductGrid products={products} loading={loading} />
        )}
      </div>
    </div>
  );
}

function EmptyState({
  title,
  body,
  cta,
  inline,
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
  inline?: boolean;
}) {
  return (
    <div className={`px-6 text-center ${inline ? "py-16" : "py-28"}`}>
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
        <Heart size={28} />
      </div>
      <p className="mt-4 text-lg font-bold text-on-surface">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm text-muted">{body}</p>
      <Link
        href={cta.href}
        className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary"
      >
        {cta.label}
      </Link>
    </div>
  );
}
