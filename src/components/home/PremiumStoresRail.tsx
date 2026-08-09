"use client";

import { useQuery } from "@apollo/client/react";
import { Crown } from "lucide-react";
import { HOME_CAROUSEL_PREMIUM } from "@/graphql/queries";
import type { Product } from "@/lib/types";
import ProductRail from "@/components/ProductRail";
import SectionHeader from "@/components/SectionHeader";

/**
 * v2 Fase 6b.2 — home carousel "Tiendas Premium".
 *
 * Consumes `homeCarouselPremium` (populated daily by `PremiumCarouselCron`).
 * The backend already interleaves round-robin by vendor, so consecutive tiles
 * come from different sellers. Nothing renders if the query returns [] —
 * silence is better than an empty section on days with no active Premium
 * sellers.
 */
export default function PremiumStoresRail({ take = 30 }: { take?: number }) {
  const { data } = useQuery(HOME_CAROUSEL_PREMIUM, {
    variables: { take },
    fetchPolicy: "cache-and-network",
  }) as { data: any };

  const products: Product[] = data?.homeCarouselPremium ?? [];
  if (products.length === 0) return null;

  return (
    <section className="pt-10">
      <SectionHeader
        title={
          <span className="inline-flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-purple-600">
              <Crown size={12} className="text-white" strokeWidth={2.5} />
            </span>
            Tiendas Premium
          </span>
        }
        subtitle="Vendedores verificados con las mejores ofertas del día"
      />
      <ProductRail products={products} />
    </section>
  );
}
