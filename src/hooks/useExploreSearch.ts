import { useEffect, useMemo, useState } from "react";
import { useQuery, useLazyQuery } from "@apollo/client/react";
import { SEARCH_PRODUCTS } from "@/graphql/queries";
import { toExploreItem, type SortOrder } from "@/lib/exploreUtils";
import { useDebouncedValue } from "./useDebouncedValue";

export const EXPLORE_PAGE_SIZE = 8;

export interface ExploreSearchInput {
  /** Raw text — debounced 500ms internally before it becomes a query variable. */
  query: string;
  categoryId: string | undefined;
  /** Raw text — debounced 500ms internally. */
  city: string;
  /** Raw text — debounced 500ms internally. */
  priceMin: string;
  /** Raw text — debounced 500ms internally. */
  priceMax: string;
  /** Only sent when exactly one condition is selected. Multi-select is applied
   *  as a post-filter over the returned rows in the caller. */
  singleCondition: string | undefined;
  sortOrder: SortOrder;
}

export interface ExploreSearchResult {
  /** Raw Apollo data — kept exposed so the caller can distinguish "no search
   *  fired yet" (undefined) from "search returned zero rows" (empty array). */
  searchData: any;
  productsLoading: boolean;
  refetchProducts: () => Promise<any>;
  /** Debounced query text — exposed so results-header UI matches the request
   *  that actually returned the current results, not what the user is typing. */
  debouncedQuery: string;
  /** First page + all pages loaded via "Cargar más", mapped to Explore items. */
  searchResults: any[];
  loadMore: () => Promise<void>;
  loadingMore: boolean;
  hasMore: boolean;
}

/**
 * Owns the SEARCH_PRODUCTS pipeline for the Explore screen:
 *  - Debounces the four text-driven filters (query, city, priceMin, priceMax).
 *  - Runs the primary useQuery with cache-and-network / cache-first, so
 *    returning to Explore paints from cache while a background refresh runs.
 *  - Runs an independent useLazyQuery with network-only for "Cargar más" so
 *    pagination always fetches fresh rows.
 *  - Resets extra pages whenever the base query changes.
 *
 * Post-filters that the backend doesn't support (sellerType, withPriceOnly,
 * multi-condition, brandModelQuery, az/za sort) live in the caller so they
 * can be applied over either `searchResults` or the section-scoped list.
 */
export function useExploreSearch(input: ExploreSearchInput): ExploreSearchResult {
  const debouncedQuery = useDebouncedValue(input.query, 500);
  const debouncedCity = useDebouncedValue(input.city, 500);
  const debouncedPriceMin = useDebouncedValue(input.priceMin, 500);
  const debouncedPriceMax = useDebouncedValue(input.priceMax, 500);

  const searchInput = useMemo(
    () => ({
      query: debouncedQuery.trim() || undefined,
      categoryId: input.categoryId,
      city: debouncedCity.trim() || undefined,
      condition: input.singleCondition,
      priceMin: debouncedPriceMin ? parseInt(debouncedPriceMin, 10) : undefined,
      priceMax: debouncedPriceMax ? parseInt(debouncedPriceMax, 10) : undefined,
      sortBy:
        input.sortOrder === "price_asc" || input.sortOrder === "price_desc"
          ? input.sortOrder
          : "recent",
      take: EXPLORE_PAGE_SIZE,
      skip: 0,
    }),
    [
      debouncedQuery,
      input.categoryId,
      debouncedCity,
      input.singleCondition,
      debouncedPriceMin,
      debouncedPriceMax,
      input.sortOrder,
    ],
  );

  const { data: searchData, loading: productsLoading, refetch: refetchProducts } =
    useQuery<any>(SEARCH_PRODUCTS, {
      variables: { input: searchInput },
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    });

  const [fetchMore] = useLazyQuery<any>(SEARCH_PRODUCTS, {
    fetchPolicy: "network-only",
  });

  const firstPage = useMemo(
    () => (searchData?.searchProducts ?? []).map(toExploreItem),
    [searchData],
  );

  const [extraPages, setExtraPages] = useState<any[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Reset pagination whenever the base search returns a new payload.
  useEffect(() => {
    setExtraPages([]);
    setHasMore(firstPage.length >= EXPLORE_PAGE_SIZE);
    setLoadingMore(false);
  }, [searchData, firstPage.length]);

  const searchResults = useMemo(
    () => [...firstPage, ...extraPages],
    [firstPage, extraPages],
  );

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data } = await fetchMore({
        variables: { input: { ...searchInput, skip: searchResults.length } },
      });
      const next = (data?.searchProducts ?? []).map(toExploreItem);
      setExtraPages((prev) => [...prev, ...next]);
      setHasMore(next.length >= EXPLORE_PAGE_SIZE);
    } catch {}
    setLoadingMore(false);
  };

  return {
    searchData,
    productsLoading,
    refetchProducts,
    debouncedQuery,
    searchResults,
    loadMore,
    loadingMore,
    hasMore,
  };
}
