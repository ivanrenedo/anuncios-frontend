"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@apollo/client/react";
import {
  ArrowRight,
  Clock,
  Gift,
  MapPin,
  Megaphone,
  Plus,
  ShieldCheck,
  Shield,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useCategories } from "@/hooks/useCategories";
import { useHomeSections, type HomeSection } from "@/hooks/useHomeSections";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { PRODUCTS_BY_SELLER } from "@/graphql/queries";
import PromoCarousel from "@/components/home/PromoCarousel";
import CategoryRail from "@/components/home/CategoryRail";
import SectionHeader from "@/components/SectionHeader";
import ProductRail from "@/components/ProductRail";
import PremiumStoresRail from "@/components/home/PremiumStoresRail";
import ProductGrid from "@/components/ProductGrid";
import Skeleton from "@/components/Skeleton";
import { useUnreadCount } from "@/hooks/useNotifications";
import AdSenseSlot from "@/components/AdSenseSlot";

/**
 * Wraps a single home section with impression + click tracking. Impression
 * fires once per mount; click fires when the user hits "Ver todo" or the
 * banner. Keeps the analytics contract identical to mobile so admin metrics
 * combine cleanly across surfaces.
 */
function TrackedSection({
  section,
  trackEvent,
}: {
  section: HomeSection;
  trackEvent: (id: string, event: "impression" | "click") => void;
}) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current) return;
    tracked.current = true;
    trackEvent(section.id, "impression");
  }, [section.id, trackEvent]);

  const handleClick = () => trackEvent(section.id, "click");
  const seeAllHref = section.filter
    ? `/explore?sectionId=${encodeURIComponent(section.id)}`
    : undefined;

  if (section.type === "rail" || section.type === "product_rail" || section.type === "premium_showcase" || section.type === "recent_views") {
    // Autoplay: premium_showcase se auto-desplaza por defecto (como en
    // móvil); en product_rail lo controla la config del panel admin.
    const isPremium = section.type === "premium_showcase";
    const autoplay = isPremium ? true : !!section.config?.autoplay;
    const autoplayMs = isPremium
      ? section.config?.autoplayMs ?? 4000
      : section.config?.autoplayMs;
    return (
      <section className="pt-10">
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle ?? undefined}
          href={seeAllHref}
          onClick={seeAllHref ? handleClick : undefined}
        />
        <ProductRail
          products={section.products ?? []}
          autoplay={autoplay}
          autoplayMs={autoplayMs}
        />
      </section>
    );
  }

  if (section.type === "grid" || section.type === "product_grid") {
    return (
      <section className="pt-10">
        <SectionHeader
          title={section.title}
          subtitle={section.subtitle ?? undefined}
          href={seeAllHref}
          onClick={seeAllHref ? handleClick : undefined}
        />
        <ProductGrid products={section.products ?? []} />
      </section>
    );
  }

  return null;
}

export default function HomePage() {
  const { categories } = useCategories();
  const {
    sections,
    loading: sectionsLoading,
    trackEvent,
    // useHomeSections doesn't return refetch today — we still call the auth-
    // aware refetches below via the notifications badge.
  } = useHomeSections();
  const { isAuthenticated, user } = useAuth();
  const { refetch: refetchUnread } = useUnreadCount();

  // Whether to show the "¿Tienes algo que vender?" CTA. Only shown when the
  // logged-in user has zero listings — the guidance is redundant otherwise.
  const { data: sellerData } = useQuery(PRODUCTS_BY_SELLER, {
    variables: { sellerId: user?.id },
    skip: !isAuthenticated || !user?.id,
    fetchPolicy: "cache-and-network",
  }) as { data: any };
  const myProductsCount = sellerData?.productsBySeller?.length ?? 0;
  const [ctaDismissed, setCtaDismissed] = useState(false);
  const showInlineCta =
    isAuthenticated && !ctaDismissed && myProductsCount === 0;

  // Freshness: new listings other users publish (and new notifications) show
  // up when the user returns to Home from another tab / window.
  useRefetchOnFocus([refetchUnread]);

  const bannerSections = useMemo(
    () => sections.filter((s) => s.type === "banner"),
    [sections],
  );
  const feedSections = useMemo(
    () => sections.filter((s) => s.type !== "banner"),
    [sections],
  );
  const hasSections = sections.length > 0;

  const rootCategories = categories.filter((c: any) => !c.parentId);

  // Index of the first product-shaped section — anchors the trust bar so it
  // appears once, immediately below the first row of listings.
  const firstProductIdx = feedSections.findIndex(
    (s) =>
      s.type === "rail" ||
      s.type === "grid" ||
      s.type === "product_rail" ||
      s.type === "product_grid" ||
      s.type === "premium_showcase" ||
      s.type === "recent_views",
  );

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-outline-variant/30 bg-gradient-to-br from-primary/10 via-surface to-surface">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, rgba(19,193,172,0.18) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(251,147,0,0.12) 0%, transparent 40%)",
          }}
        />
        
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          {/* Backend banners */}
          {bannerSections.length > 0 && (
            <div>
              <PromoCarousel sections={bannerSections} />
            </div>
          )}

          <div className="max-w-2xl mt-2">
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

        {/* v2 Fase 6b.2 — Tiendas Premium. Auto-hides when the day's carousel
            is empty (no active Premium sellers picked by the cron). */}
        <PremiumStoresRail />

        {/* Inline CTA — only when the logged-in user has zero listings.
            Same placement as mobile (right after the categories rail). */}
        {showInlineCta && (
          <section className="px-4 pt-8 sm:px-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/95 to-primary-container p-6 sm:p-8">
              <div
                className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              />
              <div
                className="pointer-events-none absolute -bottom-4 -left-4 h-16 w-16 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
              <button
                onClick={() => setCtaDismissed(true)}
                className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full bg-white/15 text-white/80 transition hover:bg-white/25"
                aria-label="Cerrar aviso"
              >
                <X size={12} strokeWidth={2.5} />
              </button>
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-white/15">
                <Megaphone size={20} className="text-white" strokeWidth={1.8} />
              </div>
              <h2 className="text-lg font-extrabold text-white sm:text-xl">
                ¿Tienes algo que vender?
              </h2>
              <p className="mt-1 max-w-md text-sm text-white/85">
                Publica tu anuncio en menos de 2 minutos. Es gratis y llega a
                miles de compradores.
              </p>
              <Link
                href="/post"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-primary shadow-soft transition hover:bg-white/90"
              >
                <Plus size={14} strokeWidth={2.5} />
                Publicar mi anuncio
              </Link>
            </div>
          </section>
        )}

        {/* Feed sections + trust bar after the first product row */}
        {hasSections && (
          <>
            {feedSections.map((section, idx) => (
              <div key={section.id}>
                <TrackedSection section={section} trackEvent={trackEvent} />
                {idx === firstProductIdx && firstProductIdx !== -1 && (
                  <>
                  {/* v2 Fase 12 — 320×50 en mobile (<sm), 728×90 en ≥sm (tablet+desktop) */}
                  <AdSenseSlot
                    slot=""
                    width={728}
                    height={90}
                    mobileWidth={320}
                    mobileHeight={50}
                    className="mx-auto mt-5"
                  />
                    <section className="px-4 pt-6 sm:px-6">
                      <div className="grid grid-cols-3 gap-3">
                        <TrustCell
                          icon={<Shield size={16} strokeWidth={1.8} />}
                          label="100% gratis"
                          sub="Sin comisiones"
                        />
                        <TrustCell
                          icon={<Users size={16} strokeWidth={1.8} />}
                          label="Compradores"
                          sub="En todo GE"
                        />
                        <TrustCell
                          icon={<Clock size={16} strokeWidth={1.8} />}
                          label="2 minutos"
                          sub="Para publicar"
                        />
                      </div>
                    </section>
                  </>
                  
                )}
              </div>
            ))}
          </>
        )}

        {!hasSections && sectionsLoading && (
          <div className="space-y-8 px-4 pt-10 sm:px-6">
            <Skeleton className="h-6 w-40 rounded" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TrustCell({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-surface-container px-2 py-3 text-center">
      <span className="mb-1.5 grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
        {icon}
      </span>
      <p className="text-xs font-bold text-on-surface">{label}</p>
      <p className="mt-0.5 text-[11px] text-muted">{sub}</p>
    </div>
  );
}
