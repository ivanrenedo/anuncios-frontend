"use client";

import { useEffect, useRef } from "react";
import { Megaphone } from "lucide-react";
import { useHasConsent } from "@/hooks/useCookieConsent";

/**
 * Slot de Google AdSense que respeta el consentimiento del usuario.
 *
 * - Sin consentimiento de publicidad → renderiza un placeholder neutro
 *   (mismas dimensiones para no causar Cumulative Layout Shift al
 *   cambiar de estado).
 * - Con consentimiento y `client` + `slot` configurados → inyecta la
 *   etiqueta `<ins class="adsbygoogle">` y llama a `adsbygoogle.push({})`.
 * - El script de AdSense NO se carga en el HTML por defecto; se carga
 *   dinámicamente aquí sólo si hace falta y el usuario ha consentido.
 *
 * Variables de entorno esperadas:
 *  - `NEXT_PUBLIC_ADSENSE_CLIENT`  (obligatoria; formato `ca-pub-XXXXXX`)
 *  - Slot id se pasa por prop (`slot`) para cada emplazamiento.
 */

interface Props {
  /** Slot ID de AdSense (numérico como string). */
  slot: string;
  /** Ancho fijo (px) para reservar espacio antes de que cargue el anuncio. */
  width: number;
  /** Alto fijo (px). Debe coincidir con el formato del slot. */
  height: number;
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
const SCRIPT_URL = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
let scriptLoaded = false;

function loadAdSenseScript() {
  if (scriptLoaded) return;
  if (typeof window === "undefined") return;
  if (!ADSENSE_CLIENT) return;
  scriptLoaded = true;
  const s = document.createElement("script");
  s.async = true;
  s.crossOrigin = "anonymous";
  s.src = `${SCRIPT_URL}?client=${encodeURIComponent(ADSENSE_CLIENT)}`;
  document.head.appendChild(s);
}

export default function AdSenseSlot({
  slot,
  width,
  height,
  format = "auto",
  responsive = false,
  className = "",
  sellerPlan = null,
}: Props) {
  const canShowAds = useHasConsent("advertising");
  const insRef = useRef<HTMLModElement | null>(null);

  // Premium plan opts the seller's pages out of third-party ads entirely.
  // Return null (not a placeholder) so the layout collapses to give the
  // Premium storefront its clean, ad-free look.
  if (sellerPlan === "PREMIUM") {
    return null;
  }

  useEffect(() => {
    if (!canShowAds) return;
    if (!ADSENSE_CLIENT) return;
    loadAdSenseScript();
    // Empujamos el push tras un tick para asegurar que `adsbygoogle` está en
    // window (el script async encola llamadas hasta cargar).
    try {
      // @ts-expect-error - adsbygoogle inyectado por el script externo
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [canShowAds, slot]);

  // Placeholder cuando no hay consentimiento — mantiene reserva de espacio
  // (evita CLS) sin cargar cookies de terceros.
  if (!canShowAds || !ADSENSE_CLIENT) {
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

  return (
    <ins
      ref={insRef}
      className={`adsbygoogle ${className}`}
      style={{ display: "block", width, height }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={slot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
  );
}
