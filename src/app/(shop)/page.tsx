"use client";

import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import PromoCarousel from "@/components/home/PromoCarousel";
import CategoryRail from "@/components/home/CategoryRail";
import SectionHeader from "@/components/SectionHeader";
import ProductRail from "@/components/ProductRail";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

export default function HomePage() {
  const { products, loading } = useProducts(40);
  const { categories } = useCategories();

  // "Featured" = most viewed; "recent" = newest first.
  const featured: Product[] = [...products]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 10);

  const recent: Product[] = [...products].sort((a, b) =>
    (b.createdAt ?? "").localeCompare(a.createdAt ?? "")
  );

  return (
    <div className="mx-auto max-w-7xl">
      <PromoCarousel />
      {/* Rail shows only top-level categories; subcategories live under them. */}
      <CategoryRail categories={categories.filter((c: any) => !c.parentId)} />

      <section className="pt-8">
        <SectionHeader title="Destacados" href="/explore" />
        <ProductRail products={featured} loading={loading} />
      </section>

      <section className="pt-8">
        <SectionHeader title="Recién publicado" href="/explore" />
        <ProductGrid products={recent} loading={loading} />
      </section>

      <div className="h-10" />
    </div>
  );
}
