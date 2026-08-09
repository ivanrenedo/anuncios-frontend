"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  Pin,
  Zap,
  X,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { Product } from "@/lib/types";
import {
  PINNED_PRODUCTS,
  MY_AUTO_BUMP_SLOTS,
} from "@/graphql/queries";
import {
  SET_PINNED_PRODUCTS,
  SET_AUTO_BUMP_SLOTS,
} from "@/graphql/mutations";
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
 * v2 Fase 10b — panel de gestión para features plan-gateadas (pins de perfil
 * y pool de auto-bump). Sólo visible para Star/Premium. Los productos vienen
 * del padre para reutilizar el fetch existente y evitar N+1.
 */
export default function PlanFeaturesPanel({
  userId,
  effectivePlan,
  products,
}: Props) {
  const limits =
    PLAN_LIMITS[effectivePlan as keyof typeof PLAN_LIMITS] ?? PLAN_LIMITS.FREE;
  const [pinnedOpen, setPinnedOpen] = useState(false);
  const [slotsOpen, setSlotsOpen] = useState(false);

  const { data: pinnedData } = useQuery(PINNED_PRODUCTS, {
    variables: { userId },
    skip: !userId || limits.pinned === 0,
    fetchPolicy: "cache-and-network",
  }) as { data: any };
  const { data: slotsData } = useQuery(MY_AUTO_BUMP_SLOTS, {
    skip: limits.slots === 0,
    fetchPolicy: "cache-and-network",
  }) as { data: any };

  const pinnedIds: string[] = (pinnedData?.pinnedProducts ?? []).map(
    (p: Product) => p.id,
  );
  const slotIds: string[] = (slotsData?.myAutoBumpSlots ?? []).map(
    (s: any) => s.productId,
  );

  if (limits.pinned === 0 && limits.slots === 0) return null;

  return (
    <div className="mb-6 rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <p className="mb-3 text-xs font-extrabold uppercase tracking-wide text-primary">
        Ventajas de tu plan
      </p>
      <div className="flex flex-wrap gap-2">
        {limits.pinned > 0 && (
          <button
            type="button"
            onClick={() => setPinnedOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-lowest px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
          >
            <Pin size={14} className="text-primary" />
            Anuncios fijados
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
              {pinnedIds.length} / {limits.pinned}
            </span>
          </button>
        )}
        {limits.slots > 0 && (
          <button
            type="button"
            onClick={() => setSlotsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-surface-lowest px-3 py-2 text-sm font-semibold text-on-surface transition hover:bg-surface-container"
          >
            <Zap size={14} className="text-amber-500" />
            Auto-bump {limits.cadence}
            <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600">
              {slotIds.length} / {limits.slots}
            </span>
          </button>
        )}
      </div>

      {pinnedOpen && (
        <ProductPicker
          title="Anuncios fijados en tu perfil"
          subtitle="Aparecen antes que el resto en tu perfil."
          products={products}
          initialSelectedIds={pinnedIds}
          limit={limits.pinned}
          mutation="pins"
          onClose={() => setPinnedOpen(false)}
        />
      )}
      {slotsOpen && (
        <ProductPicker
          title={`Pool de auto-bump (${limits.cadence})`}
          subtitle="Estos anuncios suben automáticamente a la parte superior de su categoría."
          products={products}
          initialSelectedIds={slotIds}
          limit={limits.slots}
          mutation="slots"
          onClose={() => setSlotsOpen(false)}
        />
      )}
    </div>
  );
}

interface PickerProps {
  title: string;
  subtitle: string;
  products: Product[];
  initialSelectedIds: string[];
  limit: number;
  mutation: "pins" | "slots";
  onClose: () => void;
}

function ProductPicker({
  title,
  subtitle,
  products,
  initialSelectedIds,
  limit,
  mutation,
  onClose,
}: PickerProps) {
  const [selected, setSelected] = useState<string[]>(initialSelectedIds);
  const [error, setError] = useState("");
  const active = useMemo(
    () => products.filter((p) => p.status === "active"),
    [products],
  );

  const [setPinnedMut, { loading: savingPins }] = useMutation(
    SET_PINNED_PRODUCTS,
    { refetchQueries: ["PinnedProducts"], awaitRefetchQueries: true },
  );
  const [setSlotsMut, { loading: savingSlots }] = useMutation(
    SET_AUTO_BUMP_SLOTS,
    { refetchQueries: ["MyAutoBumpSlots"], awaitRefetchQueries: true },
  );
  const saving = savingPins || savingSlots;

  const toggle = (id: string) => {
    setError("");
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= limit) {
        setError(`Máximo ${limit} anuncios para este plan.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const move = (idx: number, dir: -1 | 1) => {
    const j = idx + dir;
    if (j < 0 || j >= selected.length) return;
    setSelected((prev) => {
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const onSave = async () => {
    setError("");
    try {
      if (mutation === "pins") {
        await setPinnedMut({ variables: { productIds: selected } });
      } else {
        await setSlotsMut({ variables: { productIds: selected } });
      }
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
        className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 border-b border-outline-variant/30 px-5 py-4">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-extrabold text-on-surface">{title}</h3>
            <p className="mt-0.5 text-xs text-on-surface-variant">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full text-on-surface-variant hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {selected.length > 0 && (
          <div className="border-b border-outline-variant/30 bg-surface-container/40 px-5 py-3">
            <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-on-surface-variant">
              Orden (arrastra o usa flechas)
            </p>
            <ol className="space-y-1.5">
              {selected.map((id, idx) => {
                const p = active.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <li
                    key={id}
                    className="flex items-center gap-2 rounded-lg bg-surface-lowest px-2 py-1.5 text-sm"
                  >
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">
                      {idx + 1}
                    </span>
                    <span className="line-clamp-1 flex-1">{p.title}</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => move(idx, -1)}
                        disabled={idx === 0}
                        className="grid h-6 w-6 place-items-center rounded text-xs text-on-surface-variant disabled:opacity-30 hover:bg-surface-container"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => move(idx, 1)}
                        disabled={idx === selected.length - 1}
                        className="grid h-6 w-6 place-items-center rounded text-xs text-on-surface-variant disabled:opacity-30 hover:bg-surface-container"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="grid h-6 w-6 place-items-center rounded text-xs text-danger hover:bg-danger/10"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        <div className="max-h-[45vh] overflow-y-auto px-5 py-3">
          {active.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">
              No tienes anuncios activos que puedas fijar.
            </p>
          ) : (
            <ul className="space-y-2">
              {active.map((p) => {
                const isSel = selected.includes(p.id);
                const img = p.images?.[0]?.url;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => toggle(p.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2 text-left transition ${
                        isSel
                          ? "border-primary/50 bg-primary/5"
                          : "border-outline-variant/30 hover:bg-surface-container"
                      }`}
                    >
                      {img ? (
                        <img
                          src={resolveImage(img)}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 shrink-0 rounded-lg bg-surface-container" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm font-semibold text-on-surface">
                          {p.title}
                        </p>
                        <p className="text-[11px] text-on-surface-variant">
                          {Number(p.price).toLocaleString("es")} XAF
                        </p>
                      </div>
                      <span
                        className={`grid h-6 w-6 place-items-center rounded-full text-white ${
                          isSel
                            ? "bg-primary"
                            : "bg-outline-variant/30 text-transparent"
                        }`}
                      >
                        <Check size={14} strokeWidth={3} />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 border-t border-danger/30 bg-danger/10 px-5 py-2 text-xs text-danger">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3 border-t border-outline-variant/30 px-5 py-3">
          <p className="text-xs text-on-surface-variant">
            <strong className="text-on-surface">{selected.length}</strong> /{" "}
            {limit} seleccionados
          </p>
          <div className="flex gap-2">
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
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
