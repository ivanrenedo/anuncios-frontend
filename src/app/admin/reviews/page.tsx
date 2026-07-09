"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_PRODUCTS, REVIEWS_BY_SELLER, SELLER_RATING } from "@/graphql/queries";
import DataTable from "@/components/admin/DataTable";
import Skeleton from "@/components/Skeleton";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { Search } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  text?: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl?: string };
}

export default function AdminReviews() {
  const { data: prodData, loading: prodLoading } = useQuery(GET_PRODUCTS, {
    variables: { take: 500 },
  }) as { data: any; loading: boolean };
  const [seller, setSeller] = useState<string | null>(null);
  const [sellerQuery, setSellerQuery] = useState("");

  const { data: reviewData, loading: reviewLoading } = useQuery(REVIEWS_BY_SELLER, {
    variables: { sellerId: seller || "" },
    skip: !seller,
  }) as { data: any; loading: boolean };
  const { data: ratingData } = useQuery(SELLER_RATING, {
    variables: { sellerId: seller || "" },
    skip: !seller,
  }) as { data: any };

  const map = new Map<string, any>();
  (prodData?.products ?? []).forEach((p: any) => {
    if (p.seller && !map.has(p.seller.id)) map.set(p.seller.id, p.seller);
  });
  const sellers = Array.from(map.values());
  const reviews: Review[] = reviewData?.reviewsBySeller ?? [];
  const rating = ratingData?.sellerRating;

  // Filter the seller list by name (case- and accent-insensitive).
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const q = sellerQuery.trim();
  const filteredSellers = q
    ? sellers.filter((s) => norm(s.name ?? "").includes(norm(q)))
    : sellers;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">Valoraciones</h1>
        <p className="mt-1 text-sm text-muted">Visualiza las reseñas de vendedores</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest">
            <div className="border-b border-outline-variant/30 bg-surface-low px-4 py-3">
              <p className="text-sm font-semibold text-on-surface-variant">Vendedores ({filteredSellers.length})</p>
            </div>
            <div className="border-b border-outline-variant/30 p-3">
              <div className="relative">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  value={sellerQuery}
                  onChange={(e) => setSellerQuery(e.target.value)}
                  placeholder="Buscar vendedor…"
                  className="h-9 w-full rounded-lg border border-outline-variant/50 bg-surface-lowest pl-8 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {prodLoading ? (
                <div className="space-y-2 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : filteredSellers.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted">
                  {sellers.length === 0 ? "Sin vendedores." : "Sin resultados."}
                </p>
              ) : (
                filteredSellers.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSeller(s.id)}
                    className={`flex w-full items-center gap-3 border-b border-outline-variant/15 px-4 py-3 text-left transition ${
                      seller === s.id ? "bg-primary/10" : "hover:bg-surface-container"
                    }`}
                  >
                    {s.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={resolveImage(s.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{s.name?.charAt(0)}</div>
                    )}
                    <p className="truncate text-sm font-medium text-on-surface">{s.name}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {!seller ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-12 text-center text-muted">
              Selecciona un vendedor para ver sus valoraciones
            </div>
          ) : (
            <div className="space-y-4">
              {rating && (
                <div className="flex items-center gap-6 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
                  <div className="text-center">
                    <p className="text-3xl font-extrabold text-on-surface">{rating.average?.toFixed(1) ?? "-"}</p>
                    <div className="mt-1 flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={i <= Math.round(rating.average || 0) ? "text-amber-400" : "text-gray-300"}>★</span>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted">Basado en <span className="font-semibold text-on-surface">{rating.count}</span> valoraciones</p>
                </div>
              )}

              <DataTable<Review>
                loading={reviewLoading}
                data={reviews}
                pageSize={10}
                columns={[
                  {
                    key: "author",
                    label: "Autor",
                    sortable: false,
                    render: (r) => (
                      <div className="flex items-center gap-2">
                        {r.author?.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={resolveImage(r.author.avatarUrl)} alt="" className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="grid h-7 w-7 place-items-center rounded-full bg-surface-container text-xs font-bold text-muted">{r.author?.name?.charAt(0)}</div>
                        )}
                        <span className="text-sm font-medium">{r.author?.name}</span>
                      </div>
                    ),
                  },
                  {
                    key: "rating",
                    label: "Puntuación",
                    render: (r) => (
                      <div className="flex gap-0.5 text-sm">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} className={i <= r.rating ? "text-amber-400" : "text-gray-300"}>★</span>
                        ))}
                      </div>
                    ),
                  },
                  { key: "text", label: "Comentario", render: (r) => <p className="max-w-[300px] truncate text-sm text-muted">{r.text || "-"}</p> },
                  { key: "createdAt", label: "Fecha", render: (r) => formatDate(r.createdAt) },
                ]}
                emptyMessage="Este vendedor no tiene valoraciones"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
