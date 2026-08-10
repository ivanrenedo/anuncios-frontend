"use client";

import { useEffect } from "react";
import { ShieldCheck, Banknote, MapPin, ScanSearch, Phone, X } from "lucide-react";

export type SafetyModalMode = "tips" | "whatsapp" | "call";

interface Props {
  open: boolean;
  mode: SafetyModalMode;
  onClose: () => void;
  phoneNumber?: string;
  whatsappNumber?: string;
  whatsappMessage?: string;
}

function WhatsAppSvg({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.978-1.207zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
    </svg>
  );
}

const tips = [
  {
    icon: Banknote,
    title: "Solo pago en persona",
    desc: "No pagues por adelantado ni hagas transferencias previas a la entrega.",
  },
  {
    icon: MapPin,
    title: "Reuniones seguras",
    desc: "Elige lugares públicos y concurridos para hacer el intercambio.",
  },
  {
    icon: ScanSearch,
    title: "Inspecciona el producto",
    desc: "Verifica el estado y el funcionamiento del artículo antes de pagar.",
  },
];

export default function SafetyModal({
  open,
  mode,
  onClose,
  phoneNumber,
  whatsappNumber,
  whatsappMessage,
}: Props) {
  // Lock scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleContinue = () => {
    onClose();
    if (mode === "whatsapp" && whatsappNumber) {
      const url = whatsappMessage
        ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`
        : `https://wa.me/${whatsappNumber}`;
      window.open(url, "_blank");
    } else if (mode === "call" && phoneNumber) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  const ctaLabel =
    mode === "whatsapp"
      ? "Entendido, abrir WhatsApp"
      : mode === "call"
      ? "Entendido, llamar ahora"
      : "Entendido";

  const ctaIcon =
    mode === "whatsapp" ? (
      <WhatsAppSvg />
    ) : mode === "call" ? (
      <Phone size={18} strokeWidth={2} />
    ) : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 sm:items-center animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-t-3xl bg-surface p-6 pb-8 shadow-2xl sm:rounded-3xl sm:p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center gap-2 pb-6 text-center">
          <div className="mb-1 grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck size={32} strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl">
            Consejos de Seguridad
          </h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">
            Protege tu dinero y tu seguridad en transacciones P2P.
          </p>
        </div>

        {/* Tips */}
        <div className="flex flex-col gap-5 pb-6">
          {tips.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-surface-container text-primary">
                <Icon size={22} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-bold text-on-surface">{title}</p>
                <p className="mt-0.5 text-xs leading-5 text-on-surface-variant">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2.5 rounded-full bg-primary-container px-6 py-4 text-base font-bold text-on-primary-container shadow-soft transition hover:opacity-90"
          >
            {ctaIcon}
            {ctaLabel}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-primary transition hover:opacity-80"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
