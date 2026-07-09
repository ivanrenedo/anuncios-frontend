"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@apollo/client/react";
import { MapPin, Eye, Heart, Tag, ExternalLink, BadgeCheck } from "lucide-react";
import { GET_PRODUCT } from "@/graphql/queries";
import Modal from "@/components/admin/Modal";
import Badge from "@/components/admin/Badge";
import { formatPrice, formatDate, applyDiscount } from "@/lib/format";
import { resolveImage } from "@/lib/config";

const STATUS: Record<string, string> = {
  active: "Activo",
  hide: "Oculto",
};

function Chip({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant/40 bg-surface-lowest px-2.5 py-1 text-xs font-medium text-on-surface-variant">
      {icon}
      {children}
    </span>
  );
}

export default function ProductDetailModal({
  productId,
  onClose,
}: {
  productId: string | null;
  onClose: () => void;
}) {
  const [imageIdx, setImageIdx] = useState(0);

  useEffect(() => {
    setImageIdx(0);
  }, [productId]);

  const { data } = useQuery(GET_PRODUCT, {
    variables: { id: productId || "" },
    skip: !productId,
  }) as { data: any };

  const detail = data?.product;
  const images: string[] = (detail?.images ?? []).map((i: any) =>
    resolveImage(i.url)
  );
  const dprice = detail ? applyDiscount(detail.price, detail.discount) : null;

  return (
    <Modal open={!!productId} onClose={onClose} title="Detalle del anuncio" wide>
      {!detail ? (
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-2xl bg-surface-container" />
          <div className="space-y-3">
            <div className="h-5 w-2/3 animate-pulse rounded bg-surface-container" />
            <div className="h-12 animate-pulse rounded-2xl bg-surface-container" />
            <div className="h-14 animate-pulse rounded-2xl bg-surface-container" />
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Gallery */}
            <div>
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-container">
                {images[imageIdx] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={imageIdx}
                    src={images[imageIdx]}
                    alt=""
                    className="h-full w-full animate-fade-in object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center text-5xl text-muted">
                    📦
                  </div>
                )}
                {dprice?.hasDiscount && (
                  <span className="absolute left-3 top-3 rounded-full bg-danger px-2.5 py-1 text-xs font-extrabold text-white">
                    −{dprice.percent}%
                  </span>
                )}
                <span className="absolute right-3 top-3">
                  <Badge variant={detail.status}>
                    {STATUS[detail.status] ?? detail.status}
                  </Badge>
                </span>
              </div>
              {images.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((src, i) => (
                    <button
                      key={i}
                      onClick={() => setImageIdx(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                        i === imageIdx
                          ? "border-primary"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div>
              {detail.category?.label && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  <Tag size={12} /> {detail.category.label}
                </span>
              )}
              <h3 className="mt-1 text-xl font-extrabold text-on-surface">
                {detail.title}
              </h3>

              {/* Price */}
              <div className="mt-3 rounded-2xl border border-outline-variant/30 bg-surface-low p-3.5">
                <div className="flex flex-wrap items-end gap-2.5">
                  <span className="text-2xl font-extrabold text-primary">
                    {formatPrice(dprice!.final)}
                  </span>
                  {dprice!.hasDiscount && (
                    <>
                      <span className="mb-0.5 text-sm text-muted line-through">
                        {formatPrice(dprice!.original)}
                      </span>
                      <span className="mb-1 rounded-full bg-danger px-2 py-0.5 text-xs font-extrabold text-white">
                        −{dprice!.percent}%
                      </span>
                    </>
                  )}
                </div>
                {dprice!.hasDiscount && (
                  <p className="mt-1 text-xs font-semibold text-emerald-600">
                    Ahorras {formatPrice(dprice!.savings)}
                  </p>
                )}
              </div>

              {/* Seller */}
              {detail.seller && (
                <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-3">
                  {detail.seller.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImage(detail.seller.avatarUrl)}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                      {detail.seller.name?.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-on-surface">
                      {detail.seller.name}
                      {detail.seller.verified && (
                        <BadgeCheck size={13} className="fill-primary text-white" strokeWidth={0} />
                      )}
                    </p>
                    {detail.seller.location && (
                      <p className="truncate text-xs text-muted">{detail.seller.location}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Chips */}
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.condition && <Chip>{detail.condition}</Chip>}
                {detail.city && <Chip icon={<MapPin size={12} />}>{detail.city}</Chip>}
                <Chip icon={<Eye size={12} />}>{detail.views ?? 0} vistas</Chip>
                <Chip icon={<Heart size={12} />}>{detail.favoritesCount ?? 0}</Chip>
              </div>
            </div>
          </div>

          {/* Description */}
          {detail.description && (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Descripción
              </p>
              <p className="whitespace-pre-line text-sm leading-6 text-on-surface-variant">
                {detail.description}
              </p>
            </div>
          )}

          {/* Attributes */}
          {detail.attributes?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Atributos
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {detail.attributes.map((a: any) => (
                  <div
                    key={a.id}
                    className="rounded-xl border border-outline-variant/20 bg-surface-low p-2.5"
                  >
                    <p className="text-xs text-muted">{a.label}</p>
                    <p className="text-sm font-semibold text-on-surface">{a.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4 text-xs text-muted">
            <span>Publicado {formatDate(detail.createdAt)}</span>
            <a
              href={`/product/${detail.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-sm font-semibold text-primary transition hover:bg-surface-high"
            >
              <ExternalLink size={14} /> Ver en la tienda
            </a>
          </div>
        </div>
      )}
    </Modal>
  );
}
