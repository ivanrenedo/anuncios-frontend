"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLazyQuery, useQuery } from "@apollo/client/react";
import {
  Bell,
  BookmarkPlus,
  ChevronDown,
  Loader2,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  GET_FILTERABLE_SECTIONS,
  GET_SECTION_PRODUCTS,
  SEARCH_PRODUCTS,
} from "@/graphql/queries";
import { useCategoryTree } from "@/hooks/useCategories";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useAuth } from "@/hooks/useAuth";
import { useRefetchOnFocus } from "@/hooks/useRefetchOnFocus";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import ProductGrid from "@/components/ProductGrid";
import FilterDrawer from "@/components/explore/FilterDrawer";
import CategoryPickerModal from "@/components/explore/CategoryPickerModal";
import { CATEGORY_FILTERS, SORT_LABELS, type SortOrder } from "@/lib/exploreUtils";
import type { Product } from "@/lib/types";
import AdSenseSlot from "@/components/AdSenseSlot";

const PAGE_SIZE = 20;
const ENTRY_FILTER_PARAMS = ["filterCat", "cat", "sectionId", "q"] as const;
// Referencia estable para el `onClose` del sidebar (nunca se cierra
// programáticamente). Definirla en el módulo evita crear una función nueva
// en cada render, que dispararía el useEffect de FilterDrawer sin motivo.
const noop = () => {};

function ExploreInner() {
  const params = useSearchParams();
  const router = useRouter();
  const currentSearch = params.toString();

  const entryParamsRef = useRef({
    q: params.get("q") ?? "",
    filterCat: params.get("filterCat") ?? "",
    catSlug: params.get("cat") ?? "",
    sectionId: params.get("sectionId"),
  });
  const initialEntryParams = entryParamsRef.current;

  // ── State ────────────────────────────────────────────────────────────
  const [query, setQuery] = useState(initialEntryParams.q);
  const [activeCategory, setActiveCategory] = useState<string>(
    initialEntryParams.filterCat || "Todos",
  );
  const [related, setRelated] = useState<string[]>([]);
  const [pendingCatSlug, setPendingCatSlug] = useState(
    initialEntryParams.catSlug,
  );

  // Filter drawer state (mirrors mobile explore).
  const [cityFilter, setCityFilter] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [withPriceOnly, setWithPriceOnly] = useState(false);
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [sellerType, setSellerType] = useState<
    "particulares" | "profesionales" | null
  >(null);
  const [brand, setBrand] = useState<string | null>(null);
  const [brandModelQuery, setBrandModelQuery] = useState("");
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [activeTransmissions, setActiveTransmissions] = useState<string[]>([]);
  const [operation, setOperation] = useState<string | null>(null);
  const [filterBedrooms, setFilterBedrooms] = useState(0);
  const [filterBathrooms, setFilterBathrooms] = useState(0);
  const [surfaceMin, setSurfaceMin] = useState("");
  const [filterOfferType, setFilterOfferType] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>(null);

  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    initialEntryParams.sectionId,
  );

  // UI toggles.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);

  const { isAuthenticated } = useAuth();
  const { tree, refetch: refetchTree } = useCategoryTree();

  const {
    searches: savedSearches,
    saveSearch,
    deleteSearch,
  } = useSavedSearches();
  const [savingSearch, setSavingSearch] = useState(false);

  // Resolve activeCategory label → id (matches mobile logic; the label may
  // point at a top-level or a nested child).
  const activeCategoryId = useMemo(() => {
    if (activeCategory === "Todos") return undefined;
    const lower = activeCategory.toLowerCase();
    const root = tree.find((t: any) => t.label.toLowerCase() === lower);
    if (root) return root.id;
    const child = tree
      .flatMap((t: any) => t.children ?? [])
      .find((c: any) => c.label.toLowerCase() === lower);
    return child?.id;
  }, [activeCategory, tree]);

  // Debounced text-driven filters so we don't fire a query on every keystroke.
  const debouncedQuery = useDebouncedValue(query, 400);
  const debouncedCity = useDebouncedValue(cityFilter, 400);
  const debouncedPriceMin = useDebouncedValue(priceMin, 400);
  const debouncedPriceMax = useDebouncedValue(priceMax, 400);

  // ── Sections (from ?sectionId, populated with GET_SECTION_PRODUCTS) ──
  const { data: sectionsData, refetch: refetchSections } = useQuery(
    GET_FILTERABLE_SECTIONS,
    {
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    },
  ) as { data: any; refetch: () => Promise<any> };

  const filterableSections: { id: string; title: string }[] = useMemo(
    () => sectionsData?.filterableSections ?? [],
    [sectionsData],
  );

  const { data: sectionProductsData, loading: sectionProductsLoading } =
    useQuery(GET_SECTION_PRODUCTS, {
      variables: { sectionId: activeSectionId!, take: 50 },
      skip: !activeSectionId,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
    }) as { data: any; loading: boolean };

  // ── Search input (server-supported filters only) ─────────────────────
  const searchInput = useMemo(() => {
    const input: Record<string, unknown> = {
      take: PAGE_SIZE,
      skip: 0,
    };
    if (debouncedQuery.trim()) input.query = debouncedQuery.trim();
    if (activeCategoryId) input.categoryId = activeCategoryId;
    if (debouncedCity.trim()) input.city = debouncedCity.trim();
    if (debouncedPriceMin) input.priceMin = Number(debouncedPriceMin);
    if (debouncedPriceMax) input.priceMax = Number(debouncedPriceMax);
    if (activeConditions.length === 1) input.condition = activeConditions[0];
    if (sortOrder === "price_asc" || sortOrder === "price_desc")
      input.sortBy = sortOrder;
    return input;
  }, [
    debouncedQuery,
    activeCategoryId,
    debouncedCity,
    debouncedPriceMin,
    debouncedPriceMax,
    activeConditions,
    sortOrder,
  ]);

  const {
    data: searchData,
    loading: searchLoading,
    refetch: refetchSearch,
  } = useQuery(SEARCH_PRODUCTS, {
    variables: { input: searchInput },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    skip: !!activeSectionId,
  }) as { data: any; loading: boolean; refetch: () => Promise<any> };

  // Extra pages via load-more (network-only so pagination fetches fresh).
  const [fetchMore] = useLazyQuery(SEARCH_PRODUCTS, {
    fetchPolicy: "network-only",
  });
  const [extraPages, setExtraPages] = useState<Product[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Reset pagination whenever the base search response changes shape.
  // Ojo: usamos actualizaciones funcionales / `Object.is`-friendly para no
  // programar re-renders innecesarios cuando `firstPage` cambia de
  // referencia pero el contenido efectivo es el mismo — de otra forma este
  // efecto se convertía en un bucle infinito ("Maximum update depth
  // exceeded") en cuanto Apollo emitía datos con `cache-and-network`.
  const firstPage: Product[] = useMemo(
    () => searchData?.searchProducts ?? [],
    [searchData],
  );
  useEffect(() => {
    setExtraPages((prev) => (prev.length === 0 ? prev : []));
    setHasMore(firstPage.length >= PAGE_SIZE);
    setLoadingMore(false);
  }, [firstPage]);

  const searchResults: Product[] = useMemo(
    () => [...firstPage, ...extraPages],
    [firstPage, extraPages],
  );

  // Memoized para tener referencia estable — sin esto el `useMemo` de
  // `visibleProducts` recomputaba en cada render y disparaba la cadena de
  // re-renders (raíz del "Maximum update depth" que aparecía en explore).
  const sectionProducts: Product[] | null = useMemo(
    () =>
      activeSectionId
        ? (sectionProductsData?.sectionProducts as Product[] | undefined) ?? []
        : null,
    [activeSectionId, sectionProductsData],
  );

  const productsLoading = activeSectionId ? sectionProductsLoading : searchLoading;

  // Refetch on tab focus (matches mobile).
  useRefetchOnFocus([refetchSearch, refetchSections, refetchTree]);

  // ── Post-filters (backend can't express these yet) ───────────────────
  // Cuando estamos filtrando por sección (?sectionId=...) tenemos que
  // arrancar del listado que devuelve `GET_SECTION_PRODUCTS`, no de la
  // búsqueda genérica. Antes se ignoraba `sectionProducts` y la vista
  // quedaba vacía porque el input de búsqueda no coincidía con ninguna
  // sección concreta.
  const visibleProducts: Product[] = useMemo(() => {
    let list: Product[] = sectionProducts ?? searchResults;

    if (sellerType === "profesionales")
      list = list.filter((p) => p.seller?.verified);
    else if (sellerType === "particulares")
      list = list.filter((p) => !p.seller?.verified);

    if (withPriceOnly) list = list.filter((p) => Number(p.price) > 0);

    if (activeConditions.length > 1)
      list = list.filter((p) => activeConditions.includes(p.condition ?? ""));

    if (brandModelQuery.trim()) {
      const q = brandModelQuery.trim().toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(q));
    }

    if (activeEngines.length > 0)
      list = list.filter((p) =>
        activeEngines.includes(p.vehicleDetail?.engine ?? ""),
      );
    if (activeTransmissions.length > 0)
      list = list.filter((p) =>
        activeTransmissions.includes(p.vehicleDetail?.transmission ?? ""),
      );
    if (operation)
      list = list.filter(
        (p) =>
          p.propertyDetail?.operation === operation ||
          p.vehicleDetail?.operation === operation,
      );
    if (filterOfferType)
      list = list.filter((p) => p.serviceDetail?.offerType === filterOfferType);
    if (filterBedrooms > 0)
      list = list.filter(
        (p) => (p.propertyDetail?.bedrooms ?? 0) >= filterBedrooms,
      );
    if (filterBathrooms > 0)
      list = list.filter(
        (p) => (p.propertyDetail?.bathrooms ?? 0) >= filterBathrooms,
      );
    if (surfaceMin) {
      const min = Number(surfaceMin);
      list = list.filter((p) => (p.propertyDetail?.surface ?? 0) >= min);
    }
    if (brand) {
      const b = brand.toLowerCase();
      list = list.filter((p) => p.title.toLowerCase().includes(b));
    }

    if (sortOrder === "az")
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    else if (sortOrder === "za")
      list = [...list].sort((a, b) => b.title.localeCompare(a.title));

    return list;
  }, [
    sectionProducts,
    searchResults,
    sellerType,
    withPriceOnly,
    activeConditions,
    brandModelQuery,
    activeEngines,
    activeTransmissions,
    operation,
    filterOfferType,
    filterBedrooms,
    filterBathrooms,
    surfaceMin,
    brand,
    sortOrder,
  ]);

  // ── Category-driven derivations ──────────────────────────────────────
  const catFilter =
    CATEGORY_FILTERS[activeCategory.toLowerCase()] ?? CATEGORY_FILTERS.todos;

  // Consume entry query params once and clear them from the URL so a refresh
  // does not resurrect stale Explore filters.
  useEffect(() => {
    const urlParams = new URLSearchParams(currentSearch);
    const nextQ = urlParams.get("q");
    const nextFilterCat = urlParams.get("filterCat");
    const nextCatSlug = urlParams.get("cat");
    const nextSectionId = urlParams.get("sectionId");
    const hasEntryParams = ENTRY_FILTER_PARAMS.some((key) =>
      urlParams.has(key),
    );

    if (nextQ !== null) setQuery(nextQ);
    if (nextFilterCat) {
      setActiveCategory(nextFilterCat);
      setBrand(null);
      setActiveConditions([]);
    }
    if (nextCatSlug) setPendingCatSlug(nextCatSlug);
    if (nextSectionId !== null) setActiveSectionId(nextSectionId || null);

    if (!hasEntryParams || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    ENTRY_FILTER_PARAMS.forEach((key) => url.searchParams.delete(key));
    router.replace(url.pathname + url.search, { scroll: false });
  }, [currentSearch, router]);

  // Resolve ?cat= (slug) after the category tree has loaded.
  useEffect(() => {
    if (!pendingCatSlug || tree.length === 0) return;
    const root = tree.find((t: any) => t.slug === pendingCatSlug);
    const target = root
      ? root.label
      : tree
          .flatMap((t: any) => t.children ?? [])
          .find((c: any) => c.slug === pendingCatSlug)?.label;
    if (!target) {
      setPendingCatSlug("");
      return;
    }
    setActiveCategory((prev) => (prev === target ? prev : target));
    setPendingCatSlug("");
  }, [pendingCatSlug, tree]);

  // Populate related-terms suggestions from the current query.
  // Ojo: `setRelated` sólo se llama si el contenido cambió — de otra forma
  // Apollo re-emitiendo `tree` (nueva ref, mismo contenido) forzaría un
  // nuevo array `rel` en cada tick, generando re-renders en cadena.
  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    if (!trimmed) {
      setRelated((prev) => (prev.length === 0 ? prev : []));
      return;
    }
    const lower = trimmed.toLowerCase();
    let rel: string[] = [];
    for (const parent of tree) {
      if (parent.label.toLowerCase() === lower) {
        rel = (parent.children ?? []).map((c: any) => c.label);
        break;
      }
      const child = (parent.children ?? []).find(
        (c: any) => c.label.toLowerCase() === lower,
      );
      if (child) {
        rel = (child.children ?? []).length
          ? child.children!.map((c: any) => c.label)
          : (parent.children ?? [])
              .map((c: any) => c.label)
              .filter((l: string) => l.toLowerCase() !== lower);
        break;
      }
    }
    setRelated((prev) =>
      prev.length === rel.length && prev.every((v, i) => v === rel[i])
        ? prev
        : rel,
    );
  }, [debouncedQuery, tree]);

  const exitSectionMode = useCallback(() => {
    setActiveSectionId((prev) => (prev ? null : prev));
  }, []);

  const updateQuery = useCallback(
    (value: string) => {
      exitSectionMode();
      setQuery(value);
    },
    [exitSectionMode],
  );

  const updateCityFilter = useCallback(
    (value: string) => {
      exitSectionMode();
      setCityFilter(value);
    },
    [exitSectionMode],
  );

  const updatePriceMin = useCallback(
    (value: string) => {
      exitSectionMode();
      setPriceMin(value);
    },
    [exitSectionMode],
  );

  const updatePriceMax = useCallback(
    (value: string) => {
      exitSectionMode();
      setPriceMax(value);
    },
    [exitSectionMode],
  );

  const updateActiveCategory = useCallback(
    (value: string) => {
      exitSectionMode();
      setActiveCategory(value);
    },
    [exitSectionMode],
  );

  const updateWithPriceOnly = useCallback(
    (value: boolean) => {
      exitSectionMode();
      setWithPriceOnly(value);
    },
    [exitSectionMode],
  );

  const updateOperation = useCallback(
    (value: string | null) => {
      exitSectionMode();
      setOperation(value);
    },
    [exitSectionMode],
  );

  const updateBrandModelQuery = useCallback(
    (value: string) => {
      exitSectionMode();
      setBrandModelQuery(value);
    },
    [exitSectionMode],
  );

  const updateActiveConditions = useCallback(
    (value: Parameters<typeof setActiveConditions>[0]) => {
      exitSectionMode();
      setActiveConditions(value);
    },
    [exitSectionMode],
  );

  const updateActiveEngines = useCallback(
    (value: Parameters<typeof setActiveEngines>[0]) => {
      exitSectionMode();
      setActiveEngines(value);
    },
    [exitSectionMode],
  );

  const updateActiveTransmissions = useCallback(
    (value: Parameters<typeof setActiveTransmissions>[0]) => {
      exitSectionMode();
      setActiveTransmissions(value);
    },
    [exitSectionMode],
  );

  const updateFilterOfferType = useCallback(
    (value: string | null) => {
      exitSectionMode();
      setFilterOfferType(value);
    },
    [exitSectionMode],
  );

  const updateFilterBedrooms = useCallback(
    (value: Parameters<typeof setFilterBedrooms>[0]) => {
      exitSectionMode();
      setFilterBedrooms(value);
    },
    [exitSectionMode],
  );

  const updateFilterBathrooms = useCallback(
    (value: Parameters<typeof setFilterBathrooms>[0]) => {
      exitSectionMode();
      setFilterBathrooms(value);
    },
    [exitSectionMode],
  );

  const updateSurfaceMin = useCallback(
    (value: string) => {
      exitSectionMode();
      setSurfaceMin(value);
    },
    [exitSectionMode],
  );

  const updateBrand = useCallback(
    (value: string | null) => {
      exitSectionMode();
      setBrand(value);
    },
    [exitSectionMode],
  );

  const updateSellerType = useCallback(
    (value: "particulares" | "profesionales" | null) => {
      exitSectionMode();
      setSellerType(value);
    },
    [exitSectionMode],
  );

  // ── Actions ──────────────────────────────────────────────────────────
  const clearSearch = () => {
    exitSectionMode();
    setQuery("");
    setRelated([]);
  };

  const clearFilters = () => {
    setQuery("");
    setRelated([]);
    setActiveCategory("Todos");
    setActiveConditions([]);
    setCityFilter("");
    setSellerType(null);
    setPriceMin("");
    setPriceMax("");
    setBrand(null);
    setBrandModelQuery("");
    setWithPriceOnly(false);
    setActiveSectionId(null);
    setSortOrder(null);
    setActiveEngines([]);
    setActiveTransmissions([]);
    setOperation(null);
    setFilterBedrooms(0);
    setFilterBathrooms(0);
    setSurfaceMin("");
    setFilterOfferType(null);
  };
  
  const loadMore = async () => {
    if (loadingMore || !hasMore || activeSectionId) return;
    setLoadingMore(true);
    try {
      const { data } = await fetchMore({
        variables: {
          input: { ...searchInput, skip: searchResults.length },
        },
      });
      const next: Product[] = (data as any)?.searchProducts ?? [];
      setExtraPages((prev) => [...prev, ...next]);
      setHasMore(next.length >= PAGE_SIZE);
    } catch {}
    setLoadingMore(false);
  };

  // ── Saved searches ───────────────────────────────────────────────────
  const hasSearchCriteria = !!(
    query.trim() ||
    activeCategoryId ||
    cityFilter.trim() ||
    priceMin ||
    priceMax
  );

  const findCategory = (id: string) =>
    tree.find((t: any) => t.id === id) ??
    tree.flatMap((t: any) => t.children ?? []).find((c: any) => c.id === id);

  const savedSearchLabel = (s: any) => {
    const parts: string[] = [];
    if (s.query) parts.push(s.query);
    if (s.categoryId) {
      const cat = findCategory(s.categoryId);
      if (cat) parts.push(cat.label);
    }
    if (s.city) parts.push(s.city);
    return parts.join(" · ") || "Alerta";
  };

  const onSaveSearch = async () => {
    if (!isAuthenticated || savingSearch) return;
    setSavingSearch(true);
    try {
      await saveSearch({
        query: query.trim() || null,
        categoryId: activeCategoryId ?? null,
        city: cityFilter.trim() || null,
        priceMin: priceMin ? Number(priceMin) : null,
        priceMax: priceMax ? Number(priceMax) : null,
      });
    } catch {}
    setSavingSearch(false);
  };

  const applySavedSearch = useCallback(
    (s: any) => {
      exitSectionMode();
      setQuery(s.query ?? "");
      setCityFilter(s.city ?? "");
      setPriceMin(s.priceMin != null ? String(Math.trunc(s.priceMin)) : "");
      setPriceMax(s.priceMax != null ? String(Math.trunc(s.priceMax)) : "");
      setActiveCategory(
        s.categoryId ? findCategory(s.categoryId)?.label ?? "Todos" : "Todos",
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tree, exitSectionMode],
  );

  // Count of active filters for the drawer badge.
  const filterCount =
    (activeCategory !== "Todos" ? 1 : 0) +
    (cityFilter.trim() ? 1 : 0) +
    (priceMin !== "" || priceMax !== "" ? 1 : 0) +
    (activeConditions.length > 0 ? 1 : 0) +
    (sellerType !== null ? 1 : 0) +
    (brand !== null ? 1 : 0) +
    (brandModelQuery.trim() ? 1 : 0) +
    (withPriceOnly ? 1 : 0) +
    (activeEngines.length > 0 ? 1 : 0) +
    (activeTransmissions.length > 0 ? 1 : 0) +
    (operation !== null ? 1 : 0) +
    (filterBedrooms > 0 ? 1 : 0) +
    (filterBathrooms > 0 ? 1 : 0) +
    (surfaceMin !== "" ? 1 : 0) +
    (filterOfferType !== null ? 1 : 0);

  const categoryPills = ["Todos", ...tree.map((t: any) => t.label)];

  // Props reutilizables entre el drawer móvil y el sidebar desktop.
  const filterProps = {
    activeCategory,
    catFilter,
    onOpenCategoryPicker: () => setCategoryPickerOpen(true),
    query,
    setQuery: updateQuery,
    clearSearch,
    cityFilter,
    setCityFilter: updateCityFilter,
    priceMin,
    setPriceMin: updatePriceMin,
    priceMax,
    setPriceMax: updatePriceMax,
    withPriceOnly,
    setWithPriceOnly: updateWithPriceOnly,
    operation,
    setOperation: updateOperation,
    brandModelQuery,
    setBrandModelQuery: updateBrandModelQuery,
    activeConditions,
    setActiveConditions: updateActiveConditions,
    activeEngines,
    setActiveEngines: updateActiveEngines,
    activeTransmissions,
    setActiveTransmissions: updateActiveTransmissions,
    filterOfferType,
    setFilterOfferType: updateFilterOfferType,
    filterBedrooms,
    setFilterBedrooms: updateFilterBedrooms,
    filterBathrooms,
    setFilterBathrooms: updateFilterBathrooms,
    surfaceMin,
    setSurfaceMin: updateSurfaceMin,
    brand,
    setBrand: updateBrand,
    sellerType,
    setSellerType: updateSellerType,
    resultCount: visibleProducts.length,
    productsLoading,
    clearFilters,
    filterCount,
  } as const;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 group explore">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
          Explorar anuncios
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Busca y filtra entre todos los anuncios publicados
        </p>
      </div>

      {/* Layout: sidebar de filtros a la izquierda en lg+, contenido a la
          derecha. En móvil / tablet se apila y los filtros se abren desde
          el botón "Filtros" en el drawer (comportamiento anterior). */}
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        {/* Sticky sidebar — sólo lg+ */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <FilterDrawer
              variant="sidebar"
              open
              onClose={noop}
              {...filterProps}
            />
          </div>
        </aside>

        <div className="min-w-0">
      {/* Search + filter button (sólo el botón se oculta en lg+) */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex flex-col w-full">
          <AdSenseSlot slot="" width={728} height={90} className="mx-auto mb-5"  />
          <div className="flex row gap-2">
            <div className="relative flex-1">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                value={query}
                onChange={(e) => updateQuery(e.target.value)}
                placeholder="Buscar en Bomelh"
                className="h-11 w-full rounded-full border border-outline-variant/40 bg-surface-lowest pl-9 pr-9 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-on-surface"
                >
                  <X size={14} />
                </button>
              )}
            </div>
             <button
              onClick={() => setDrawerOpen(true)}
              className={`relative grid h-11 w-11 place-items-center rounded-full border transition lg:hidden ${
                filterCount > 0
                  ? "border-primary bg-primary text-white"
                  : "border-outline-variant/40 bg-surface-lowest text-primary hover:bg-surface-container"
              }`}
              aria-label="Filtros"
            >
              <SlidersHorizontal size={18} />
              {filterCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full border-2 border-surface-lowest bg-danger px-1 text-[10px] font-bold text-white">
                  {filterCount}
                </span>
              )}
            </button>
          </div>
          
        </div>
        
      </div>

      {/* Section + sort selectors */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <button
            onClick={() => setSectionMenuOpen((o) => !o)}
            className="flex h-9 w-full items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 text-sm font-semibold text-primary hover:bg-surface-container"
          >
            <span className="truncate">
              {activeSectionId
                ? filterableSections.find((s) => s.id === activeSectionId)
                    ?.title ?? "Filtro"
                : "Filtros"}
            </span>
            <ChevronDown size={16} />
          </button>
          {sectionMenuOpen && (
            <div className="absolute left-0 right-0 top-11 z-30 max-h-64 overflow-y-auto rounded-lg border border-outline-variant/40 bg-surface-lowest shadow-card">
              <button
                onClick={() => {
                  setActiveSectionId(null);
                  setSectionMenuOpen(false);
                }}
                className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
              >
                Todos
              </button>
              {filterableSections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setActiveSectionId(s.id);
                    setSectionMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
                >
                  {s.title}
                </button>
              ))}
              {filterableSections.length === 0 && (
                <p className="px-3 py-3 text-xs text-muted">
                  No hay secciones filtrables aún.
                </p>
              )}
            </div>
          )}
        </div>
        {activeSectionId && (
          <button
            onClick={() => setActiveSectionId(null)}
            className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Quitar filtro de sección"
          >
            <X size={14} />
          </button>
        )}

        <div className="relative flex-1">
          <button
            onClick={() => setSortMenuOpen((o) => !o)}
            className="flex h-9 w-full items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 text-sm font-semibold text-primary hover:bg-surface-container"
          >
            <span className="truncate">
              {sortOrder ? SORT_LABELS[sortOrder] : "Ordenar"}
            </span>
            <ChevronDown size={16} />
          </button>
          {sortMenuOpen && (
            <div className="absolute left-0 right-0 top-11 z-30 rounded-lg border border-outline-variant/40 bg-surface-lowest shadow-card">
              {(
                [
                  ["price_asc", "Menor precio"],
                  ["price_desc", "Mayor precio"],
                  ["az", "A - Z"],
                  ["za", "Z - A"],
                ] as [SortOrder, string][]
              ).map(([v, l]) => (
                <button
                  key={v!}
                  onClick={() => {
                    setSortOrder(v);
                    setSortMenuOpen(false);
                  }}
                  className="block w-full px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
                >
                  {l}
                </button>
              ))}
            </div>
          )}
        </div>
        {sortOrder && (
          <button
            onClick={() => setSortOrder(null)}
            className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
            aria-label="Quitar orden"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="mb-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {categoryPills.map((cat) => (
          <button
            key={cat}
            onClick={() => updateActiveCategory(cat)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition ${
              activeCategory === cat
                ? "border-primary bg-primary text-on-primary font-semibold"
                : "border-outline-variant/40 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Saved searches + save-current chip */}
      {isAuthenticated &&
        (hasSearchCriteria || savedSearches.length > 0) && (
          <div className="mb-4 flex flex-wrap gap-2">
            {hasSearchCriteria && (
              <button
                onClick={onSaveSearch}
                disabled={savingSearch}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary shadow-soft disabled:opacity-60"
              >
                {savingSearch ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <BookmarkPlus size={12} />
                )}
                Guardar búsqueda
              </button>
            )}
            {savedSearches.map((s) => (
              <div
                key={s.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs text-primary"
              >
                <button
                  onClick={() => applySavedSearch(s)}
                  className="flex items-center gap-1.5 font-semibold"
                >
                  <Bell size={12} />
                  <span className="max-w-[160px] truncate">
                    {savedSearchLabel(s)}
                  </span>
                </button>
                <button
                  onClick={() => deleteSearch(s.id)}
                  className="text-primary/70 hover:text-primary"
                  aria-label="Eliminar alerta"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

      {/* Related searches (parent → children terms) */}
      {related.length > 0 && (
        <div className="mb-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-primary">
            <Sparkles size={14} /> Búsquedas relacionadas
          </div>
          <div className="flex flex-wrap gap-2">
            {related.map((term) => (
              <button
                key={term}
                onClick={() => updateQuery(term)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
              >
                <Search size={12} /> {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results header */}
      {!productsLoading && visibleProducts.length > 0 && (
        <p className="mb-3 text-sm text-muted">
          {debouncedQuery.trim()
            ? `${visibleProducts.length} resultados para "${debouncedQuery.trim()}"`
            : `${visibleProducts.length} resultados`}
        </p>
      )}

      {/* Grid */}
      {!productsLoading && visibleProducts.length === 0 ? (
        <div className="py-20 text-center">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <Search size={28} />
          </div>
          <p className="text-lg font-bold text-on-surface">
            {debouncedQuery.trim()
              ? `Sin resultados para "${debouncedQuery.trim()}"`
              : "Sin resultados"}
          </p>
          <p className="mt-1 text-sm text-muted">
            {related.length > 0
              ? "Prueba una de las búsquedas relacionadas de arriba."
              : "Prueba con otras palabras o quita algún filtro."}
          </p>
          {filterCount > 0 && (
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
            >
              <X size={14} /> Limpiar filtros
            </button>
          )}
        </div>
      ) : (
        // `paginate={false}` porque el explore ya tiene su propio "Cargar
        // más" server-side (`loadMore` de abajo). Sin este flag, ProductGrid
        // añadiría un segundo botón local que revela sólo la caché ya
        // paginada por el servidor — resultaba en dos botones en la UI.
        <ProductGrid
          products={visibleProducts}
          loading={productsLoading && visibleProducts.length === 0}
          paginate={false}
        />
      )}

      {/* Load more (only for the search pipeline, not sections) */}
      {!productsLoading &&
        visibleProducts.length > 0 &&
        !activeSectionId &&
        hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-lowest px-6 py-2.5 text-sm font-bold text-primary shadow-soft transition hover:bg-surface-container disabled:opacity-60"
            >
              {loadingMore ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>Cargar más</>
              )}
            </button>
          </div>
        )}
        </div>
        {/* /grid results column */}
      </div>
      {/* /explore grid */}

      {/* Drawer para móvil / tablet — en desktop se renderiza el sidebar
          inline arriba y el estado `drawerOpen` queda inactivo. */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        {...filterProps}
      />

      <CategoryPickerModal
        open={categoryPickerOpen}
        onClose={() => setCategoryPickerOpen(false)}
        tree={tree as any}
        active={activeCategory}
        onChange={(label) => {
          updateActiveCategory(label);
          updateBrand(null);
          updateActiveConditions([]);
        }}
      />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="p-10 text-center text-muted">Cargando...</div>
      }
    >
      <ExploreInner />
    </Suspense>
  );
}
