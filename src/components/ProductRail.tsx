"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard, { ProductCardSkeleton } from "./ProductCard";
import type { Product } from "@/lib/types";

const DEFAULT_INTERVAL_MS = 4000;
// Umbral (px) para considerar que un arrastre ES un swipe (y suprimir el
// click resultante). Por debajo se trata como un click normal en la card.
const DRAG_THRESHOLD = 8;

export default function ProductRail({
  products,
  loading,
  autoplay = false,
  autoplayMs = DEFAULT_INTERVAL_MS,
}: {
  products: Product[];
  loading?: boolean;
  /**
   * Cuando es true el rail avanza solo cada `autoplayMs`, en pasos del ancho
   * real de una card + gap (medido en runtime), hasta el final; después
   * vuelve al inicio. Se pausa en hover / touch / mientras el usuario tiene
   * el pointer dentro para no forcejear con él.
   */
  autoplay?: boolean;
  autoplayMs?: number;
}) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Estado de flechas: se actualizan tras cada scroll para ocultar el prev
  // en el inicio y el next en el final, en lugar de dejar flechas "muertas".
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Paso natural de una card + gap (medido en runtime porque el tamaño
  // depende del breakpoint).
  const measurePitch = (track: HTMLElement) => {
    const first = track.querySelector<HTMLElement>(":scope > *");
    if (!first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap || "16") || 16;
    return first.getBoundingClientRect().width + gap;
  };

  const updateArrows = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanPrev(track.scrollLeft > 2);
    setCanNext(track.scrollLeft < maxScroll - 2);
  }, []);

  // Animación con setTimeout + easeOutCubic. Notas:
  //  - `scroll-behavior: smooth` nativo es no-op en Electron/algunos WebViews.
  //  - rAF se congela cuando la pestaña no es visible; setTimeout se clamp-ea
  //    a ~1s pero sigue disparando, así el autoplay no queda "muerto" al
  //    volver a la pestaña.
  //  - Llamamos a `updateArrows()` en cada frame y al terminar porque algunos
  //    entornos (Electron/embedded WebView) no emiten `scroll` sobre
  //    escrituras programáticas de `scrollLeft`, y sin eso las flechas se
  //    quedarían pegadas al estado inicial.
  const smoothScrollTo = useCallback(
    (track: HTMLElement, target: number, ms = 500) => {
      if (animRef.current !== null) clearTimeout(animRef.current);
      const start = track.scrollLeft;
      const delta = target - start;
      if (Math.abs(delta) < 1) {
        updateArrows();
        return;
      }
      const t0 = Date.now();
      const stepMs = 16;
      const step = () => {
        const p = Math.min(1, (Date.now() - t0) / ms);
        const eased = 1 - Math.pow(1 - p, 3);
        track.scrollLeft = start + delta * eased;
        updateArrows();
        if (p < 1) animRef.current = setTimeout(step, stepMs);
        else animRef.current = null;
      };
      step();
    },
    [updateArrows],
  );

  const scrollBy = useCallback(
    (dir: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;
      const pitch = measurePitch(track) || track.clientWidth * 0.8;
      const maxScroll = track.scrollWidth - track.clientWidth;
      const target = Math.max(
        0,
        Math.min(track.scrollLeft + dir * pitch, maxScroll),
      );
      smoothScrollTo(track, target);
    },
    [smoothScrollTo],
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    // Actualizamos las flechas cuando el usuario scrollea (a mano, autoplay
    // o al cambiar el tamaño del contenedor).
    updateArrows();
    const onScroll = () => updateArrows();
    track.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => updateArrows());
    ro.observe(track);
    return () => {
      track.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [updateArrows, products.length]);

  useEffect(() => {
    if (!autoplay || products.length < 2) return;

    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (pausedRef.current) return;
      const track = trackRef.current;
      if (!track) return;
      const pitch = measurePitch(track);
      if (pitch <= 0) return;
      const maxScroll = track.scrollWidth - track.clientWidth;
      if (maxScroll <= 0) return;
      const target = track.scrollLeft >= maxScroll - 4
        ? 0
        : Math.min(track.scrollLeft + pitch, maxScroll);
      smoothScrollTo(track, target);
    };

    const id = setInterval(tick, autoplayMs);
    return () => {
      cancelled = true;
      clearInterval(id);
      if (animRef.current !== null) clearTimeout(animRef.current);
    };
  }, [autoplay, autoplayMs, products.length, smoothScrollTo]);

  // ── Swipe con ratón (drag-to-scroll) ────────────────────────────────
  // Patrón "quiet drag" clásico: en `mousedown` capturamos posición y
  // enganchamos `mousemove`/`mouseup` en `document` (no en el track). Antes
  // usábamos `setPointerCapture` sobre el track, pero eso ROBABA los pointer
  // events de los <button> hijos (Next/Prev) — al hacer click en ellos no
  // pasaba nada y la página parecía "congelada".
  const [isDragging, setIsDragging] = useState(false);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // sólo botón izquierdo
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;

    const track = trackRef.current;
    if (!track) return;

    const startX = e.clientX;
    const startScroll = track.scrollLeft;
    let moved = false;

    e.preventDefault();
    if (animRef.current !== null) clearTimeout(animRef.current);

    const onMove = (m: MouseEvent) => {
      const dx = m.clientX - startX;
      if (!moved && Math.abs(dx) > DRAG_THRESHOLD) {
        moved = true;
        setIsDragging(true);
      }
      if (moved) {
        track.scrollLeft = startScroll - dx;
        updateArrows();
        m.preventDefault();
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      if (moved) {
        setIsDragging(false);
        const blockOnce = (c: MouseEvent) => {
          c.stopPropagation();
          c.preventDefault();
          document.removeEventListener("click", blockOnce, true);
        };
        document.addEventListener("click", blockOnce, true);
        // Si no llega ningún click en 150 ms (ej. el mouseup terminó lejos de
        // cualquier elemento clickable), retiramos el listener para no
        // interceptar el próximo click real (los botones Next/Prev).
        setTimeout(
          () => document.removeEventListener("click", blockOnce, true),
          150,
        );
      }
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const onPointerEnter = () => {
    pausedRef.current = true;
  };
  const onPointerLeave = () => {
    pausedRef.current = false;
  };

  const hasProducts = products.length > 0 || loading;
  if (!hasProducts) return null;

  return (
    <div className="group/rail relative">
      {/* Flecha prev — sólo desktop y sólo cuando hay hacia dónde ir */}
      {canPrev && (
        <button
          type="button"
          onClick={() => scrollBy(-1)}
          aria-label="Anterior"
          className="absolute left-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-outline-variant/40 bg-surface-lowest text-on-surface shadow-card transition hover:bg-surface-container sm:grid sm:opacity-0 sm:group-hover/rail:opacity-100"
        >
          <ChevronLeft size={20} strokeWidth={2} />
        </button>
      )}
      {canNext && (
        <button
          type="button"
          onClick={() => scrollBy(1)}
          aria-label="Siguiente"
          className="absolute right-1 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-outline-variant/40 bg-surface-lowest text-on-surface shadow-card transition hover:bg-surface-container sm:grid sm:opacity-0 sm:group-hover/rail:opacity-100"
        >
          <ChevronRight size={20} strokeWidth={2} />
        </button>
      )}

      <div
        ref={trackRef}
        className={`flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide sm:px-6 ${
          isDragging ? "cursor-grabbing select-none" : "cursor-grab"
        }`}
        onMouseDown={onMouseDown}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onTouchStart={onPointerEnter}
        onTouchEnd={onPointerLeave}
      >
        {loading && products.length === 0
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="w-40 shrink-0 sm:w-48">
                <ProductCardSkeleton />
              </div>
            ))
          : products.map((p) => (
              <div
                key={p.id}
                className="group rail w-60 shrink-0 sm:w-72 animate-fade-in overflow-hidden rounded-xl border border-outline-variant/30 bg-surface-lowest transition hover:border-outline-variant/60 hover:shadow-card"
              >
                <ProductCard product={p} />
              </div>
            ))}
      </div>
    </div>
  );
}
