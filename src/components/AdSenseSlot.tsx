"use client";

import { useEffect, useRef, useState } from "react";
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
 *
 * Modo responsive por dispositivo (v3):
 *   - Cuando se pasan `mobileWidth`/`mobileHeight` (opcionalmente + `mobileSlot`),
 *     el componente decide en cliente qué variante mostrar usando `matchMedia`.
 *     Renderiza UN solo `<ins>` (el que toca) y hace UN solo `push({})`.
 *   - Antes usábamos dos hermanos con visibility gate — pero eso hacía que
 *     Google marcara el `<ins>` oculto como `unfilled`, contaminando métricas.
 *   - Si Google recomienda un slot ID distinto por formato: pasa `mobileSlot`.
 *     Si no, el mismo `slot` se reutiliza para ambos breakpoints.
 */

interface Props {
  /** Slot ID de AdSense (numérico como string). Se usa en desktop/tablet y
   *  como fallback en mobile si no se pasa `mobileSlot`. */
  slot: string;
  /** Ancho fijo (px) en desktop / tablet (breakpoint sm+). */
  width: number;
  /** Alto fijo (px) en desktop / tablet. Debe coincidir con el formato del slot. */
  height: number;
  /** Slot ID distinto para el ad unit mobile (recomendado por Google:
   *  un slot por formato para segmentar métricas y optimizar fill). Si no se
   *  pasa, se reutiliza `slot`. */
  mobileSlot?: string;
  /** Ancho para mobile (<sm, viewport <640px). Junto con `mobileHeight`
   *  activa el modo responsive. Si se omite, se usa `width` en todos los
   *  breakpoints. */
  mobileWidth?: number;
  /** Alto para mobile (<sm). Ver `mobileWidth`. */
  mobileHeight?: number;
  /** Formato de AdSense (auto/rectangle/horizontal/vertical). */
  format?: string;
  /** Responsivo — deja que AdSense elija dimensiones. */
  responsive?: boolean;
  className?: string;
  /**
   * Plan del vendedor cuya página se está renderizando. Si es PREMIUM el
   * slot se colapsa completamente (beneficio del plan).
   */
  sellerPlan?: string | null;
}

const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const MOBILE_BREAKPOINT_QUERY = "(max-width: 639px)"; // Tailwind <sm

type Variant = "mobile" | "desktop";

export default function AdSenseSlot({
  slot,
  width,
  height,
  mobileSlot,
  mobileWidth,
  mobileHeight,
  format = "auto",
  responsive = false,
  className = "",
  sellerPlan = null,
}: Props) {
  const insRef = useRef<HTMLModElement | null>(null);
  const hasMobileVariant =
    typeof mobileWidth === "number" && typeof mobileHeight === "number";

  // `null` durante SSR + primer render para evitar hydration mismatch. Tras
  // montar en cliente decidimos qué variante corresponde al viewport actual.
  const [variant, setVariant] = useState<Variant | null>(null);

  useEffect(() => {
    if (!hasMobileVariant) {
      setVariant("desktop");
      return;
    }
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    setVariant(mql.matches ? "mobile" : "desktop");
    // Si el usuario rota/redimensiona cruzando el breakpoint, el remount
    // del <ins> hace que se pida un nuevo ad para el formato correcto.
    const handler = (e: MediaQueryListEvent) =>
      setVariant(e.matches ? "mobile" : "desktop");
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [hasMobileVariant]);

  // Un solo push por <ins> montado. Se re-ejecuta si cambia la variante
  // (cross-breakpoint) porque React remonta el <ins> con nueva `key`.
  useEffect(() => {
    if (!ADSENSE_CLIENT || !slot || variant === null) return;
    if (sellerPlan === "PREMIUM") return;
    try {
      // @ts-expect-error - adsbygoogle inyectado por el script externo
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, [variant, slot, mobileSlot, sellerPlan]);

  if (sellerPlan === "PREMIUM") {
    return null;
  }

  // Sin env var (dev local): placeholder que reserva el espacio del
  // formato desktop (aprox correcto en la mayoría de layouts).
  if (!ADSENSE_CLIENT || !slot) {
    const phW = variant === "mobile" && hasMobileVariant ? mobileWidth! : width;
    const phH = variant === "mobile" && hasMobileVariant ? mobileHeight! : height;
    return <Placeholder width={phW} height={phH} className={className} />;
  }

  // SSR / pre-hydration: no renderizamos <ins> aún — evita que AdSense
  // intente procesar un elemento con display:none y lo marque unfilled.
  if (variant === null) {
    // Reserva de espacio para evitar CLS. Usamos el tamaño desktop como
    // default; la mayoría del tráfico entra pintado tras <200ms.
    const phW = hasMobileVariant ? mobileWidth! : width;
    const phH = hasMobileVariant ? mobileHeight! : height;
    return (
      <div
        className={className}
        style={{ width: phW, height: phH, maxWidth: "100%" }}
        aria-hidden="true"
      />
    );
  }

  const useMobile = variant === "mobile" && hasMobileVariant;
  const activeSlot = useMobile ? mobileSlot || slot : slot;
  const activeWidth = useMobile ? mobileWidth! : width;
  const activeHeight = useMobile ? mobileHeight! : height;

  return (
    <ins
      // `key` fuerza remount al cambiar de breakpoint → nuevo push limpio.
      key={variant}
      ref={insRef}
      className={`adsbygoogle block ${className}`}
      style={{ width: activeWidth, height: activeHeight }}
      data-ad-client={ADSENSE_CLIENT}
      data-ad-slot={activeSlot}
      data-ad-format={format}
      data-full-width-responsive={responsive ? "true" : "false"}
    />
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
