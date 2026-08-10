"use client";

import { useEffect, useState } from "react";
import { Check, ChevronLeft, X } from "lucide-react";

interface Node {
  id: string;
  label: string;
  children?: Node[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  tree: Node[];
  active: string;
  onChange: (label: string) => void;
}

/**
 * Drill-down category picker. Mirrors the mobile CategoryPickerSheet: at the
 * root level we show top-level categories plus a "Todos" option; tapping a
 * category with children shows those children with the option to select the
 * parent as a whole ("Todo <parent>") — matching the "Ver todo" tile from the
 * categories page.
 */
export default function CategoryPickerModal({
  open,
  onClose,
  tree,
  active,
  onChange,
}: Props) {
  const [stack, setStack] = useState<Node[]>([]);

  // Reset navigation whenever we reopen the picker.
  useEffect(() => {
    if (open) setStack([]);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = stack.length ? stack[stack.length - 1] : null;
  const list = current ? current.children ?? [] : tree;

  const pick = (label: string) => {
    onChange(label);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center">
      <div className="flex h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-surface-lowest sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-outline-variant/40 px-3 py-3">
          {stack.length > 0 && (
            <button
              onClick={() => setStack((s) => s.slice(0, -1))}
              className="grid h-9 w-9 place-items-center rounded-full text-on-surface hover:bg-surface-container"
              aria-label="Volver"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          <h3 className="flex-1 text-base font-bold text-on-surface">
            {current ? current.label : "Elegir categoría"}
          </h3>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-on-surface hover:bg-surface-container"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* Root only: "Todos" */}
          {stack.length === 0 && (
            <button
              onClick={() => pick("Todos")}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-on-surface hover:bg-surface-container"
            >
              <span className="font-semibold">Todos</span>
              {active === "Todos" && (
                <Check size={18} className="text-primary" />
              )}
            </button>
          )}

          {/* Parent-only "Todo <label>" when drilling into a category */}
          {current && (
            <button
              onClick={() => pick(current.label)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-on-surface hover:bg-surface-container"
            >
              <span className="font-semibold">Todo {current.label}</span>
              {active === current.label && (
                <Check size={18} className="text-primary" />
              )}
            </button>
          )}

          {list.map((n) => {
            const hasChildren = (n.children ?? []).length > 0;
            return (
              <button
                key={n.id}
                onClick={() =>
                  hasChildren ? setStack((s) => [...s, n]) : pick(n.label)
                }
                className="flex w-full items-center justify-between border-t border-outline-variant/25 px-4 py-3 text-left text-on-surface hover:bg-surface-container"
              >
                <span>{n.label}</span>
                <span className="text-muted">
                  {hasChildren ? "›" : active === n.label ? (
                    <Check size={18} className="text-primary" />
                  ) : null}
                </span>
              </button>
            );
          })}

          {list.length === 0 && !current && (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No hay categorías disponibles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
