"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Hook + store centralizado para el consentimiento de cookies.
 *
 *  - Persistimos en `localStorage` la decisión del usuario y su timestamp.
 *  - Empujamos el estado a Google Consent Mode v2 vía `gtag('consent', ...)`
 *    para que AdSense/GA4/Ads respeten la elección antes de disparar
 *    anuncios personalizados o analítica.
 *  - Usamos `useSyncExternalStore` para que cualquier componente montado
 *    (banner, modal de ajustes, footer) reciba updates instantáneos.
 *
 * Categorías:
 *  - `necessary`  → SIEMPRE true. Cookies de sesión, CSRF, tema, idioma.
 *  - `functional` → Preferencias no esenciales (búsquedas guardadas, etc.).
 *  - `analytics`  → GA4 / mediciones internas.
 *  - `advertising`→ AdSense y publicidad personalizada.
 */

export type CookieCategory =
  | "necessary"
  | "functional"
  | "analytics"
  | "advertising";

export interface CookieConsentState {
  necessary: true;
  functional: boolean;
  analytics: boolean;
  advertising: boolean;
}

export interface StoredConsent {
  /** Versión del schema: subimos si añadimos categorías nuevas para pedir
   *  re-consentimiento explícito. */
  version: 1;
  /** ISO string — cuándo se dio el consentimiento (útil para caducidad). */
  timestamp: string;
  categories: CookieConsentState;
}

const STORAGE_KEY = "bomelh_cookie_consent_v1";
const SCHEMA_VERSION = 1 as const;

const DEFAULT_STATE: CookieConsentState = {
  necessary: true,
  functional: false,
  analytics: false,
  advertising: false,
};

// ── Store singleton ─────────────────────────────────────────────────────────
// Notificamos a todos los subscribers cuando la decisión cambia, para que el
// banner desaparezca al aceptar/rechazar sin recargar y para propagar la
// nueva preferencia a Consent Mode al vuelo.
let cachedStored: StoredConsent | null | undefined = undefined;
const listeners = new Set<() => void>();

function read(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  if (cachedStored !== undefined) return cachedStored;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedStored = null;
      return null;
    }
    const parsed = JSON.parse(raw) as StoredConsent;
    // Version mismatch → tratar como no dado (le pediremos consentimiento
    // otra vez cuando el schema cambie).
    if (parsed?.version !== SCHEMA_VERSION) {
      cachedStored = null;
      return null;
    }
    cachedStored = {
      version: SCHEMA_VERSION,
      timestamp: parsed.timestamp,
      categories: { ...DEFAULT_STATE, ...parsed.categories, necessary: true },
    };
    return cachedStored;
  } catch {
    cachedStored = null;
    return null;
  }
}

function write(cats: CookieConsentState) {
  if (typeof window === "undefined") return;
  const payload: StoredConsent = {
    version: SCHEMA_VERSION,
    timestamp: new Date().toISOString(),
    categories: { ...cats, necessary: true },
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {}
  cachedStored = payload;
  syncConsentMode(cats);
  listeners.forEach((fn) => fn());
}

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ── Google Consent Mode v2 ─────────────────────────────────────────────────
// Convertimos las categorías internas a los "signals" que espera gtag().
// Google reconoce estos aunque el gtag no se haya cargado — las llamadas se
// encolan en `window.dataLayer` y se aplican en cuanto AdSense/GA se
// inicialicen.
function toGtagConsent(cats: CookieConsentState) {
  return {
    ad_storage: cats.advertising ? "granted" : "denied",
    ad_user_data: cats.advertising ? "granted" : "denied",
    ad_personalization: cats.advertising ? "granted" : "denied",
    analytics_storage: cats.analytics ? "granted" : "denied",
    functionality_storage: cats.functional ? "granted" : "denied",
    personalization_storage: cats.functional ? "granted" : "denied",
    security_storage: "granted",
  } as const;
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ensureGtag() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    // Definición estándar de gtag — encola llamadas en dataLayer hasta que
    // el script de Google se cargue y las procese.
    window.gtag = function gtag(...args: unknown[]) {
      (window.dataLayer as unknown[]).push(args);
    };
  }
}

/** Aplica los defaults (todo denegado) — se llama UNA vez al arrancar la app
 *  antes de que el script de AdSense/GA haga nada. */
export function initConsentDefaults() {
  ensureGtag();
  window.gtag!("consent", "default", {
    ...toGtagConsent(DEFAULT_STATE),
    wait_for_update: 500,
  });
  // Si el usuario ya ha decidido en una visita anterior, aplicamos su
  // preferencia inmediatamente.
  const stored = read();
  if (stored) {
    window.gtag!("consent", "update", toGtagConsent(stored.categories));
  }
}

function syncConsentMode(cats: CookieConsentState) {
  ensureGtag();
  window.gtag!("consent", "update", toGtagConsent(cats));
}

// ── API pública ─────────────────────────────────────────────────────────────

export function useCookieConsent() {
  const stored = useSyncExternalStore(
    subscribe,
    () => read(),
    () => null, // SSR: nada persistido
  );

  const acceptAll = useCallback(() => {
    write({
      necessary: true,
      functional: true,
      analytics: true,
      advertising: true,
    });
  }, []);

  const rejectAll = useCallback(() => {
    write({
      necessary: true,
      functional: false,
      analytics: false,
      advertising: false,
    });
  }, []);

  const saveCustom = useCallback(
    (cats: Partial<Omit<CookieConsentState, "necessary">>) => {
      const current = read()?.categories ?? DEFAULT_STATE;
      write({ ...current, ...cats, necessary: true });
    },
    [],
  );

  const reset = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    cachedStored = null;
    // Al resetear, volvemos a defaults (todo denegado) en Consent Mode.
    syncConsentMode(DEFAULT_STATE);
    listeners.forEach((fn) => fn());
  }, []);

  return {
    /** null si el usuario aún no ha decidido — el banner debe mostrarse. */
    consent: stored,
    hasDecided: stored !== null,
    categories: stored?.categories ?? DEFAULT_STATE,
    acceptAll,
    rejectAll,
    saveCustom,
    reset,
  };
}

/** Hook auxiliar para condicionar código en función de una categoría concreta.
 *  Ejemplo: `if (useHasConsent("advertising")) loadAdSenseScript()`. */
export function useHasConsent(category: CookieCategory): boolean {
  const { categories, hasDecided } = useCookieConsent();
  if (category === "necessary") return true;
  if (!hasDecided) return false;
  return categories[category] === true;
}

/** Bootstrap inicial — debe correr una vez, lo antes posible en el cliente.
 *  Lo llamamos desde <ConsentInitializer /> montado en el layout. */
export function bootstrapConsent() {
  if (typeof window === "undefined") return;
  initConsentDefaults();
}
