"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { Pin, Zap, X, Loader2, AlertCircle, ArrowUpDown } from "lucide-react";
import type { Product } from "@/lib/types";
import { PINNED_PRODUCTS, MY_AUTO_BUMP_SLOTS } from "@/graphql/queries";
import { SET_PINNED_PRODUCTS } from "@/graphql/mutations";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";

const PLAN_LIMITS = {
  FREE: { pinned: 0, slots: 0, cadence: null as string | null },
  BASIC: { pinned: 0, slots: 0, cadence: null },
  STAR: { pinned: 4, slots: 3, cadence: "semanal" },
  PREMIUM: { pinned: 10, slots: 5, cadence: "diaria" },
} as const;

interface Props {
  userId: string;
  effectivePlan: string;
  products: Product[];
}

/**
 * v2 Fase 13 — panel compacto con las ventajas plan-gateadas.
 *
 * Diseño consolidado:
 *   - Add/remove de pins y auto-bump vive SOLO en el botón de cada card
 *     del perfil (Fase 11.3). Esta panel es puramente informativa.
 *   - Excepción: reorder de pins. Cuando hay ≥2 pins, aparece un chip
 *     "↕ Reordenar" que abre un modal ligero solo con la lista ordenada +
 *     flechas. Sin checkbox, sin add/remove — el 90% del flujo pasa por
 *     la card.
 *   - Auto-bump no tiene concepto de orden → cero interacción aquí.
 *
 * Retirado respecto de Fase 10b: ProductPicker con multiselect. El
 * bulk-select se sacrifica a favor de una única forma de pinear (card),
 * lo que elimina ambigüedad UX.
 */
export default function PlanFeaturesPanel({
  userId,
  effectivePlan,
  products,
}: Props) {
  const limits =
    PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE;
  const [reorderOpen, setReorderOpen] = useState(false);

  const { data: pinnedData } = useQuery(PINNED_PRODUCTS, {
    variables: { userId },
    skip: !userId || limits.pinned === 0,
    fetchPolicy: "cache-and-network",
  }) as { data: any };
  const { data: slotsData } = useQuery(MY_AUTO_BUMP_SLOTS, {
    skip: limits.slots === 0,
    fetchPolicy: "cache-and-network",
  }) as { data: any };

  const pinned: Product[] = pinnedData?.pinnedProducts ?? [];
  const slotCount: number = (slotsData?.myAutoBumpSlots ?? []).length;

  if (limits.pinned === 0 && limits.slots === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-primary/25 bg-primary/5 px-4 py-3">
      <p className="text-xs font-extrabold uppercase tracking-wide text-primary">
        Ventajas de tu plan
      </p>
      {limits.pinned > 0 && (
        <span className="inline-flex items-center gap-2 text-sm text-on-surface">
          {pinned.length >= 2 && (
            <button
              type="button"
              onClick={() => setReorderOpen(true)}
              className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[12px] font-bold text-white transition hover:bg-surface-container"
            >
              <ArrowUpDown size={16} />
              Reordenar
            </button>
          )}
          <Pin size={14} className="text-purple-600" />
          <span>
            Anuncios fijados{" "}
            <strong>
              {pinned.length}/{limits.pinned}
            </strong>
          </span>
          
        </span>
      )}
      {limits.slots > 0 && (
        <span className="inline-flex items-center gap-2 text-sm text-on-surface">
          <Zap size={14} className="text-amber-500" />
          <span>
            Auto-bump {limits.cadence}{" "}
            <strong>
              {slotCount}/{limits.slots}
            </strong>
          </span>
        </span>
      )}
      <span className="ml-auto text-[11px] text-on-surface-variant/80">
        Fija o activa auto-bump con los botones{" "}
        <Pin size={10} className="inline align-middle text-primary" />{" "}
        <Zap size={10} className="inline align-middle text-amber-500" /> de
        cada anuncio.
      </span>

      {reorderOpen && (
        <ReorderPinsModal
          userId={userId}
          pinned={pinned}
          products={products}
          onClose={() => setReorderOpen(false)}
        />
      )}
    </div>
  );
}

interface ReorderProps {
  userId: string;
  pinned: Product[];
  products: Product[];
  onClose: () => void;
}

function ReorderPinsModal({ pinned, products, onClose }: ReorderProps) {
  // Trabajamos sobre un array de ids que mantiene el orden actual del server.
  // Los flechas ↑/↓ intercambian posiciones. Save envía la nueva secuencia.
  const [order, setOrder] = useState<string[]>(() => pinned.map((p) => p.id));
  const [error, setError] = useState("");
  const productMap = useMemo(() => {
    const m = new Map<string, Product>();
    for (const p of products) m.set(p.id, p);
    for (const p of pinned) if (!m.has(p.id)) m.set(p.id, p);
    return m;
  }, [products, pinned]);

  const [setPinnedMut, { loading: saving }] = useMutation(SET_PINNED_PRODUCTS, {
    refetchQueries: ["PinnedProducts"],
    awaitRefetchQueries: true,
  });

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= order.length) return;
    setOrder((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const onSave = async () => {
    setError("");
    try {
      await setPinnedMut({ variables: { productIds: order } });
      onClose();
    } catch (e) {
      setError(getErrorMessage(e));
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-outline-variant/30 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-on-surface">
              Reordenar anuncios fijados
            </h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">
              Cambia el orden con las flechas. Para fijar o quitar un anuncio,
              usa el botón <Pin size={10} className="inline align-middle" /> de
              la card.
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <ol className="max-h-[55vh] space-y-1.5 overflow-y-auto px-5 py-4">
          {order.map((id, idx) => {
            const p = productMap.get(id);
            const img = p?.images?.[0]?.url;
            return (
              <li
                key={id}
                className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-2"
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                  {idx + 1}
                </span>
                {img ? (
                  <img
                    src={resolveImage(img)}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-surface-container" />
                )}
                <p className="line-clamp-1 flex-1 text-sm font-semibold text-on-surface">
                  {p?.title ?? "Anuncio"}
                </p>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="Subir"
                    className="grid h-7 w-7 place-items-center rounded text-on-surface-variant transition hover:bg-surface-container disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    disabled={idx === order.length - 1}
                    aria-label="Bajar"
                    className="grid h-7 w-7 place-items-center rounded text-on-surface-variant transition hover:bg-surface-container disabled:opacity-30"
                  >
                    ↓
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        {error && (
          <div className="flex items-center gap-2 border-t border-danger/30 bg-danger/10 px-5 py-2 text-xs text-danger">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-outline-variant/30 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-on-surface-variant hover:bg-surface-container"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-60"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Guardar orden
          </button>
        </div>
      </div>
    </div>
  );
}
