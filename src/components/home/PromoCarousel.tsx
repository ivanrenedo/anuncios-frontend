"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { resolveImage } from "@/lib/config";
import type { HomeSection } from "@/hooks/useHomeSections";

/** Shape de un slide tal y como lo devuelve el panel admin (`section.config.slides`). */
interface Slide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  buttonLabel: string;
  buttonTextColor: string;
  image: string;
  linkType?: "none" | "product" | "category" | "url";
  linkValue?: string;
}

const AUTOPLAY_MS = 2000;

interface PromoCarouselProps {
  /** Múltiples secciones tipo `banner`. Cada una se renderiza como su propio
   *  carrusel con los slides que trae `section.config.slides`. */
  sections?: HomeSection[];
  /** Callback opcional para que el padre registre `click` cuando el usuario
   *  interactúa con un slide (impresión ya se hace a nivel de sección). */
  onSlidePress?: (sectionId: string) => void;
}

/**
 * Banner controlado desde el panel admin. Réplica del PromoCarousel móvil:
 * scroll horizontal con snap por slide, autoplay pausable y navegación a
 * producto / categoría / URL según `linkType`. NO inventa contenido — si
 * la sección no trae slides, no renderiza.
 */
export default function PromoCarousel({ sections, onSlidePress }: PromoCarouselProps) {
  const banners = (sections ?? []).filter((s) => s.type === "banner");
  if (banners.length === 0) return null;

  return (
    <div className="space-y-6">
      {banners.map((section) => {
        const slides = (section.config?.slides as Slide[] | undefined) ?? [];
        if (slides.length === 0) return null;
        return (
          <BannerCarousel
            key={section.id}
            slides={slides}
            onSlidePress={() => onSlidePress?.(section.id)}
          />
        );
      })}
    </div>
  );
}

function BannerCarousel({
  slides,
  onSlidePress,
}: {
  slides: Slide[];
  onSlidePress?: () => void;
}) {
  const router = useRouter();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(0);

  // Animación de scroll horizontal con setTimeout + easeOutCubic. Notas:
  //  - `scroll-behavior: smooth` nativo (CSS o scrollTo) es no-op en algunos
  //    runtimes embebidos (Electron/WebViews) — animamos a mano.
  //  - rAF se congela cuando la pestaña no es visible; setTimeout se clamp-ea
  //    a ~1s en background pero sigue disparando, así el autoplay no se rompe
  //    al volver a la pestaña.
  //  - `scroll-snap-type: mandatory` rechaza escrituras intermedias porque
  //    no caen sobre snap points; deshabilitamos el snap durante la animación
  //    y lo restauramos al terminar (el usuario sigue notando snap al deslizar).
  const smoothScrollTo = (track: HTMLElement, target: number, ms = 500) => {
    if (animRef.current !== null) clearTimeout(animRef.current);
    const start = track.scrollLeft;
    const delta = target - start;
    if (Math.abs(delta) < 1) return;
    const prevSnap = track.style.scrollSnapType;
    track.style.scrollSnapType = "none";
    const t0 = Date.now();
    const stepMs = 16;
    const step = () => {
      const p = Math.min(1, (Date.now() - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      track.scrollLeft = start + delta * eased;
      if (p < 1) {
        animRef.current = setTimeout(step, stepMs);
      } else {
        animRef.current = null;
        track.style.scrollSnapType = prevSnap;
      }
    };
    step();
  };

  // Autoplay: cada `AUTOPLAY_MS` avanza un slide; al final vuelve al inicio.
  // Se pausa mientras el pointer está dentro (hover / touch).
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => {
      if (pausedRef.current) return;
      const track = trackRef.current;
      if (!track) return;
      const first = track.querySelector<HTMLElement>(":scope > *");
      if (!first) return;
      const pitch = first.getBoundingClientRect().width + 16; // gap = 16px
      const max = track.scrollWidth - track.clientWidth;
      if (max <= 0) return;
      // Comprobamos la posición ACTUAL: con slides a w-full, pitch ≈ max, así
      // que preguntar por next siempre desborda y el carrusel se quedaba en 0.
      const target = track.scrollLeft >= max - 4
        ? 0
        : Math.min(track.scrollLeft + pitch, max);
      smoothScrollTo(track, target);
    }, AUTOPLAY_MS);
    return () => {
      clearInterval(id);
      if (animRef.current !== null) clearTimeout(animRef.current);
    };
  }, [slides.length]);

  // Sincroniza el dot activo con el scroll manual (o del autoplay).
  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.querySelector<HTMLElement>(":scope > *");
    if (!first) return;
    const pitch = first.getBoundingClientRect().width + 16;
    const i = Math.round(track.scrollLeft / pitch);
    if (i !== active) setActive(Math.max(0, Math.min(slides.length - 1, i)));
  };

  const handleSlidePress = (slide: Slide) => {
    const value = slide.linkValue?.trim();
    if (!value || slide.linkType === "none" || !slide.linkType) return;
    onSlidePress?.();
    switch (slide.linkType) {
      case "product":
        router.push(`/product/${value}`);
        break;
      case "category":
        router.push(`/explore?filterCat=${encodeURIComponent(value)}`);
        break;
      case "url":
        window.open(value, "_blank", "noopener,noreferrer");
        break;
    }
  };

  return (
    <div className="px-0">
      <div
        ref={trackRef}
        onScroll={onScroll}
        onPointerEnter={() => (pausedRef.current = true)}
        onPointerLeave={() => (pausedRef.current = false)}
        onTouchStart={() => (pausedRef.current = true)}
        onTouchEnd={() => (pausedRef.current = false)}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scrollbar-hide"
      >
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="relative h-56 w-full shrink-0 snap-center overflow-hidden rounded-2xl bg-[#0d0f12] sm:h-64"
          >
            {slide.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolveImage(slide.image)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* Overlay para que el texto sea legible sobre la imagen. */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div className="relative flex h-full flex-col justify-center gap-2 p-6 sm:p-8">
              {slide.badge && (
                <span
                  className="inline-flex w-fit rounded px-2 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white"
                  style={{ backgroundColor: slide.badgeColor }}
                >
                  {slide.badge}
                </span>
              )}
              <h2 className="max-w-md text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                {slide.title}
              </h2>
              {slide.subtitle && (
                <p className="max-w-md text-sm text-white/90 sm:text-base">
                  {slide.subtitle}
                </p>
              )}
              {slide.buttonLabel && slide.buttonLabel.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleSlidePress(slide)}
                  className="mt-1 w-fit rounded-xl bg-white px-5 py-2 text-sm font-semibold shadow-soft transition hover:bg-white/90"
                  style={{ color: slide.buttonTextColor || "#0d0f12" }}
                >
                  {slide.buttonLabel}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Dots — el activo se agranda como en móvil. */}
      {slides.length > 1 && (
        <div className="mt-3.5 flex h-2 items-center justify-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                const track = trackRef.current;
                if (!track) return;
                const first = track.querySelector<HTMLElement>(":scope > *");
                if (!first) return;
                const pitch = first.getBoundingClientRect().width + 16;
                track.scrollTo({ left: i * pitch, behavior: "smooth" });
              }}
              aria-label={`Ir al slide ${i + 1}${i === active ? ", activo" : ""}`}
              className={`h-1.5 rounded-full transition-all ${
                i === active
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-outline-variant/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
