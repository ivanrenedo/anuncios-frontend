"use client";

import { useQuery } from "@apollo/client/react";
import { CATEGORY_TREE, GET_CATEGORIES } from "@/graphql/queries";
import type { CategoryTreeNode } from "@/lib/types";

export function useCategories() {
  const { data, loading } = useQuery(GET_CATEGORIES) as {
    data: any;
    loading: boolean;
  };
  return { categories: data?.categories ?? [], loading };
}

/** Top-level categories with their nested children (mirrors mobile). */
export function useCategoryTree() {
  const { data, loading, error, refetch } = useQuery<any>(CATEGORY_TREE, {
    fetchPolicy: "cache-and-network",
  });
  const tree: CategoryTreeNode[] = data?.categoryTree ?? [];
  return { tree, loading, error, refetch };
}
