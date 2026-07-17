"use client";

import { useQuery, useMutation } from "@apollo/client/react";
import { MY_SAVED_SEARCHES } from "@/graphql/queries";
import {
  CREATE_SAVED_SEARCH,
  DELETE_SAVED_SEARCH,
} from "@/graphql/mutations";
import type { SavedSearch } from "@/lib/types";

interface SaveSearchInput {
  query?: string | null;
  categoryId?: string | null;
  city?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
}

export function useSavedSearches() {
  const { data, loading, refetch } = useQuery(MY_SAVED_SEARCHES, {
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => void };

  const searches: SavedSearch[] = data?.mySavedSearches ?? [];

  const [createMut] = useMutation(CREATE_SAVED_SEARCH, {
    refetchQueries: [{ query: MY_SAVED_SEARCHES }],
    awaitRefetchQueries: true,
  });

  const [deleteMut] = useMutation(DELETE_SAVED_SEARCH, {
    refetchQueries: [{ query: MY_SAVED_SEARCHES }],
    awaitRefetchQueries: true,
  });

  async function saveSearch(input: SaveSearchInput) {
    await createMut({ variables: { input } });
  }

  async function deleteSearch(id: string) {
    await deleteMut({ variables: { id } });
  }

  return { searches, loading, saveSearch, deleteSearch, refetch };
}
