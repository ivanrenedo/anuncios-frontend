"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ShoppingBag,
  Star,
  Crown,
  Check,
  X,
  Zap,
  ArrowUpCircle,
  MessageCircle,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface PlanDef {
  key: "FREE" | "STAR" | "PREMIUM";
  label: string;
  price: string;
  period: string;
  accent: string;
  Icon: React.ElementType;
  description: string;
  features: { label: string; included: boolean }[];
}

const PLANS: PlanDef[] = [
  {
    key: "FREE",
    label: "Gratis",
    price: "0",
    period: "",
    accent: "#6B7280",
    Icon: ShoppingBag,
    description: "Para empezar a vender de forma sencilla",
    features: [
      { label: "Hasta 5 anuncios activos", included: true },
      { label: "Hasta 4 fotos por anuncio", included: true },
      { label: "Perfil publico basico", included: true },
      { label: "Contacto directo con compradores", included: true },
      { label: "Insignia de vendedor", included: false },
      { label: "Aparicion en escaparate de portada", included: false },
      { label: "Auto-bump de anuncios", included: false },
      { label: "Estadisticas de visitas", included: false },
    ],
  },
  {
    key: "STAR",
    label: "Estrella",
    price: "3.000",
    period: "XAF/mes",
    accent: "#F5A623",
    Icon: Star,
    description: "Para vendedores activos que quieren destacar",
    features: [
      { label: "Hasta 25 anuncios activos", included: true },
      { label: "Hasta 6 fotos por anuncio", included: true },
      { label: "Perfil publico completo", included: true },
      { label: "Contacto directo con compradores", included: true },
      { label: "Insignia Estrella", included: true },
      { label: "Aparicion ocasional en portada", included: true },
      { label: "1 auto-bump por semana", included: true },
      { label: "Estadisticas basicas", included: true },
    ],
  },
  {
    key: "PREMIUM",
    label: "Premium",
    price: "10.000",
    period: "XAF/mes",
    accent: "#7C3AED",
    Icon: Crown,
    description: "Para negocios y vendedores profesionales",
    features: [
      { label: "Anuncios ilimitados", included: true },
      { label: "Hasta 10 fotos por anuncio", included: true },
      { label: "Perfil de negocio", included: true },
      { label: "Contacto directo con compradores", included: true },
      { label: "Insignia Premium", included: true },
      { label: "Prioridad en escaparate de portada", included: true },
      { label: "Auto-bump diario", included: true },
      { label: "Estadisticas completas", included: true },
    ],
  },
];

const WHATSAPP_NUMBER = "240222626418";

function contactWhatsApp(plan: string) {
  const msg = encodeURIComponent(
    `Hola, me gustaria contratar el plan ${plan} en Bomell. Como puedo activarlo?`,
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

export default function PlansPage() {
  const { profile } = useProfile();
  const currentPlan = profile?.plan ?? "FREE";
  const effectivePlan = profile?.effectivePlan ?? currentPlan;
  const expiresAt = profile?.planExpiresAt
    ? new Date(profile.planExpiresAt)
    : null;

  const fmtDate = (d: Date) =>
    d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Planes y precios
        </h1>
      </div>

      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <Zap size={28} strokeWidth={1.5} className="text-primary" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Haz crecer tu negocio
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          Elige el plan que mejor se adapte a ti. Publicar es gratis — los
          planes te dan mas visibilidad, mas anuncios y herramientas para vender
          mas rapido.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isExpired =
            isCurrent && plan.key !== "FREE" && effectivePlan === "FREE";
          const isUpgrade =
            !isCurrent &&
            ((effectivePlan === "FREE" && plan.key !== "FREE") ||
              (effectivePlan === "STAR" && plan.key === "PREMIUM"));

          return (
            <div
              key={plan.key}
              className="relative flex flex-col rounded-2xl border bg-surface-lowest p-5 shadow-soft"
              style={{
                borderColor: isCurrent
                  ? plan.accent + "66"
                  : "var(--color-outline-variant-30)",
                borderWidth: isCurrent ? 2 : 1,
              }}
            >
              {/* Current badge */}
              {isCurrent && (
                <span
                  className="mb-3 inline-block self-start rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor:
                      (isExpired ? "var(--color-danger)" : plan.accent) + "18",
                    color: isExpired ? "var(--color-danger)" : plan.accent,
                  }}
                >
                  {isExpired ? "Plan expirado" : "Tu plan actual"}
                </span>
              )}

              {/* Icon + name */}
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-xl"
                  style={{ backgroundColor: plan.accent + "18" }}
                >
                  <plan.Icon
                    size={22}
                    strokeWidth={1.8}
                    style={{ color: plan.accent }}
                    fill={plan.key !== "FREE" ? plan.accent : "transparent"}
                  />
                </div>
                <div>
                  <p className="text-lg font-extrabold">{plan.label}</p>
                  <p className="text-xs text-on-surface-variant">
                    {plan.description}
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-4 flex items-baseline gap-1.5">
                {plan.key === "FREE" ? (
                  <span className="text-2xl font-extrabold">Gratis</span>
                ) : (
                  <>
                    <span className="text-2xl font-extrabold">
                      {plan.price}
                    </span>
                    <span className="text-sm text-on-surface-variant">
                      {plan.period}
                    </span>
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="mb-5 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5">
                    {f.included ? (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/15">
                        <Check
                          size={12}
                          strokeWidth={2.5}
                          className="text-emerald-500"
                        />
                      </span>
                    ) : (
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-outline-variant/20">
                        <X
                          size={12}
                          strokeWidth={2}
                          className="text-outline-variant"
                        />
                      </span>
                    )}
                    <span
                      className={`text-sm ${
                        f.included
                          ? "text-on-surface"
                          : "text-on-surface-variant/60"
                      }`}
                    >
                      {f.label}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isUpgrade && (
                <button
                  onClick={() => contactWhatsApp(plan.label)}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: plan.accent }}
                >
                  <MessageCircle size={16} strokeWidth={2} />
                  Contratar por WhatsApp
                </button>
              )}

              {isExpired && (
                <button
                  onClick={() => contactWhatsApp(plan.label)}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: plan.accent }}
                >
                  <MessageCircle size={16} strokeWidth={2} />
                  Renovar por WhatsApp
                </button>
              )}

              {isCurrent && plan.key !== "FREE" && (
                <p className="mt-2 text-center text-xs font-semibold text-on-surface-variant">
                  {isExpired && expiresAt
                    ? `Expiro el ${fmtDate(expiresAt)} — renovalo para recuperar tus ventajas`
                    : expiresAt
                      ? `Activo hasta el ${fmtDate(expiresAt)}`
                      : "Plan activo"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="mt-8 rounded-2xl bg-surface-container p-5">
        <h3 className="mb-4 text-base font-bold">Como funciona?</h3>
        <div className="space-y-3">
          {[
            'Elige tu plan y pulsa "Contratar por WhatsApp"',
            "Realiza el pago por transferencia bancaria o pago movil",
            "Envianos el justificante y activamos tu plan en minutos",
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {i + 1}
              </span>
              <span className="text-sm text-on-surface">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Highlight single ad */}
      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <ArrowUpCircle
            size={22}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-primary"
          />
          <div>
            <p className="text-sm font-bold text-on-surface">
              Destacar un anuncio
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
              No necesitas un plan? Destaca un anuncio individual por 1.000 XAF
              durante 7 dias. Aparecera en las primeras posiciones de su
              categoria.
            </p>
            <button
              onClick={() => {
                const msg = encodeURIComponent(
                  "Hola, quiero destacar un anuncio en Bomell durante 7 dias (1.000 XAF). Como procedo?",
                );
                window.open(
                  `https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`,
                  "_blank",
                );
              }}
              className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:opacity-80"
            >
              <MessageCircle size={13} strokeWidth={2} />
              Solicitar por WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
