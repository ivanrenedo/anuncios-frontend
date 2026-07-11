"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { GET_ALL_PRODUCTS } from "@/graphql/queries";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import ProductDetailModal from "@/components/admin/ProductDetailModal";
import { formatPrice, formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import type { Product } from "@/lib/types";

// Matches the backend ProductStatus enum (active | hide).
const STATUS: Record<string, string> = {
  active: "Activo",
  hide: "Oculto",
};

// Server page size — the table shows one server page at a time.
const PAGE_SIZE = 50;

export default function AdminProducts() {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [boostedOnly, setBoostedOnly] = useState(false);

  // Debounce the search box so we don't hit the server on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(search.trim());
      setPage(0);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, loading } = useQuery(GET_ALL_PRODUCTS, {
    variables: {
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
      query: debounced || undefined,
    },
  }) as { data: any; loading: boolean };

  const products: Product[] = data?.allProducts ?? [];
  const now = new Date();

  let filtered = products;
  if (statusFilter !== "all") filtered = filtered.filter((p) => p.status === statusFilter);
  if (boostedOnly)
    filtered = filtered.filter(
      (p) => p.boostedUntil && new Date(p.boostedUntil) > now,
    );

  const hasNext = products.length === PAGE_SIZE;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">Anuncios</h1>
        <p className="mt-1 text-sm text-muted">
          Página {page + 1} · {filtered.length} anuncios mostrados
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          placeholder="Buscar por título o vendedor…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full max-w-md rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none"
        >
          <option value="all">Todos los estados</option>
          {Object.entries(STATUS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <button
          onClick={() => setBoostedOnly((v) => !v)}
          className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition ${
            boostedOnly
              ? "border-violet-500/60 bg-violet-500/10 text-violet-600"
              : "border-outline-variant/50 bg-surface-lowest text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <Sparkles size={14} />
          Solo destacados
        </button>
      </div>

      <DataTable<Product>
        loading={loading}
        data={filtered}
        pageSize={PAGE_SIZE}
        onRowClick={(p) => setSelected(p.id)}
        columns={[
          {
            key: "title",
            label: "Anuncio",
            render: (p) => (
              <div className="flex items-center gap-3">
                {p.images?.[0]?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImage(p.images[0].url)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-surface-container text-muted">📦</div>
                )}
                <div>
                  <p className="max-w-[200px] truncate font-medium text-on-surface">{p.title}</p>
                  <p className="text-xs text-muted">{p.category?.label}</p>
                </div>
              </div>
            ),
          },
          { key: "price", label: "Precio", render: (p) => formatPrice(p.price) },
          { key: "status", label: "Estado", render: (p) => <Badge variant={p.status}>{STATUS[p.status ?? ""] ?? p.status}</Badge> },
          {
            key: "boostedUntil",
            label: "Destacado",
            render: (p) =>
              p.boostedUntil && new Date(p.boostedUntil) > new Date() ? (
                <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-violet-500/10 px-2 py-0.5 text-xs font-semibold text-violet-600">
                  <Sparkles size={11} /> hasta {formatDate(p.boostedUntil)}
                </span>
              ) : (
                <span className="text-xs text-muted">—</span>
              ),
          },
          { key: "seller", label: "Vendedor", render: (p) => p.seller?.name ?? "-", sortable: false },
          { key: "views", label: "Vistas" },
          { key: "createdAt", label: "Fecha", render: (p) => formatDate(p.createdAt) },
        ]}
      />

      {/* Server pagination */}
      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm font-medium transition hover:bg-surface-container disabled:opacity-40"
        >
          <ChevronLeft size={15} /> Anterior
        </button>
        <span className="text-sm text-muted">Página {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!hasNext || loading}
          className="inline-flex h-9 items-center gap-1 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm font-medium transition hover:bg-surface-container disabled:opacity-40"
        >
          Siguiente <ChevronRight size={15} />
        </button>
      </div>

      <ProductDetailModal productId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
