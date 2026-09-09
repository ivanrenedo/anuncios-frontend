"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import {
  AlertTriangle,
  CalendarClock,
  Crown,
  Gift,
  Image as ImageIcon,
  LayoutList,
  Loader2,
  Pin,
  BarChart3,
  Zap,
} from "lucide-react";
import { ADMIN_PLAN_PROMO } from "@/graphql/queries";
import { UPDATE_PLAN_PROMO } from "@/graphql/mutations";
import Spinner from "@/components/Spinner";
import Badge from "@/components/admin/Badge";
import { getErrorMessage } from "@/lib/errors";
import { useAbilities } from "@/hooks/useAbilities";

/**
 * Espejo de backend/src/common/plan-limits.ts. Solo alimenta la vista previa
 * "qué gana un vendedor Gratis"; el servidor sigue siendo la única autoridad.
 * Si cambian los límites allí, actualiza esta tabla.
 */
const PLAN_LIMITS: Record<
  string,
  {
    maxActiveProducts: number;
    maxImagesPerProduct: number;
    pinnedProducts: number;
    autoBumpSlots: number;
    autoBumpCadence: string | null;
    includedBoostsPerMonth: number;
  }
> = {
  FREE: {
    maxActiveProducts: 5,
    maxImagesPerProduct: 4,
    pinnedProducts: 0,
    autoBumpSlots: 0,
    autoBumpCadence: null,
    includedBoostsPerMonth: 0,
  },
  BASIC: {
    maxActiveProducts: 15,
    maxImagesPerProduct: 4,
    pinnedProducts: 0,
    autoBumpSlots: 0,
    autoBumpCadence: null,
    includedBoostsPerMonth: 1,
  },
  STAR: {
    maxActiveProducts: 30,
    maxImagesPerProduct: 6,
    pinnedProducts: 4,
    autoBumpSlots: 3,
    autoBumpCadence: "semanal",
    includedBoostsPerMonth: 3,
  },
  PREMIUM: {
    maxActiveProducts: 100,
    maxImagesPerProduct: 6,
    pinnedProducts: 10,
    autoBumpSlots: 5,
    autoBumpCadence: "diaria",
    includedBoostsPerMonth: 8,
  },
};

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratis",
  BASIC: "Básico",
  STAR: "Estrella",
  PREMIUM: "Premium",
};

const GRANTABLE_PLANS = ["BASIC", "STAR", "PREMIUM"] as const;

type Form = {
  enabled: boolean;
  startsAt: string;
  endsAt: string;
  grantedPlan: string;
  unlockLimits: boolean;
  unlockPinned: boolean;
  unlockAutoBump: boolean;
  unlockStats: boolean;
  freeBoosts: boolean;
  bannerText: string;
};

const EMPTY_FORM: Form = {
  enabled: false,
  startsAt: "",
  endsAt: "",
  grantedPlan: "PREMIUM",
  unlockLimits: true,
  unlockPinned: true,
  unlockAutoBump: true,
  unlockStats: true,
  freeBoosts: true,
  bannerText: "",
};

/** ISO → valor de un <input type="datetime-local"> en hora local. */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

/** Valor del input (hora local) → ISO, o null si está vacío. */
function fromLocalInput(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function formatWhen(iso?: string | null): string {
  if (!iso) return "sin límite";
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-primary" : "bg-outline-variant/60"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function ModuleRow({
  Icon,
  title,
  description,
  checked,
  onChange,
  disabled,
}: {
  Icon: any;
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
      <Icon size={18} className="mt-0.5 shrink-0 text-on-surface-variant" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-on-surface">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted">
          {description}
        </p>
      </div>
      <Toggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        label={title}
      />
    </div>
  );
}

/**
 * Control de la promoción: mientras está activa, todos los módulos de pago
 * que el admin marque quedan abiertos para cualquier vendedor, sin tocar el
 * plan que cada uno tiene guardado (las insignias siguen reflejando lo pagado).
 */
export default function AdminPromoPage() {
  const { can } = useAbilities();
  const editable = can("update");

  const { data, loading, refetch } = useQuery(ADMIN_PLAN_PROMO, {
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => Promise<any> };
  const [updatePromo, { loading: saving }] = useMutation(UPDATE_PLAN_PROMO);

  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const promo = data?.adminPlanPromo;

  const serverForm: Form | null = promo
    ? {
        enabled: promo.enabled,
        startsAt: toLocalInput(promo.startsAt),
        endsAt: toLocalInput(promo.endsAt),
        grantedPlan: promo.grantedPlan ?? "PREMIUM",
        unlockLimits: promo.unlockLimits,
        unlockPinned: promo.unlockPinned,
        unlockAutoBump: promo.unlockAutoBump,
        unlockStats: promo.unlockStats,
        freeBoosts: promo.freeBoosts,
        bannerText: promo.bannerText ?? "",
      }
    : null;

  // Rehidrata SOLO cuando el contenido del servidor cambia de verdad, nunca por
  // la identidad del objeto: `PlanPromoModel` no tiene `id`, así que Apollo no
  // lo normaliza y cualquier otra query que escriba en ROOT_QUERY (ADMIN_ME,
  // GET_ROLES…) entrega un objeto nuevo. Con `[promo]` como dependencia eso
  // pisaba los cambios sin guardar — encendías el interruptor y volvía solo a
  // apagarse justo antes de guardar.
  const hydratedRef = useRef<string | null>(null);
  const serverSignature = serverForm ? JSON.stringify(serverForm) : null;

  useEffect(() => {
    if (!serverSignature || hydratedRef.current === serverSignature) return;
    hydratedRef.current = serverSignature;
    setForm(JSON.parse(serverSignature) as Form);
  }, [serverSignature]);

  // Cambios pendientes de guardar, para que el estado de la pantalla nunca se
  // confunda con lo que está realmente en vigor.
  const dirty = serverSignature != null && JSON.stringify(form) !== serverSignature;

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const granted = PLAN_LIMITS[form.grantedPlan] ?? PLAN_LIMITS.PREMIUM;
  const free = PLAN_LIMITS.FREE;

  const nothingUnlocked =
    !form.unlockLimits &&
    !form.unlockPinned &&
    !form.unlockAutoBump &&
    !form.unlockStats &&
    !form.freeBoosts;

  const save = async () => {
    setError("");
    setSaved(false);
    try {
      await updatePromo({
        variables: {
          input: {
            enabled: form.enabled,
            startsAt: fromLocalInput(form.startsAt),
            endsAt: fromLocalInput(form.endsAt),
            grantedPlan: form.grantedPlan,
            unlockLimits: form.unlockLimits,
            unlockPinned: form.unlockPinned,
            unlockAutoBump: form.unlockAutoBump,
            unlockStats: form.unlockStats,
            freeBoosts: form.freeBoosts,
            bannerText: form.bannerText.trim() || null,
          },
        },
      });
      await refetch();
      setSaved(true);
    } catch (e) {
      setError(getErrorMessage(e, "No se pudo guardar la promoción."));
    }
  };

  if (loading && !promo) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner size={40} />
      </div>
    );
  }

  const statusBadge = promo?.active ? (
    <Badge variant="active">Promoción activa</Badge>
  ) : promo?.enabled ? (
    <Badge variant="pending">Programada / fuera de ventana</Badge>
  ) : (
    <Badge variant="draft">Desactivada</Badge>
  );

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">
            Promoción — funciones gratis
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Abre los módulos de pago a todos los vendedores durante un tiempo
            determinado. Los planes guardados no se tocan: nadie cambia de plan
            ni pierde su insignia, solo dejan de aplicarse los límites.
          </p>
        </div>
        {statusBadge}
      </div>

      {promo?.active && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4">
          <Gift size={18} className="mt-0.5 shrink-0 text-emerald-600" />
          <p className="text-sm text-on-surface">
            Ahora mismo <strong>todos los vendedores</strong> tienen las
            funciones del plan{" "}
            <strong>{PLAN_LABELS[promo.grantedPlan] ?? promo.grantedPlan}</strong>
            {promo.endsAt ? (
              <>
                {" "}
                hasta el <strong>{formatWhen(promo.endsAt)}</strong>.
              </>
            ) : (
              <> hasta que desactives esta promoción.</>
            )}
          </p>
        </div>
      )}

      {/* Interruptor maestro + ventana */}
      <section className="mb-5 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-on-surface">
              Activar la promoción
            </p>
            <p className="mt-0.5 text-xs text-muted">
              Con esto apagado el sistema cobra y limita exactamente como
              siempre, sin importar el resto de esta pantalla.
            </p>
          </div>
          <Toggle
            checked={form.enabled}
            onChange={(v) => set("enabled", v)}
            disabled={!editable}
            label="Activar la promoción"
          />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
              Plan que se regala
            </span>
            <select
              value={form.grantedPlan}
              disabled={!editable}
              onChange={(e) => set("grantedPlan", e.target.value)}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface disabled:opacity-50"
            >
              {GRANTABLE_PLANS.map((p) => (
                <option key={p} value={p}>
                  {PLAN_LABELS[p]}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">
              Nadie baja de nivel: quien ya paga un plan superior lo conserva.
            </span>
          </label>

          <div className="grid gap-4 sm:col-span-1">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Empieza (opcional)
              </span>
              <input
                type="datetime-local"
                value={form.startsAt}
                disabled={!editable}
                onChange={(e) => set("startsAt", e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
                Termina (opcional)
              </span>
              <input
                type="datetime-local"
                value={form.endsAt}
                disabled={!editable}
                onChange={(e) => set("endsAt", e.target.value)}
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface disabled:opacity-50"
              />
            </label>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-surface-container/60 p-3">
          <CalendarClock size={15} className="mt-0.5 shrink-0 text-muted" />
          <p className="text-xs text-muted">
            Sin fechas la promoción corre indefinidamente hasta que la apagues.
            Al llegar la fecha de fin los límites vuelven solos, sin necesidad de
            entrar aquí.
          </p>
        </div>

        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-on-surface-variant">
            Texto del aviso en la app (opcional)
          </span>
          <input
            type="text"
            maxLength={160}
            value={form.bannerText}
            disabled={!editable}
            placeholder="Ej. Todo Premium gratis hasta el 31 de octubre"
            onChange={(e) => set("bannerText", e.target.value)}
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface disabled:opacity-50"
          />
          <span className="mt-1 block text-xs text-muted">
            {form.bannerText.length}/160 — si lo dejas vacío la app usa su texto
            por defecto.
          </span>
        </label>
      </section>

      {/* Módulos */}
      <section className="mb-5">
        <h2 className="mb-1 text-sm font-bold text-on-surface">
          Qué se abre gratis
        </h2>
        <p className="mb-3 text-xs text-muted">
          Apaga módulos uno a uno para volver a cobrarlos por fases sin terminar
          la promoción entera.
        </p>
        <div className="grid gap-3">
          <ModuleRow
            Icon={LayoutList}
            title="Límite de anuncios y fotos"
            description={`Gratis pasa de ${free.maxActiveProducts} a ${granted.maxActiveProducts} anuncios activos y de ${free.maxImagesPerProduct} a ${granted.maxImagesPerProduct} fotos por anuncio.`}
            checked={form.unlockLimits}
            onChange={(v) => set("unlockLimits", v)}
            disabled={!editable}
          />
          <ModuleRow
            Icon={Pin}
            title="Anuncios fijados"
            description={
              granted.pinnedProducts > 0
                ? `Cualquier vendedor puede fijar hasta ${granted.pinnedProducts} anuncios en su perfil.`
                : "El plan regalado no incluye fijados: este interruptor no cambia nada."
            }
            checked={form.unlockPinned}
            onChange={(v) => set("unlockPinned", v)}
            disabled={!editable}
          />
          <ModuleRow
            Icon={Zap}
            title="Auto-bump"
            description={
              granted.autoBumpSlots > 0
                ? `Hasta ${granted.autoBumpSlots} anuncios con subida automática ${granted.autoBumpCadence}.`
                : "El plan regalado no incluye auto-bump: este interruptor no cambia nada."
            }
            checked={form.unlockAutoBump}
            onChange={(v) => set("unlockAutoBump", v)}
            disabled={!editable}
          />
          <ModuleRow
            Icon={BarChart3}
            title="Estadísticas y escaneos QR"
            description="Abre las métricas de perfil y el registro de visitas por QR a todos los vendedores."
            checked={form.unlockStats}
            onChange={(v) => set("unlockStats", v)}
            disabled={!editable}
          />
          <ModuleRow
            Icon={ImageIcon}
            title="Destacados (boosts) gratis"
            description="Cada destacado cuesta 0 XAF y no consume la cuota mensual. Se sigue registrando en el libro de pagos con importe 0."
            checked={form.freeBoosts}
            onChange={(v) => set("freeBoosts", v)}
            disabled={!editable}
          />
        </div>
      </section>

      {/* Vista previa */}
      <section className="mb-5 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
        <div className="mb-3 flex items-center gap-2">
          <Crown size={16} className="text-on-surface-variant" />
          <h2 className="text-sm font-bold text-on-surface">
            Un vendedor Gratis, con esta configuración
          </h2>
        </div>
        {form.enabled && !nothingUnlocked ? (
          <ul className="grid gap-1.5 text-sm text-on-surface sm:grid-cols-2">
            <li>
              Anuncios activos:{" "}
              <strong>
                {form.unlockLimits
                  ? granted.maxActiveProducts
                  : free.maxActiveProducts}
              </strong>
            </li>
            <li>
              Fotos por anuncio:{" "}
              <strong>
                {form.unlockLimits
                  ? granted.maxImagesPerProduct
                  : free.maxImagesPerProduct}
              </strong>
            </li>
            <li>
              Anuncios fijados:{" "}
              <strong>
                {form.unlockPinned ? granted.pinnedProducts : 0}
              </strong>
            </li>
            <li>
              Auto-bump:{" "}
              <strong>
                {form.unlockAutoBump && granted.autoBumpSlots > 0
                  ? `${granted.autoBumpSlots} (${granted.autoBumpCadence})`
                  : "no"}
              </strong>
            </li>
            <li>
              Estadísticas y QR:{" "}
              <strong>{form.unlockStats ? "sí" : "no"}</strong>
            </li>
            <li>
              Destacados: <strong>{form.freeBoosts ? "gratis" : "de pago"}</strong>
            </li>
          </ul>
        ) : (
          <p className="text-sm text-muted">
            {nothingUnlocked
              ? "No has abierto ningún módulo: la promoción no cambiaría nada."
              : "Con la promoción apagada, los límites del plan Gratis se aplican con normalidad."}
          </p>
        )}
      </section>

      {form.enabled && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" />
          <p className="text-sm text-on-surface">
            Al guardar, los módulos marcados dejan de generar ingresos hasta la
            fecha de fin. Las activaciones de plan que hagas desde{" "}
            <strong>Planes</strong> se siguen cobrando y registrando igual.
          </p>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {saved && !error && (
        <p
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            promo?.active
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-amber-500/10 text-amber-700"
          }`}
        >
          {promo?.active
            ? "Guardado y en vigor. Los cambios llegan a toda la plataforma en menos de un minuto."
            : promo?.enabled
              ? "Guardado, pero la promoción NO está en vigor: la fecha de inicio aún no ha llegado o la de fin ya pasó."
              : "Guardado, pero la promoción sigue DESACTIVADA. Enciende «Activar la promoción» arriba y vuelve a guardar."}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={!editable || saving}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          Guardar promoción
        </button>
        {!editable && (
          <span className="text-xs text-muted">
            Tu rol no tiene permiso para editar (falta la acción «update»).
          </span>
        )}
        {dirty && (
          <span className="text-xs font-semibold text-amber-600">
            Tienes cambios sin guardar
          </span>
        )}
        {promo?.updatedAt && (
          <span className="ml-auto text-xs text-muted">
            Última modificación: {formatWhen(promo.updatedAt)}
          </span>
        )}
      </div>
    </div>
  );
}
