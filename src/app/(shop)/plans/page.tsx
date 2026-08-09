"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ShoppingBag,
  ShieldCheck,
  Star,
  Crown,
  Check,
  X,
  Zap,
  ArrowUpCircle,
  MessageCircle,
} from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

type PlanKey = "FREE" | "BASIC" | "STAR" | "PREMIUM";

interface PlanDef {
  key: PlanKey;
  label: string;
  /** Monthly price in XAF, 0 for FREE. */
  monthlyPrice: number;
  accent: string;
  Icon: React.ElementType;
  description: string;
  features: { label: string; included: boolean }[];
}

// v2 catalogue — kept in one place so the copy stays aligned with the briefing.
// Numeric prices are formatted at render time; annual view divides by 12 and
// applies the −25 % yearly discount from PLAN_LIMITS/DISCOUNT_TIERS.
const PLANS: PlanDef[] = [
  {
    key: "FREE",
    label: "Gratis",
    monthlyPrice: 0,
    accent: "#6B7280",
    Icon: ShoppingBag,
    description: "Para empezar a vender sin coste",
    features: [
      { label: "Hasta 5 anuncios activos", included: true },
      { label: "Hasta 4 fotos por anuncio", included: true },
      { label: "Contacto directo con compradores", included: true },
      { label: "Seguir vendedores + notificaciones", included: true },
      { label: "Insignia de plan", included: false },
      { label: "Destacados incluidos", included: false },
      { label: "Auto-bump", included: false },
      { label: "Estadísticas", included: false },
    ],
  },
  {
    key: "BASIC",
    label: "Básico",
    monthlyPrice: 3_000,
    accent: "#0EA5E9",
    Icon: ShieldCheck,
    description: "Sube el límite y consigue tu primer destacado",
    features: [
      { label: "Hasta 15 anuncios activos", included: true },
      { label: "Hasta 4 fotos por anuncio", included: true },
      { label: "1 destacado incluido al mes", included: true },
      { label: "Vistas + favoritos", included: true },
      { label: "Insignia de plan", included: false },
      { label: "Anuncios fijados en perfil", included: false },
      { label: "Auto-bump", included: false },
      { label: "Chip \"Rebajado hoy\"", included: false },
    ],
  },
  {
    key: "STAR",
    label: "Estrella",
    monthlyPrice: 12_000,
    accent: "#F5A623",
    Icon: Star,
    description: "Para vendedores activos que quieren destacar",
    features: [
      { label: "Hasta 30 anuncios activos", included: true },
      { label: "Hasta 6 fotos por anuncio", included: true },
      { label: "3 destacados incluidos al mes", included: true },
      { label: "4 anuncios fijados en tu perfil", included: true },
      { label: "Auto-bump semanal (pool 3)", included: true },
      { label: "Chip \"Rebajado hoy\" 48 h", included: true },
      { label: "WhatsApp personalizado + contactos", included: true },
      { label: "Insignia ⭐", included: true },
    ],
  },
  {
    key: "PREMIUM",
    label: "Premium",
    monthlyPrice: 35_000,
    accent: "#7C3AED",
    Icon: Crown,
    description: "Para negocios verificados con tienda propia",
    features: [
      { label: "Hasta 100 anuncios activos", included: true },
      { label: "8 destacados incluidos al mes (−50 % extra)", included: true },
      { label: "10 anuncios fijados en tu perfil", included: true },
      { label: "Auto-bump diario (pool 5)", included: true },
      { label: "Tienda propia /tienda/tu-slug", included: true },
      { label: "Carrusel \"Tiendas Premium\" en portada", included: true },
      { label: "Sin anuncios de terceros en tu ficha", included: true },
      { label: "Verificación 👑 + analytics completo", included: true },
    ],
  },
];

const WHATSAPP_NUMBER = "240222626418";
const YEARLY_DISCOUNT = 0.25;

function contactWhatsApp(plan: string, cycle: "MONTHLY" | "YEARLY") {
  const cycleLabel = cycle === "YEARLY" ? "anual" : "mensual";
  const msg = encodeURIComponent(
    `Hola, quiero contratar el plan ${plan} (${cycleLabel}) en Bomelh. ¿Cómo lo activo?`,
  );
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
}

function fmtXaf(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

export default function PlansPage() {
  const { profile } = useProfile();
  const [cycle, setCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/profile"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface-container text-on-surface transition hover:bg-surface-container/80"
        >
          <ArrowLeft size={18} strokeWidth={2} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">
          Planes y precios
        </h1>
      </div>

      {/* Hero */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10">
          <Zap size={28} strokeWidth={1.5} className="text-primary" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight sm:text-2xl">
          Haz crecer tu negocio
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">
          Elige el plan que mejor se adapte. Publicar es gratis — los planes te
          dan más anuncios, más visibilidad y ventajas exclusivas.
        </p>
      </div>

      {/* Monthly / yearly toggle. The −25 % yearly discount comes from
          DISCOUNT_TIERS on the backend; the same fraction is shown here so the
          card price and the WhatsApp conversation match. */}
      <div className="mb-8 flex justify-center">
        <div
          role="tablist"
          aria-label="Ciclo de facturación"
          className="inline-flex rounded-full bg-surface-container p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={cycle === "MONTHLY"}
            onClick={() => setCycle("MONTHLY")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              cycle === "MONTHLY"
                ? "bg-primary text-on-primary shadow"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Mensual
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={cycle === "YEARLY"}
            onClick={() => setCycle("YEARLY")}
            className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${
              cycle === "YEARLY"
                ? "bg-primary text-on-primary shadow"
                : "text-on-surface-variant hover:text-on-surface"
            }`}
          >
            Anual
            <span
              className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${
                cycle === "YEARLY"
                  ? "bg-white/25 text-white"
                  : "bg-emerald-500/15 text-emerald-500"
              }`}
            >
              −25 %
            </span>
          </button>
        </div>
      </div>

      {/* 4-column grid. Collapses to 2×2 on tablet and single column on mobile. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.key;
          const isExpired =
            isCurrent && plan.key !== "FREE" && effectivePlan === "FREE";
          const isUpgrade =
            !isCurrent &&
            plan.key !== "FREE" &&
            planRank(plan.key) > planRank(effectivePlan);

          const yearlyPrice = Math.round(
            plan.monthlyPrice * 12 * (1 - YEARLY_DISCOUNT),
          );
          const displayedPrice =
            cycle === "YEARLY" ? yearlyPrice : plan.monthlyPrice;
          const priceSuffix =
            plan.monthlyPrice === 0
              ? ""
              : cycle === "YEARLY"
                ? "XAF/año"
                : "XAF/mes";
          const highlight = plan.key === "PREMIUM";

          return (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border bg-surface-lowest p-5 shadow-soft ${
                highlight ? "ring-2 ring-primary/25" : ""
              }`}
              style={{
                borderColor: isCurrent
                  ? plan.accent + "66"
                  : "var(--color-outline-variant-30)",
                borderWidth: isCurrent ? 2 : 1,
              }}
            >
              {highlight && (
                <span className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-on-primary shadow">
                  Recomendado
                </span>
              )}

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

              <div className="mb-4 flex items-center gap-3">
                <div
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ backgroundColor: plan.accent + "18" }}
                >
                  <plan.Icon
                    size={20}
                    strokeWidth={1.8}
                    style={{ color: plan.accent }}
                    fill={plan.key === "PREMIUM" ? plan.accent : "transparent"}
                  />
                </div>
                <div>
                  <p className="text-lg font-extrabold leading-tight">
                    {plan.label}
                  </p>
                  <p className="text-[11px] leading-snug text-on-surface-variant">
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                {plan.monthlyPrice === 0 ? (
                  <span className="text-2xl font-extrabold">Gratis</span>
                ) : (
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-extrabold">
                      {fmtXaf(displayedPrice)}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {priceSuffix}
                    </span>
                  </div>
                )}
                {plan.monthlyPrice > 0 && cycle === "YEARLY" && (
                  <p className="mt-1 text-[11px] text-on-surface-variant">
                    Equivale a{" "}
                    <strong>
                      {fmtXaf(Math.round(yearlyPrice / 12))} XAF/mes
                    </strong>
                    .
                  </p>
                )}
              </div>

              <ul className="mb-5 flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-start gap-2">
                    {f.included ? (
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/15">
                        <Check
                          size={10}
                          strokeWidth={2.5}
                          className="text-emerald-500"
                        />
                      </span>
                    ) : (
                      <span className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-outline-variant/20">
                        <X
                          size={10}
                          strokeWidth={2}
                          className="text-outline-variant"
                        />
                      </span>
                    )}
                    <span
                      className={`text-xs leading-snug ${
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

              {(isUpgrade || isExpired) && (
                <button
                  onClick={() => contactWhatsApp(plan.label, cycle)}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: plan.accent }}
                >
                  <MessageCircle size={16} strokeWidth={2} />
                  {isExpired ? "Renovar por WhatsApp" : "Contratar por WhatsApp"}
                </button>
              )}

              {isCurrent && plan.key !== "FREE" && (
                <p className="mt-1 text-center text-[11px] font-semibold text-on-surface-variant">
                  {isExpired && expiresAt
                    ? `Expiró el ${fmtDate(expiresAt)}`
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
        <h3 className="mb-4 text-base font-bold">¿Cómo funciona?</h3>
        <div className="space-y-3">
          {[
            "Elige tu plan y pulsa \"Contratar por WhatsApp\"",
            "Realiza el pago por transferencia bancaria o pago móvil",
            "Envíanos el justificante y activamos tu plan en minutos",
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

      {/* Individual boost purchase — still available to any plan. Copy reflects
          the three v2 durations from BOOST_PRICES. */}
      <div className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <ArrowUpCircle
            size={22}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0 text-primary"
          />
          <div>
            <p className="text-sm font-bold text-on-surface">
              Destacar un anuncio suelto
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-on-surface-variant">
              ¿No quieres un plan todavía? Destaca un anuncio individual: 1.000
              XAF por 3 días, 2.000 XAF por 7 días o 5.000 XAF por 30 días.
              Aparecerá en las primeras posiciones de su categoría.
            </p>
            <button
              onClick={() => {
                const msg = encodeURIComponent(
                  "Hola, quiero destacar un anuncio en Bomelh. ¿Cómo procedo?",
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

/** Rank ladder used to decide when a plan is an upgrade vs a lateral move. */
function planRank(plan: string): number {
  return { FREE: 0, BASIC: 1, STAR: 2, PREMIUM: 3 }[plan] ?? 0;
}
