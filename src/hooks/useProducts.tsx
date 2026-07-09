"use client";

import { useQuery } from "@apollo/client/react";
import { GET_PRODUCTS, GET_PRODUCT } from "@/graphql/queries";
import type { Product } from "@/lib/types";

export function useProducts(take = 50, skip = 0) {
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    variables: { take, skip },
  }) as { data: any; loading: boolean; error: unknown; refetch: () => void };

  const products: Product[] = data?.products ?? [];
  return { products, loading, error, refetch };
}

export function useProduct(id: string) {
  const { data, loading, error } = useQuery(GET_PRODUCT, {
    variables: { id },
    skip: !id,
  }) as { data: any; loading: boolean; error: unknown };

  const product: Product | null = data?.product ?? null;
  return { product, loading, error };
}
