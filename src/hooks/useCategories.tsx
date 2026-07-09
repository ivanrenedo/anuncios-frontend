"use client";

import { useQuery } from "@apollo/client/react";
import { GET_CATEGORIES } from "@/graphql/queries";

export function useCategories() {
  const { data, loading } = useQuery(GET_CATEGORIES) as {
    data: any;
    loading: boolean;
  };
  return { categories: data?.categories ?? [], loading };
}
