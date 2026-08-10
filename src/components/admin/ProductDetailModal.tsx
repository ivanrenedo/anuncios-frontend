"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import {
  MapPin,
  Eye,
  Heart,
  Tag,
  ExternalLink,
  BadgeCheck,
  ArrowUpCircle,
  Sparkles,
  EyeOff,
  Pencil,
  X,
  Save,
} from "lucide-react";
import { GET_PRODUCT, GET_CATEGORIES } from "@/graphql/queries";
import {
  BUMP_PRODUCT,
  BOOST_PRODUCT,
  UNBOOST_PRODUCT,
  ADMIN_SET_PRODUCT_STATUS,
  ADMIN_UPDATE_PRODUCT,
  ADMIN_DELETE_PRODUCT_IMAGE,
} from "@/graphql/mutations";
import Modal from "@/components/admin/Modal";
import Badge from "@/components/admin/Badge";
import Spinner from "@/components/Spinner";
import { formatPrice, formatDate, applyDiscount } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";

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

interface EditForm {
  title: string;
  price: string;
  discount: string;
  condition: string;
  city: string;
  categoryId: string;
  description: string;
}

export default function ProductDetailModal({
  productId,
  onClose,
}: {
  productId: string | null;
  onClose: () => void;
}) {
  const [imageIdx, setImageIdx] = useState(0);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setImageIdx(0);
    setEditing(false);
    setForm(null);
    setEditError("");
  }, [productId]);

  const { data } = useQuery(GET_PRODUCT, {
    variables: { id: productId || "" },
    skip: !productId,
  }) as { data: any };
  const { data: catData } = useQuery(GET_CATEGORIES) as { data: any };
  const categories: { id: string; label: string; parentId?: string | null }[] =
    catData?.categories ?? [];

  const [bump, { loading: bumping }] = useMutation(BUMP_PRODUCT, {
    refetchQueries: ["Product", "AllProducts"],
  });
  const [boost, { loading: boosting }] = useMutation(BOOST_PRODUCT, {
    refetchQueries: ["Product", "AllProducts"],
  });
  const [unboost, { loading: unboosting }] = useMutation(UNBOOST_PRODUCT, {
    refetchQueries: ["Product", "AllProducts"],
  });
  const [setStatus, { loading: settingStatus }] = useMutation(ADMIN_SET_PRODUCT_STATUS, {
    refetchQueries: ["Product", "AllProducts"],
  });
  const [updateProduct, { loading: saving }] = useMutation(ADMIN_UPDATE_PRODUCT, {
    refetchQueries: ["Product", "AllProducts"],
  });
  const [deleteImage, { loading: deletingImage }] = useMutation(ADMIN_DELETE_PRODUCT_IMAGE, {
    refetchQueries: ["Product", "AllProducts"],
  });

  const detail = data?.product;
  const images: { id: string; url: string }[] = detail?.images ?? [];
  const dprice = detail ? applyDiscount(detail.price, detail.discount) : null;
  const isBoosted = detail?.boostedUntil && new Date(detail.boostedUntil) > new Date();

  const onToggleStatus = () => {
    if (!detail) return;
    const hiding = detail.status === "active";
    const reason = hiding
      ? window.prompt("Motivo (se envía al vendedor, opcional):") ?? undefined
      : undefined;
    setStatus({ variables: { id: detail.id, status: hiding ? "hide" : "active", reason } });
  };

  const onUnboost = () => {
    if (!detail) return;
    if (window.confirm("¿Quitar el destacado de este anuncio? El pago del ledger no se borra automáticamente.")) {
      unboost({ variables: { id: detail.id } });
    }
  };

  const startEdit = () => {
    if (!detail) return;
    setForm({
      title: detail.title ?? "",
      price: String(detail.price ?? ""),
      discount: detail.discount ? String(detail.discount) : "",
      condition: detail.condition ?? "",
      city: detail.city ?? "",
      categoryId: detail.category?.id ?? "",
      description: detail.description ?? "",
    });
    setEditError("");
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!detail || !form) return;
    if (!form.title.trim()) {
      setEditError("El título es obligatorio.");
      return;
    }
    const price = parseFloat(form.price.replace(",", "."));
    if (Number.isNaN(price) || price < 0) {
      setEditError("Precio no válido.");
      return;
    }
    setEditError("");
    try {
      await updateProduct({
        variables: {
          id: detail.id,
          input: {
            title: form.title.trim(),
            price,
            discount: form.discount ? parseInt(form.discount, 10) : null,
            condition: form.condition.trim() || null,
            city: form.city.trim() || null,
            description: form.description.trim() || null,
            ...(form.categoryId && form.categoryId !== detail.category?.id
              ? { categoryId: form.categoryId }
              : {}),
          },
        },
      });
      setEditing(false);
    } catch (e) {
      setEditError(getErrorMessage(e, "No se pudo guardar el anuncio."));
    }
  };

  const onDeleteImage = (imageId: string) => {
    if (images.length <= 1) {
      window.alert("El anuncio necesita al menos una foto. Oculta el anuncio si la única foto es inapropiada.");
      return;
    }
    if (window.confirm("¿Eliminar esta foto del anuncio?")) {
      deleteImage({ variables: { imageId } });
      setImageIdx(0);
    }
  };

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
                    src={resolveImage(images[imageIdx].url)}
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
              {images.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto scrollbar-hide">
                  {images.map((img, i) => (
                    <div key={img.id} className="relative shrink-0">
                      <button
                        onClick={() => setImageIdx(i)}
                        className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition ${
                          i === imageIdx
                            ? "border-primary"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolveImage(img.url)} alt="" className="h-full w-full object-cover" />
                      </button>
                      <button
                        onClick={() => onDeleteImage(img.id)}
                        disabled={deletingImage}
                        title="Eliminar foto"
                        className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-danger text-white shadow transition hover:opacity-90 disabled:opacity-50"
                      >
                        <X size={11} strokeWidth={2.5} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info / Edit form */}
            {editing && form ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Editar anuncio
                </p>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Título"
                  className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value.replace(/[^\d.,]/g, "") })}
                    placeholder="Precio (XAF)"
                    className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value.replace(/[^\d]/g, "") })}
                    placeholder="Descuento %"
                    className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={form.condition}
                    onChange={(e) => setForm({ ...form, condition: e.target.value })}
                    placeholder="Estado (Nuevo…)"
                    className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Ciudad"
                    className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <select
                  value={form.categoryId}
                  onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                  className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none"
                >
                  <option value="">Categoría…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.parentId ? "— " : ""}{c.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Descripción"
                  rows={4}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                {editError && <p className="text-sm text-danger">{editError}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? <Spinner size={14} /> : <Save size={14} />}
                    {saving ? "Guardando…" : "Guardar"}
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          {/* Description */}
          {!editing && detail.description && (
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
          {!editing && detail.attributes?.length > 0 && (
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

          {/* Admin actions */}
          {!editing && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-outline-variant/30 bg-surface-low p-3">
              <button
                onClick={startEdit}
                className="inline-flex items-center gap-1.5 rounded-xl bg-surface-container px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-high"
              >
                <Pencil size={14} />
                Editar
              </button>
              <button
                onClick={() => bump({ variables: { id: detail.id } })}
                disabled={bumping}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:opacity-50"
              >
                <ArrowUpCircle size={14} />
                {bumping ? "Subiendo…" : "Bump (subir)"}
              </button>
              {isBoosted ? (
                <button
                  onClick={onUnboost}
                  disabled={unboosting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-600 transition hover:bg-violet-500/20 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  {unboosting ? "Quitando…" : "Quitar destacado"}
                </button>
              ) : (
                // v2 (Fase 10a.1): selector de duración con las 3 opciones del
                // briefing v2 (BOOST_PRICES en backend). Cada botón muestra
                // el precio inline para que el admin sepa qué se registra en
                // el ledger antes de confirmar.
                <div className="inline-flex items-center gap-1 rounded-xl bg-violet-500/10 p-1">
                  <span className="pl-2 pr-1 text-xs font-semibold text-violet-600">
                    <Sparkles size={13} className="inline-block mr-1" />
                    Destacar
                  </span>
                  {[
                    { days: 3, xaf: 1000 },
                    { days: 7, xaf: 2000 },
                    { days: 30, xaf: 5000 },
                  ].map(({ days, xaf }) => (
                    <button
                      key={days}
                      onClick={() =>
                        boost({ variables: { id: detail.id, days } })
                      }
                      disabled={boosting}
                      title={`Destacar ${days} días · ${xaf.toLocaleString(
                        "es",
                      )} XAF`}
                      className="rounded-lg bg-violet-500/15 px-2.5 py-1.5 text-xs font-bold text-violet-600 transition hover:bg-violet-500/30 disabled:opacity-50"
                    >
                      {days}d
                      <span className="ml-1 font-normal opacity-70">
                        {(xaf / 1000).toFixed(0)}k
                      </span>
                    </button>
                  ))}
                </div>
              )}
              <button
                onClick={onToggleStatus}
                disabled={settingStatus}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                  detail.status === "active"
                    ? "bg-danger/10 text-danger hover:bg-danger/20"
                    : "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                }`}
              >
                {detail.status === "active" ? <EyeOff size={14} /> : <Eye size={14} />}
                {settingStatus
                  ? "Guardando…"
                  : detail.status === "active"
                    ? "Ocultar anuncio"
                    : "Mostrar anuncio"}
              </button>
              {isBoosted && (
                <span className="ml-auto text-xs font-semibold text-violet-600">
                  Destacado hasta {formatDate(detail.boostedUntil)}
                </span>
              )}
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
