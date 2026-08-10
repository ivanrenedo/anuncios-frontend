"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  /** Full-size URLs to display. */
  images: string[];
  /** Index of the currently shown image; the caller controls navigation. */
  index: number;
  /** Called when the viewer should close (button, ESC, backdrop click). */
  onClose: () => void;
  /** Optional handlers for the arrow buttons; omit to hide arrows. */
  onPrev?: () => void;
  onNext?: () => void;
}

/**
 * Minimal fullscreen image viewer. Fixed overlay, dark background, one image
 * at a time with optional prev/next arrows and a close button. Supports ESC
 * and arrow keys for keyboard users. No external dependency — kept small on
 * purpose so bundle stays lean.
 */
export default function ImageLightbox({
  images,
  index,
  onClose,
  onPrev,
  onNext,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && onPrev) onPrev();
      else if (e.key === "ArrowRight" && onNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    // Prevent body scroll while open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  const src = images[index];
  if (!src) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
      >
        <X size={20} strokeWidth={2.2} />
      </button>

      {onPrev && images.length > 1 && (
        <button
          type="button"
          aria-label="Anterior"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <ChevronLeft size={22} />
        </button>
      )}
      {onNext && images.length > 1 && (
        <button
          type="button"
          aria-label="Siguiente"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
        >
          <ChevronRight size={22} />
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
      />

      {images.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}
