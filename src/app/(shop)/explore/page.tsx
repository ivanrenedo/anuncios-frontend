"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import {
  Search,
  SlidersHorizontal,
  X,
  Bookmark,
  BookmarkPlus,
  Loader2,
  ChevronDown,
  ChevronUp,
  Trash2,
} from "lucide-react";
import { SEARCH_PRODUCTS } from "@/graphql/queries";
import { useCategories } from "@/hooks/useCategories";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import { useAuth } from "@/hooks/useAuth";
import ProductGrid from "@/components/ProductGrid";
import type { Product } from "@/lib/types";

type SortKey = "recent" | "price_asc" | "price_desc" | "views";
type ConditionKey = "Nuevo" | "Como nuevo" | "Buen estado" | "Usado";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "Mas recientes" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "views", label: "Mas vistos" },
];

const CONDITION_OPTIONS: ConditionKey[] = [
  "Nuevo",
  "Como nuevo",
  "Buen estado",
  "Usado",
];

const PAGE_SIZE = 20;

function ExploreInner() {
  const params = useSearchParams();
  const router = useRouter();
  const initialQ = params.get("q") ?? "";
  const initialCat = params.get("cat") ?? "";

  // ─── Filter state ────────────────────────────────────────────────────
  const [query, setQuery] = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [categorySlug, setCategorySlug] = useState(initialCat);
  const [city, setCity] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [conditions, setConditions] = useState<Set<ConditionKey>>(new Set());
  const [sort, setSort] = useState<SortKey>("recent");
  const [page, setPage] = useState(0);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // ─── Hooks ───────────────────────────────────────────────────────────
  const { categories } = useCategories();
  const { isAuthenticated } = useAuth();
  const { searches, saveSearch, deleteSearch } = useSavedSearches();

  // Resolve category id from slug
  const selectedCategory = useMemo(
    () => categories.find((c: any) => c.slug === categorySlug),
    [categories, categorySlug]
  );

  // Debounce search text
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
      setAllProducts([]);
    }, 400);
    return () => clearTimeout(t);
  }, [query]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
    setAllProducts([]);
  }, [categorySlug, city, minPrice, maxPrice, conditions, sort]);

  // ─── Build search input ──────────────────────────────────────────────
  const searchInput = useMemo(() => {
    const input: Record<string, unknown> = {
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    };
    if (debouncedQuery.trim()) input.query = debouncedQuery.trim();
    if (selectedCategory) input.categoryId = selectedCategory.id;
    if (city.trim()) input.city = city.trim();
    if (minPrice) input.minPrice = Number(minPrice);
    if (maxPrice) input.maxPrice = Number(maxPrice);
    if (conditions.size === 1) input.condition = [...conditions][0];
    if (sort !== "recent") input.sort = sort;
    return input;
  }, [debouncedQuery, selectedCategory, city, minPrice, maxPrice, conditions, sort, page]);

  const { data, loading } = useQuery(SEARCH_PRODUCTS, {
    variables: { input: searchInput },
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean };

  const pageProducts: Product[] = data?.searchProducts ?? [];

  // Accumulate products for "load more"
  useEffect(() => {
    if (pageProducts.length > 0) {
      setAllProducts((prev) => {
        if (page === 0) return pageProducts;
        // avoid duplicates
        const existingIds = new Set(prev.map((p) => p.id));
        const fresh = pageProducts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...fresh];
      });
    } else if (page === 0 && !loading) {
      setAllProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageProducts, page, loading]);

  const displayProducts = page === 0 && loading ? [] : allProducts;
  const hasMore = pageProducts.length === PAGE_SIZE;

  // ─── Filter helpers ──────────────────────────────────────────────────
  const toggleCondition = (c: ConditionKey) => {
    setConditions((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  };

  const clearFilters = () => {
    setQuery("");
    setDebouncedQuery("");
    setCategorySlug("");
    setCity("");
    setMinPrice("");
    setMaxPrice("");
    setConditions(new Set());
    setSort("recent");
    setPage(0);
    setAllProducts([]);
    router.replace("/explore");
  };

  const hasActiveFilters =
    debouncedQuery || categorySlug || city || minPrice || maxPrice || conditions.size > 0;

  // ─── Save search ─────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const handleSaveSearch = async () => {
    if (!isAuthenticated || !hasActiveFilters) return;
    setSaving(true);
    try {
      await saveSearch({
        query: debouncedQuery || null,
        categoryId: selectedCategory?.id || null,
        city: city.trim() || null,
        priceMin: minPrice ? Number(minPrice) : null,
        priceMax: maxPrice ? Number(maxPrice) : null,
      });
    } catch {
      // silently fail
    }
    setSaving(false);
  };

  const applySavedSearch = useCallback(
    (s: any) => {
      setQuery(s.query ?? "");
      setDebouncedQuery(s.query ?? "");
      if (s.categoryId) {
        const cat = categories.find((c: any) => c.id === s.categoryId);
        setCategorySlug(cat?.slug ?? "");
      } else {
        setCategorySlug("");
      }
      setCity(s.city ?? "");
      setMinPrice(s.priceMin ? String(s.priceMin) : "");
      setMaxPrice(s.priceMax ? String(s.priceMax) : "");
      setConditions(new Set());
      setSort("recent");
      setPage(0);
      setAllProducts([]);
    },
    [categories]
  );

  // ─── Filter sidebar content (shared mobile/desktop) ──────────────────
  const filterContent = (
    <div className="space-y-5">
      {/* Search input */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Buscar
        </label>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Anuncios, marcas..."
            className="h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-lowest pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setDebouncedQuery(""); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-on-surface"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Categoria
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setCategorySlug("")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              !categorySlug
                ? "bg-primary text-on-primary"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
            }`}
          >
            Todas
          </button>
          {categories.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setCategorySlug(c.slug)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                categorySlug === c.slug
                  ? "bg-primary text-on-primary"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-high"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* City */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Ciudad
        </label>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Ej: Malabo, Bata..."
          className="h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Price range */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Precio (XAF)
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            min={0}
            className="h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            min={0}
            className="h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Estado
        </label>
        <div className="space-y-1.5">
          {CONDITION_OPTIONS.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-on-surface-variant transition hover:bg-surface-container"
            >
              <input
                type="checkbox"
                checked={conditions.has(c)}
                onChange={() => toggleCondition(c)}
                className="h-4 w-4 rounded border-outline-variant/50 text-primary focus:ring-primary/30"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Ordenar por
        </label>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-10 w-full rounded-lg border border-outline-variant/40 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear + Save */}
      <div className="flex flex-col gap-2 pt-1">
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/40 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container"
          >
            <X size={14} /> Limpiar filtros
          </button>
        )}
        {isAuthenticated && hasActiveFilters && (
          <button
            onClick={handleSaveSearch}
            disabled={saving}
            className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <BookmarkPlus size={14} />
            )}
            Guardar busqueda
          </button>
        )}
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl py-6">
      {/* Page header */}
      <div className="mb-5 px-4 sm:px-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-on-surface">
          Explorar anuncios
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Busca y filtra entre todos los anuncios publicados
        </p>
      </div>

      {/* Saved searches */}
      {isAuthenticated && searches.length > 0 && (
        <div className="mb-4 px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-2">
            <Bookmark size={14} className="text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Busquedas guardadas
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searches.map((s) => (
              <button
                key={s.id}
                onClick={() => applySavedSearch(s)}
                className="group inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-lowest px-3 py-1.5 text-xs font-medium text-on-surface-variant transition hover:border-primary/40 hover:bg-primary/5"
              >
                <span>
                  {[s.query, s.city].filter(Boolean).join(" - ") || "Busqueda guardada"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSearch(s.id);
                  }}
                  className="ml-0.5 rounded-full p-0.5 text-muted opacity-0 transition group-hover:opacity-100 hover:bg-danger/10 hover:text-danger"
                >
                  <Trash2 size={11} />
                </button>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6 px-4 sm:px-6">
        {/* ── Desktop sidebar ── */}
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-32 rounded-xl border border-outline-variant/30 bg-surface-lowest p-5">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-on-surface-variant" />
              <h2 className="text-sm font-bold text-on-surface">Filtros</h2>
            </div>
            {filterContent}
          </div>
        </aside>

        {/* ── Main area ── */}
        <div className="min-w-0 flex-1">
          {/* Mobile filter toggle */}
          <div className="mb-4 lg:hidden">
            <button
              onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-outline-variant/30 bg-surface-lowest px-4 py-3 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
            >
              <span className="flex items-center gap-2">
                <SlidersHorizontal size={16} />
                Filtros
                {hasActiveFilters && (
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-on-primary">
                    !
                  </span>
                )}
              </span>
              {mobileFiltersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {mobileFiltersOpen && (
              <div className="mt-2 animate-fade-in rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
                {filterContent}
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted">
              {loading && displayProducts.length === 0
                ? "Buscando..."
                : `${displayProducts.length}${hasMore ? "+" : ""} resultados`}
            </p>
            {/* Desktop sort (duplicated for quick access) */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="hidden rounded-full border border-outline-variant/40 bg-surface-lowest px-3 py-1.5 text-xs outline-none lg:block"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Products grid */}
          {!loading && displayProducts.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-lg font-bold text-on-surface">Sin resultados</p>
              <p className="mt-1 text-sm text-muted">
                Prueba con otra busqueda o quita algun filtro.
              </p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
                >
                  <X size={14} /> Limpiar filtros
                </button>
              )}
            </div>
          ) : (
            <>
              <ProductGrid products={displayProducts} loading={loading && page === 0} />

              {/* Load more */}
              {hasMore && !loading && (
                <div className="mt-8 text-center">
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-on-primary shadow-soft transition hover:bg-primary/90"
                  >
                    Cargar mas
                  </button>
                </div>
              )}

              {loading && page > 0 && (
                <div className="mt-6 flex justify-center">
                  <Loader2 size={24} className="animate-spin text-primary" />
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
