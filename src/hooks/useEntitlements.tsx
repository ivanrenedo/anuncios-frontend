"use client";

import { useQuery } from "@apollo/client/react";
import { MY_ENTITLEMENTS, PLAN_PROMO } from "@/graphql/queries";
import { useAuth } from "./useAuth";

export interface Entitlements {
  /** Plan realmente pagado — el que muestran las insignias. */
  plan: string;
  /** Plan cuyas funciones están vigentes (promo ya aplicada). */
  entitlementPlan: string;
  promoActive: boolean;
  promoEndsAt: string | null;
  maxActiveProducts: number;
  maxImagesPerProduct: number;
  pinnedProducts: number;
  autoBumpSlots: number;
  autoBumpCadence: string | null;
  includedBoostsPerMonth: number;
  extraBoostDiscountPct: number;
  hasStats: boolean;
  freeBoosts: boolean;
}

/** Límites del plan Gratis: lo que asumimos mientras la consulta no responde. */
const FALLBACK: Entitlements = {
  plan: "FREE",
  entitlementPlan: "FREE",
  promoActive: false,
  promoEndsAt: null,
  maxActiveProducts: 5,
  maxImagesPerProduct: 4,
  pinnedProducts: 0,
  autoBumpSlots: 0,
  autoBumpCadence: null,
  includedBoostsPerMonth: 0,
  extraBoostDiscountPct: 0,
  hasStats: false,
  freeBoosts: false,
};

/**
 * Qué puede hacer el usuario ahora mismo. Es la fuente para habilitar
 * funciones — no compares planes a mano: durante la promoción un vendedor
 * Gratis tiene funciones de Premium sin que su plan cambie.
 *
 * `canPin` / `canAutoBump` / `hasStats` salen del servidor, así que la UI y
 * lo que el backend permite nunca se contradicen.
 */
export function useEntitlements() {
  const { isAuthenticated } = useAuth();

  const { data, loading, refetch } = useQuery(MY_ENTITLEMENTS, {
    skip: !isAuthenticated,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => Promise<any> };

  const entitlements: Entitlements = data?.myEntitlements ?? FALLBACK;

  return {
    entitlements,
    loading,
    refetch,
    canPin: entitlements.pinnedProducts > 0,
    canAutoBump: entitlements.autoBumpSlots > 0,
    hasStats: entitlements.hasStats,
    promoActive: entitlements.promoActive,
  };
}

export interface PublicPromo {
  active: boolean;
  endsAt: string | null;
  grantedPlan: string | null;
  bannerText: string | null;
  unlockLimits: boolean;
  unlockPinned: boolean;
  unlockAutoBump: boolean;
  unlockStats: boolean;
  freeBoosts: boolean;
}

/**
 * Estado público de la promoción, también para visitantes sin sesión: lo usa
 * el aviso de "todo gratis" en la página de planes.
 */
export function usePlanPromo() {
  const { data, loading } = useQuery(PLAN_PROMO, {
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean };

  const promo: PublicPromo | null = data?.planPromo ?? null;
  return { promo, active: !!promo?.active, loading };
}
