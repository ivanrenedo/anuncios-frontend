"use client";

import Link from "next/link";
import {
  ArrowRight,
  Zap,
  ShieldCheck,
  MapPin,
  Gift,
  Eye,
  TrendingUp,
  Sparkles,
} from "lucide-react";

import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useHomeSections } from "@/hooks/useHomeSections";
import PromoCarousel from "@/components/home/PromoCarousel";
import CategoryRail from "@/components/home/CategoryRail";
import SectionHeader from "@/components/SectionHeader";
import ProductRail from "@/components/ProductRail";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

export default function HomePage() {
  const { products, loading: productsLoading } = useProducts(40);
  const { categories } = useCategories();
  const { sections, loading: sectionsLoading } = useHomeSections();

  // Fallback sections: "featured" by views, "recent" by date.
  const featured: Product[] = [...products]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 10);

  const recent: Product[] = [...products].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? ""),
  );

  // Split sections by type.
  const railSections = sections.filter((s) => s.type === "rail");
  const gridSections = sections.filter((s) => s.type === "grid");
  const bannerSections = sections.filter((s) => s.type === "banner");
  const hasDynamicSections =
    railSections.length > 0 || gridSections.length > 0;

  const rootCategories = categories.filter((c: any) => !c.parentId);

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-outline-variant/30 bg-gradient-to-br from-primary/10 via-surface to-surface">
        {/* Radial decorations */}
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(19,193,172,0.18) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(251,147,0,0.12) 0%, transparent 40%)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20">
          <div className="max-w-2xl">
            <span className="mb-4 inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
              <Sparkles size={12} />
              El marketplace de Guinea Ecuatorial
            </span>

            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
              Compra y vende{" "}
              <span className="text-primary">entre particulares</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Productos, vehículos, inmuebles, servicios y empleo. Anuncios
              publicados por personas cerca de ti.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/explore"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-soft transition hover:bg-primary/90"
              >
                Explorar anuncios
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/post"
                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant/50 bg-surface-lowest px-6 py-2.5 text-sm font-bold text-on-surface transition hover:bg-surface-container"
              >
                Publicar anuncio
                <Zap size={16} />
              </Link>
            </div>

            {/* Trust signals — real platform features */}
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                Vendedores verificados
              </div>
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-primary" />
                Sin comisiones
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                Cerca de ti
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl">
        {/* ── Categories ───────────────────────────────────────────── */}
        {rootCategories.length > 0 && (
          <section className="pt-10">
            <SectionHeader
              title="Explora por categoría"
              subtitle="Encuentra justo lo que buscas"
            />
            <CategoryRail categories={rootCategories} />
          </section>
        )}

        {/* ── Backend banners (only when they exist) ───────────────── */}
        {bannerSections.length > 0 && (
          <section className="pt-6">
            <PromoCarousel sections={bannerSections} />
          </section>
        )}

        {/* ── Dynamic Home Sections ────────────────────────────────── */}
        {hasDynamicSections && (
          <>
            {railSections.map((section) => (
              <section key={section.id} className="pt-10">
                <SectionHeader
                  title={section.title}
                  subtitle={section.subtitle ?? undefined}
                  href="/explore"
                />
                <ProductRail
                  products={section.products ?? []}
                  loading={sectionsLoading}
                />
              </section>
            ))}

            {gridSections.map((section) => (
              <section key={section.id} className="pt-10">
                <SectionHeader
                  title={section.title}
                  subtitle={section.subtitle ?? undefined}
                  href="/explore"
                />
                <ProductGrid
                  products={section.products ?? []}
                  loading={sectionsLoading}
                />
              </section>
            ))}
          </>
        )}

        {/* ── Fallback Sections (when no backend sections) ─────────── */}
        {!hasDynamicSections && (
          <>
            <section className="pt-10">
              <SectionHeader
                title="Destacados"
                subtitle="Lo más visto en Bomell"
                icon={<TrendingUp size={22} className="text-primary" />}
                href="/explore"
              />
              <ProductRail products={featured} loading={productsLoading} />
            </section>

            <section className="pt-10">
              <SectionHeader
                title="Recién publicados"
                subtitle="Lo último que se ha publicado"
                icon={<Eye size={22} className="text-primary" />}
                href="/explore"
              />
              <ProductGrid products={recent} loading={productsLoading} />
            </section>
          </>
        )}

        {/* ── CTA ──────────────────────────────────────────────────── */}
        <section className="px-4 py-14 sm:px-6">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary-container p-8 sm:p-12">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
                ¿Tienes algo que vender?
              </h2>
              <p className="mt-2 text-sm text-white/90 sm:text-base">
                Publica tu anuncio en menos de 2 minutos. Es gratis y llega a
                compradores cerca de ti.
              </p>
              <Link
                href="/post"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-bold text-primary shadow-soft transition hover:bg-white/90"
              >
                Publicar mi anuncio
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
