"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { HomeSection } from "@/hooks/useHomeSections";

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  cta: string;
  href: string;
  from: string;
  to: string;
  image?: string;
}

/** Convert a backend banner-type HomeSection into a Slide. */
function sectionToSlide(section: HomeSection): Slide {
  const config = section.config ?? {};
  return {
    id: section.id,
    title: section.title || "Oferta especial",
    subtitle: section.subtitle || "",
    cta: config.buttonLabel || "Ver mas",
    href: config.href || "/explore",
    from: config.from || "#006b5e",
    to: config.to || "#13c1ac",
    image: config.image || undefined,
  };
}

interface PromoCarouselProps {
  sections?: HomeSection[];
}

/**
 * Backend-driven banner carousel. Renders nothing when there are no
 * banner sections — no hardcoded placeholder content.
 */
export default function PromoCarousel({ sections }: PromoCarouselProps) {
  const bannerSections = sections?.filter((s) => s.type === "banner") ?? [];
  const slides: Slide[] = bannerSections.map(sectionToSlide);

  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(
    () => setI((v) => (v + 1) % Math.max(slides.length, 1)),
    [slides.length],
  );
  const prev = useCallback(
    () => setI((v) => (v - 1 + slides.length) % Math.max(slides.length, 1)),
    [slides.length],
  );

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next, slides.length]);

  if (slides.length === 0) return null;

  const s = slides[Math.min(i, slides.length - 1)];

  return (
    <div
      className="px-4 pt-4 sm:px-6"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="group relative overflow-hidden rounded-2xl transition-[background] duration-700"
        style={{
          backgroundImage: `linear-gradient(120deg, ${s.from}, ${s.to})`,
        }}
      >
        {/* Background image (only when the section provides one) */}
        {s.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={s.id}
            src={s.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-25 transition-opacity duration-700"
          />
        )}

        {/* Content */}
        <div className="relative flex flex-col gap-3 px-6 py-8 sm:px-10 sm:py-14">
          <h2 className="max-w-md whitespace-pre-line text-2xl font-extrabold leading-tight text-white sm:text-4xl">
            {s.title}
          </h2>
          {s.subtitle && (
            <p className="text-sm text-white/85 sm:text-base">{s.subtitle}</p>
          )}
          <Link
            href={s.href}
            className="mt-2 inline-flex w-fit rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-on-surface shadow-soft transition hover:bg-white/90"
          >
            {s.cta}
          </Link>
        </div>

        {/* Left/Right arrows (desktop hover) */}
        {slides.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Anterior"
              className="absolute left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 group-hover:grid"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              aria-label="Siguiente"
              className="absolute right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur transition hover:bg-white/40 group-hover:grid"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Dots */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 left-6 flex gap-1.5 sm:left-10">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === i ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
