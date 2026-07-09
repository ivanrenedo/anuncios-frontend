"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { BadgeCheck, MapPin, LogOut, Plus, Phone } from "lucide-react";
import { PRODUCTS_BY_SELLER } from "@/graphql/queries";
import { useAuth } from "@/hooks/useAuth";
import { resolveImage } from "@/lib/config";
import ProductGrid from "@/components/ProductGrid";
import PhoneVerificationModal from "@/components/PhoneVerificationModal";
import type { Product } from "@/lib/types";

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);

  const { data, loading } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: user?.id ?? "" },
    skip: !user?.id,
  }) as { data: any; loading: boolean };

  if (!authLoading && !isAuthenticated) {
    return (
      <div className="px-6 py-28 text-center">
        <p className="text-lg font-bold">Tu perfil</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Inicia sesión para ver tu perfil, tus anuncios y tus favoritos.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-on-primary"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  const products: Product[] = data?.productsBySeller ?? [];
  const totalViews = products.reduce((s, p) => s + (p.views ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl py-6">
      {/* Header card */}
      <div className="px-4 sm:px-6">
        <div className="flex flex-col items-start gap-4 rounded-3xl border border-outline-variant/30 bg-surface-lowest p-6 shadow-soft sm:flex-row sm:items-center">
          {user?.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImage(user.avatarUrl)}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/15 text-2xl font-extrabold text-primary">
              {user?.name?.charAt(0) ?? "?"}
            </div>
          )}

          <div className="flex-1">
            <h1 className="flex items-center gap-1.5 text-xl font-extrabold">
              {user?.name}
              {user?.verified && (
                <BadgeCheck size={18} className="fill-primary text-white" strokeWidth={0} />
              )}
            </h1>
            <p className="text-sm text-muted">{user?.email}</p>
            {user?.location && (
              <p className="mt-1 flex items-center gap-1 text-sm text-on-surface-variant">
                <MapPin size={14} /> {user.location}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPhoneModalOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-surface-container px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-container/80"
            >
              <Phone size={16} /> {user?.phone ? "Cambiar teléfono" : "Verificar teléfono"}
            </button>
            <Link
              href="/post"
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-bold text-on-primary"
            >
              <Plus size={16} /> Vender
            </Link>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-full bg-surface-container px-4 py-2 text-sm font-bold text-danger transition hover:bg-danger-soft"
            >
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Anuncios" value={products.length} />
          <Stat label="Vistas" value={totalViews} />
          <Stat
            label="Activos"
            value={products.filter((p) => p.status === "active").length}
          />
        </div>
      </div>

      {/* Listings */}
      <div className="mt-8">
        <h2 className="mb-3 px-4 text-lg font-extrabold sm:px-6">Mis anuncios</h2>
        {!loading && products.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-muted">
              Todavía no has publicado nada.{" "}
              <Link href="/post" className="font-semibold text-primary">
                Publica tu primer anuncio
              </Link>
              .
            </p>
          </div>
        ) : (
          <ProductGrid products={products} loading={loading} />
        )}
      </div>

      {phoneModalOpen && (
        <PhoneVerificationModal onClose={() => setPhoneModalOpen(false)} />
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
      <p className="text-2xl font-extrabold text-on-surface">
        {value.toLocaleString("es")}
      </p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
