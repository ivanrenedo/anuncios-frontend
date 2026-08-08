"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, Settings2, ShieldCheck, X } from "lucide-react";
import {
  bootstrapConsent,
  useCookieConsent,
  type CookieCategory,
} from "@/hooks/useCookieConsent";

/**
 * Banner de cookies + modal granular. Se monta en el root layout.
 * - Si no hay decisión previa, muestra un banner discreto en la parte
 *   inferior con 3 opciones: Rechazar / Personalizar / Aceptar todo.
 * - "Personalizar" abre un modal con toggles por categoría.
 * - Al aceptar/rechazar, la decisión se persiste y Google Consent Mode v2
 *   se actualiza al instante (para AdSense / GA4 / Ads).
 *
 * También expone un evento global `window.dispatchEvent(new CustomEvent(
 *   "bomelh:open-cookie-settings"))` que cualquier link de "Preferencias
 *   de cookies" (footer, ajustes) puede disparar para reabrir el modal.
 */

const CATEGORY_META: Record<
  CookieCategory,
  { label: string; description: string; example: string }
> = {
  necessary: {
    label: "Necesarias",
    description:
      "Imprescindibles para que el sitio funcione (sesión, tema, seguridad). No se pueden desactivar.",
    example: "Ej.: mantener tu sesión iniciada, recordar tu preferencia de tema.",
  },
  functional: {
    label: "Funcionales",
    description:
      "Recuerdan preferencias que mejoran tu experiencia pero no son estrictamente necesarias.",
    example: "Ej.: guardar tus últimas búsquedas o filtros.",
  },
  analytics: {
    label: "Analíticas",
    description:
      "Nos ayudan a entender cómo se usa Bomelh y mejorar la plataforma. Datos agregados y anónimos.",
    example: "Ej.: qué categorías se visitan más, tiempos de carga.",
  },
  advertising: {
    label: "Publicidad",
    description:
      "Permiten mostrar anuncios más relevantes y medir su rendimiento. Sin esto verás anuncios menos personalizados.",
    example: "Ej.: Google AdSense, medición de conversiones.",
  },
};

export default function CookieConsent() {
  const { hasDecided, categories, acceptAll, rejectAll, saveCustom } =
    useCookieConsent();
  const [showModal, setShowModal] = useState(false);

  // Bootstrap del Consent Mode una sola vez en montaje.
  useEffect(() => {
    bootstrapConsent();
  }, []);

  // Permitir reabrir el modal desde cualquier sitio con un CustomEvent —
  // así el footer / SettingsModal pueden reabrir sin pasar props.
  useEffect(() => {
    const onOpen = () => setShowModal(true);
    window.addEventListener("bomelh:open-cookie-settings", onOpen);
    return () => window.removeEventListener("bomelh:open-cookie-settings", onOpen);
  }, []);

  const showBanner = !hasDecided && !showModal;

  return (
    <>
      {showBanner && (
        <Banner
          onAcceptAll={acceptAll}
          onRejectAll={rejectAll}
          onCustomize={() => setShowModal(true)}
        />
      )}
      {showModal && (
        <SettingsModal
          initial={categories}
          onClose={() => setShowModal(false)}
          onAcceptAll={() => {
            acceptAll();
            setShowModal(false);
          }}
          onRejectAll={() => {
            rejectAll();
            setShowModal(false);
          }}
          onSave={(partial) => {
            saveCustom(partial);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

function Banner({
  onAcceptAll,
  onRejectAll,
  onCustomize,
}: {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onCustomize: () => void;
}) {
  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      className="fixed inset-x-0 bottom-0 z-[80] animate-fade-in pb-safe"
    >
      <div className="mx-auto max-w-4xl px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-outline-variant/40 bg-surface-lowest p-5 shadow-2xl sm:flex-row sm:items-center sm:gap-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:h-11 sm:w-11">
            <Cookie size={20} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1 text-sm text-on-surface-variant">
            <p className="font-bold text-on-surface">
              Usamos cookies para mejorar tu experiencia
            </p>
            <p className="mt-1 leading-relaxed">
              Utilizamos cookies necesarias y, con tu permiso, también para
              analítica y publicidad. Puedes aceptar todo, rechazar todo o
              personalizar tu elección. Más info en nuestra{" "}
              <Link
                href="/privacy"
                className="font-semibold text-primary underline underline-offset-2 hover:opacity-80"
              >
                política de privacidad
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <button
              type="button"
              onClick={onRejectAll}
              className="h-10 flex-1 rounded-lg border border-outline-variant/50 bg-surface-lowest px-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container sm:flex-none"
            >
              Rechazar
            </button>
            <button
              type="button"
              onClick={onCustomize}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/50 bg-surface-lowest px-4 text-sm font-semibold text-on-surface transition hover:bg-surface-container sm:flex-none"
            >
              <Settings2 size={14} strokeWidth={2} />
              Personalizar
            </button>
            <button
              type="button"
              onClick={onAcceptAll}
              className="h-10 flex-1 rounded-lg bg-primary px-4 text-sm font-bold text-on-primary shadow-soft transition hover:bg-primary/90 sm:flex-none"
            >
              Aceptar todo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface SettingsProps {
  initial: {
    necessary: true;
    functional: boolean;
    analytics: boolean;
    advertising: boolean;
  };
  onClose: () => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onSave: (partial: {
    functional: boolean;
    analytics: boolean;
    advertising: boolean;
  }) => void;
}

function SettingsModal({
  initial,
  onClose,
  onAcceptAll,
  onRejectAll,
  onSave,
}: SettingsProps) {
  const [functional, setFunctional] = useState(initial.functional);
  const [analytics, setAnalytics] = useState(initial.analytics);
  const [advertising, setAdvertising] = useState(initial.advertising);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Preferencias de cookies"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-surface-lowest shadow-2xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-outline-variant/30 px-5 py-4 sm:px-6">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck size={20} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-on-surface">
              Preferencias de cookies
            </h2>
            <p className="text-xs text-muted">
              Puedes cambiar estas preferencias en cualquier momento.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="grid h-9 w-9 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <CategoryToggle
            category="necessary"
            checked
            disabled
            onChange={() => {}}
          />
          <CategoryToggle
            category="functional"
            checked={functional}
            onChange={setFunctional}
          />
          <CategoryToggle
            category="analytics"
            checked={analytics}
            onChange={setAnalytics}
          />
          <CategoryToggle
            category="advertising"
            checked={advertising}
            onChange={setAdvertising}
          />

          <p className="mt-4 rounded-lg bg-surface-container/60 p-3 text-xs leading-relaxed text-on-surface-variant">
            Consulta nuestra{" "}
            <Link
              href="/privacy"
              className="font-semibold text-primary underline underline-offset-2"
            >
              política de privacidad
            </Link>{" "}
            para más información sobre cómo tratamos tus datos.
          </p>
        </div>

        {/* Footer */}
        <div className="flex flex-wrap gap-2 border-t border-outline-variant/30 px-5 py-4 sm:flex-nowrap sm:px-6">
          <button
            type="button"
            onClick={onRejectAll}
            className="h-11 flex-1 rounded-lg border border-outline-variant/50 bg-surface-lowest text-sm font-semibold text-on-surface transition hover:bg-surface-container sm:flex-none sm:px-5"
          >
            Rechazar todo
          </button>
          <button
            type="button"
            onClick={() => onSave({ functional, analytics, advertising })}
            className="h-11 flex-1 rounded-lg border border-primary/50 bg-primary/5 text-sm font-semibold text-primary transition hover:bg-primary/10 sm:flex-none sm:px-5"
          >
            Guardar mi elección
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="h-11 flex-1 rounded-lg bg-primary text-sm font-bold text-on-primary shadow-soft transition hover:bg-primary/90 sm:flex-none sm:px-5"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryToggle({
  category,
  checked,
  onChange,
  disabled = false,
}: {
  category: CookieCategory;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  const meta = CATEGORY_META[category];
  return (
    <div className="border-b border-outline-variant/25 py-4 last:border-b-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-bold text-on-surface">
            {meta.label}
            {disabled && (
              <span className="rounded bg-surface-container px-1.5 py-0.5 text-[10px] font-semibold uppercase text-on-surface-variant">
                Siempre activas
              </span>
            )}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
            {meta.description}
          </p>
          <p className="mt-1 text-[11px] italic text-muted">{meta.example}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={meta.label}
          disabled={disabled}
          onClick={() => !disabled && onChange(!checked)}
          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
            checked ? "bg-primary" : "bg-surface-high"
          } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? "translate-x-[0.5px]" : "-translate-x-5"
            }`}
          />
        </button>
      </div>
    </div>
  );
}
