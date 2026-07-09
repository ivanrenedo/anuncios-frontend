"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
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

export default function AdminProducts() {
  const { data, loading } = useQuery(GET_ALL_PRODUCTS, {
    variables: { take: 500 },
  }) as { data: any; loading: boolean };
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const products: Product[] = data?.allProducts ?? [];

  let filtered = search
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(search.toLowerCase()) ||
          p.seller?.name?.toLowerCase().includes(search.toLowerCase())
      )
    : products;
  if (statusFilter !== "all") filtered = filtered.filter((p) => p.status === statusFilter);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">Anuncios</h1>
        <p className="mt-1 text-sm text-muted">
          {products.length} anuncios · solo lectura
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
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
      </div>

      <DataTable<Product>
        loading={loading}
        data={filtered}
        pageSize={10}
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
          { key: "seller", label: "Vendedor", render: (p) => p.seller?.name ?? "-", sortable: false },
          { key: "views", label: "Vistas" },
          { key: "createdAt", label: "Fecha", render: (p) => formatDate(p.createdAt) },
        ]}
      />

      <ProductDetailModal productId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
