"use client";

import { useMutation, useQuery } from "@apollo/client/react";
import { TOGGLE_FAVORITE } from "@/graphql/mutations";
import { MY_FAVORITES } from "@/graphql/queries";
import { useAuth } from "./useAuth";
import { useCallback, useMemo } from "react";

/** The current user's favorites (empty when unauthenticated). */
export function useFavorites() {
  const { isAuthenticated } = useAuth();
  const { data, loading, refetch } = useQuery(MY_FAVORITES, {
    skip: !isAuthenticated,
  });
  return { favorites: (data as any)?.myFavorites ?? [], loading, refetch };
}

/** Set of product ids the current user has favorited — the source of truth. */
export function useFavoriteIds(): Set<string> {
  const { favorites } = useFavorites();
  return useMemo(
    () =>
      new Set<string>(
        favorites.map((f: any) => f.product?.id).filter(Boolean)
      ),
    [favorites]
  );
}

/** Returns a toggle function; no-ops (returns false) when unauthenticated. */
export function useToggleFavorite() {
  const { isAuthenticated } = useAuth();
  const [mutate] = useMutation(TOGGLE_FAVORITE, {
    refetchQueries: [{ query: MY_FAVORITES }],
  });

  const toggle = useCallback(
    async (productId: string): Promise<boolean> => {
      if (!isAuthenticated) return false;
      try {
        const { data } = await mutate({ variables: { productId } });
        return (data as any)?.toggleFavorite?.added ?? false;
      } catch {
        return false;
      }
    },
    [isAuthenticated, mutate]
  );

  return { toggle, canFavorite: isAuthenticated };
}
