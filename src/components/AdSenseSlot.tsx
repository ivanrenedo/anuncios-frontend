"use client";

import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";

/**
 * Slot de Google AdSense.
 *
 * El script `adsbygoogle.js` se carga UNA vez en `<head>` desde
 * `app/layout.tsx` (via `NEXT_PUBLIC_ADSENSE_CLIENT`). La gestión de
 * personalización se delega a Google Consent Mode v2 (también inicializado
 * en el layout):
 *   - Sin consent → Google sirve anuncios NO personalizados (NPA).
 *   - Con consent → anuncios personalizados normales.
 * Esto es lo recomendado por Google para maximizar aprobación del sitio y
 * fill-rate mientras se mantiene el cumplimiento GDPR.
 *
 * Este componente sólo se encarga de:
 *   - Renderizar `<ins class="adsbygoogle">` con `data-ad-client`/`slot`.
 *   - Llamar `adsbygoogle.push({})` para pedir un impresión.
 *   - Colapsar el slot en vendedores PREMIUM (beneficio del plan).
 *   - Placeholder cuando falta la env var (dev local).
 *
 * v2 Fase 12 — soporte responsive por dispositivo:
 *   - Si se pasa `mobileWidth`/`mobileHeight`, el slot renderiza a esas
 *     dimensiones en <sm (mobile) y a `width`/`height` en ≥sm (tablet+desktop).
 *   - Standard IAB sizes: 320×50 para mobile banner, 728×90 para leaderboard.
 *   - Implementación: 2 elementos hermanos con visibility gate (Tailwind
 *     `hidden sm:*`) — AdSense no sirve anuncios en elementos con
 *     `display: none`, así que no hay doble billing.
 */

interface Props {
  /** Slot ID de AdSense (numérico como string). */
  slot: string;
  /** Ancho fijo (px) en desktop / tablet (breakpoint sm+). */
  width: number;
  /** Alto fijo (px) en desktop / tablet. Debe coincidir con el formato del slot. */
  height: number;
  /**
   * v2 Fase 12 — ancho para mobile (<sm, viewport <640px).
   * Cuando ambos `mobileWidth` y `mobileHeight` se pasan, el componente
   * renderiza el tamaño mobile en <sm y el tamaño desktop en ≥sm.
   * Si se omite, se usa `width` en todos los breakpoints (comportamiento
   * legacy pre-v2).
   */
  mobileWidth?: number;
  /** Alto para mobile (<sm). Ver `mobileWidth`. */
  mobileHeight?: number;
  /** Formato de AdSense (auto/rectangle/horizontal/vertical). */
  format?: string;
  /** Responsivo — deja que AdSense elija dimensiones. */
  responsive?: boolean;
  className?: string;
  /**
   * v2 (Fase 6b.3). Plan del vendedor cuya página se está renderizando. Si es
   * PREMIUM, el slot se colapsa completamente (no placeholder, no ad) — un
   * beneficio del plan es "Sin anuncios de terceros en tu ficha/tienda".
   * Para páginas que no son de un vendedor concreto (home, categorías,
   * búsqueda), no se pasa y el slot renderiza normalmente.
   */
  sellerPlan?: string | null;
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";

export default function AdSenseSlot({
  slot,
  width,
  height,
  mobileWidth,
  mobileHeight,
  format = "auto",
  responsive = false,
  className = "",
  sellerPlan = null,
}: Props) {
  const insDesktopRef = useRef<HTMLModElement | null>(null);
  const insMobileRef = useRef<HTMLModElement | null>(null);
  const hasMobileVariant =
    typeof mobileWidth === "number" && typeof mobileHeight === "number";

  // Un push por cada <ins> renderizado; AdSense ignora los que estén con
  // `display: none` (variante mobile/desktop oculta por Tailwind).
  useEffect(() => {
    if (!ADSENSE_CLIENT) return;
    if (sellerPlan === "PREMIUM") return;
    try {
      // @ts-expect-error - adsbygoogle inyectado por el script externo
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      if (hasMobileVariant) {
        // @ts-expect-error - segundo push para el <ins> hermano
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch {}
  }, [slot, sellerPlan, hasMobileVariant]);

  // Premium plan opts the seller's pages out of third-party ads entirely.
  if (sellerPlan === "PREMIUM") {
    return null;
  }

  // Placeholder sólo cuando falta la env var (dev local sin AdSense).
  if (!ADSENSE_CLIENT) {
    return (
      <>
        {hasMobileVariant && (
          <Placeholder
            width={mobileWidth!}
            height={mobileHeight!}
            className={`sm:hidden ${className}`}
          />
        )}
        <Placeholder
          width={width}
          height={height}
          className={`${hasMobileVariant ? "hidden sm:flex" : ""} ${className}`}
        />
      </>
    );
  }

  return (
    <>
      {hasMobileVariant && (
        <ins
          ref={insMobileRef}
          className={`adsbygoogle sm:hidden ${className}`}
          style={{ width: mobileWidth, height: mobileHeight }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive ? "true" : "false"}
        />
      )}
      <ins
        ref={insDesktopRef}
        className={`adsbygoogle ${hasMobileVariant ? "hidden sm:block" : ""} ${className}`}
        style={{ width, height }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </>
  );
}

function Placeholder({
  width,
  height,
  className,
}: {
  width: number;
  height: number;
  className: string;
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border border-dashed border-outline-variant/50 bg-surface-container/40 text-on-surface-variant/70 ${className}`}
      style={{ width, height, maxWidth: "100%" }}
      aria-label="Espacio publicitario"
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <Megaphone size={20} className="opacity-60" strokeWidth={1.6} />
        <p className="text-[11px] font-semibold uppercase tracking-wider">
          Publicidad
        </p>
      </div>
    </div>
  );
}
