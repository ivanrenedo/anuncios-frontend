"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS } from "@/graphql/queries";
import {
  ADMIN_ACTIVATE_PLAN,
  CHANGE_PLAN,
  DELETE_PLAN_CHANGES,
  GET_PLAN_HISTORY,
} from "@/graphql/mutations";
import { PLAN_ACTIVATIONS, PLAN_TOTAL_PREVIEW } from "@/graphql/queries";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import Modal from "@/components/admin/Modal";
import ExportButton from "@/components/admin/ExportButton";
import Spinner from "@/components/Spinner";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";
import { useAbilities } from "@/hooks/useAbilities";
import {
  Crown,
  Star,
  ShieldCheck,
  User,
  Search,
  History,
  Trash2,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

const USERS_PAGE_SIZE = 20;
const HISTORY_PAGE_SIZE = 10;

interface UserRow {
  id: string;
  name: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  plan?: string;
  planExpiresAt?: string | null;
}

// v2: 4 planes en la escala. FREE no factura pero aparece para el downgrade
// / filtro. Etiquetas en español coinciden con /plans (customer-facing) para
// que admin y usuario compartan vocabulario.
const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratis",
  BASIC: "Básico",
  STAR: "Estrella",
  PREMIUM: "Premium",
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "pending",
  BASIC: "active",
  STAR: "active",
  PREMIUM: "sold",
};

const PAID_PLANS = ["BASIC", "STAR", "PREMIUM"] as const;
// Todos los planes que el admin puede activar/asignar. FREE es un caso
// especial (downgrade): sin meses, sin precio, sin descuento — se enruta al
// mutation legacy CHANGE_PLAN que ya soporta el downgrade limpio.
const SELECTABLE_PLANS = ["FREE", "BASIC", "STAR", "PREMIUM"] as const;
type SelectablePlan = (typeof SELECTABLE_PLANS)[number];

const effectivePlanOf = (u: {
  plan?: string;
  planExpiresAt?: string | null;
}): string =>
  u.planExpiresAt && new Date(u.planExpiresAt) < new Date()
    ? "FREE"
    : u.plan || "FREE";

function planIcon(plan: string) {
  if (plan === "PREMIUM") return <Crown size={14} className="text-purple-500" />;
  if (plan === "STAR") return <Star size={14} className="text-amber-500" />;
  if (plan === "BASIC") return <ShieldCheck size={14} className="text-sky-500" />;
  return <User size={14} className="text-gray-400" />;
}

function fmtXaf(n: number): string {
  return new Intl.NumberFormat("es-ES").format(n);
}

export default function AdminPlans() {
  const { data, loading, refetch } = useQuery(GET_USERS) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const [adminActivatePlan, { loading: savingActivate }] =
    useMutation(ADMIN_ACTIVATE_PLAN);
  const [changePlanMut, { loading: savingChange }] = useMutation(CHANGE_PLAN);
  const saving = savingActivate || savingChange;

  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState<{
    plan: SelectablePlan;
    months: number;
    notes: string;
  }>({ plan: "STAR", months: 1, notes: "" });
  const [error, setError] = useState("");

  const [historyUser, setHistoryUser] = useState<UserRow | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historySelected, setHistorySelected] = useState<Set<string>>(new Set());
  const [historyError, setHistoryError] = useState("");
  const { isSuperAdmin } = useAbilities();

  // v2: activations (multi-mes con desglose) — primary history source.
  const { data: activationsData, refetch: refetchActivations } = useQuery(
    PLAN_ACTIVATIONS,
    {
      variables: { userId: historyUser?.id ?? "" },
      skip: !historyUser,
      fetchPolicy: "cache-and-network",
    },
  ) as { data: any; refetch: () => Promise<unknown> };

  // Legacy PlanChange rows kept for backward-compat with pre-v2 activations.
  const {
    data: historyData,
    loading: historyLoading,
    refetch: refetchHistory,
  } = useQuery(GET_PLAN_HISTORY, {
    variables: { userId: historyUser?.id ?? "" },
    skip: !historyUser,
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => Promise<unknown> };

  const [deletePlanChanges, { loading: deletingHistory }] =
    useMutation(DELETE_PLAN_CHANGES);

  // Real-time preview of the activation total. Debounced would be nicer but
  // the query is pure server-side (no DB) so re-running on every months
  // change is cheap and the Apollo cache dedups within a session.
  // Skip preview for FREE — downgrade path doesn't need pricing.
  const { data: previewData } = useQuery(PLAN_TOTAL_PREVIEW, {
    variables: { plan: form.plan, months: form.months },
    skip: !editUser || form.plan === "FREE",
    fetchPolicy: "cache-and-network",
  }) as { data: any };
  const preview = form.plan === "FREE" ? null : previewData?.planTotalPreview;

  useEffect(() => {
    setHistoryPage(0);
    setHistorySelected(new Set());
    setHistoryError("");
  }, [historyUser?.id]);

  const users: UserRow[] = data?.users ?? [];

  const filtered = useMemo(() => {
    let result = users;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q),
      );
    }
    if (filterPlan !== "ALL") {
      result = result.filter((u) => effectivePlanOf(u) === filterPlan);
    }
    return result;
  }, [users, search, filterPlan]);

  const stats = useMemo(() => {
    const counts = { FREE: 0, BASIC: 0, STAR: 0, PREMIUM: 0 };
    for (const u of users) {
      const p = effectivePlanOf(u) as keyof typeof counts;
      if (p in counts) counts[p]++;
    }
    return counts;
  }, [users]);

  const expiringSoon = useMemo(() => {
    const now = Date.now();
    const week = now + 7 * 24 * 60 * 60 * 1000;
    return users
      .filter((u) => {
        if (!u.planExpiresAt || (u.plan || "FREE") === "FREE") return false;
        const t = new Date(u.planExpiresAt).getTime();
        return t > now && t <= week;
      })
      .sort(
        (a, b) =>
          new Date(a.planExpiresAt!).getTime() -
          new Date(b.planExpiresAt!).getTime(),
      );
  }, [users]);

  const renewalWhatsApp = (u: UserRow) => {
    const phone = (u.phone ?? "").replace(/[^0-9]/g, "");
    if (!phone) return;
    const msg = encodeURIComponent(
      `Hola ${u.name}, tu plan ${PLAN_LABELS[u.plan ?? "FREE"]} de Bomelh expira el ${formatDate(
        u.planExpiresAt,
      )}. ¿Quieres renovarlo?`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    // Prefill with the user's current plan (or STAR if they're Free/Basic) so
    // the admin can renew with a single click. Default to 1 month so the total
    // is small and the admin has to opt into a longer commitment.
    const seed = (PAID_PLANS as readonly string[]).includes(user.plan ?? "")
      ? (user.plan as SelectablePlan)
      : "STAR";
    setForm({ plan: seed, months: 1, notes: "" });
    setError("");
  };

  const handleActivate = async () => {
    if (!editUser) return;
    setError("");
    try {
      if (form.plan === "FREE") {
        // FREE es un downgrade: sin meses, sin precio, sin PlanActivation.
        // Se enruta a changePlan legacy que limpia planExpiresAt y registra
        // el cambio en PlanChange + admin_actions (para auditoría).
        await changePlanMut({
          variables: {
            input: {
              userId: editUser.id,
              plan: "FREE",
              expiresAt: null,
              reason: form.notes || null,
            },
          },
        });
      } else {
        await adminActivatePlan({
          variables: {
            input: {
              userId: editUser.id,
              plan: form.plan,
              months: form.months,
              notes: form.notes || null,
            },
          },
        });
      }
      setEditUser(null);
      refetch();
    } catch (e: any) {
      setError(getErrorMessage(e));
    }
  };

  const columns = [
    {
      key: "name",
      label: "Usuario",
      render: (u: UserRow) => (
        <div className="flex items-center gap-3">
          {u.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={resolveImage(u.avatarUrl)}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container">
              <User size={14} className="text-muted" />
            </div>
          )}
          <div>
            <p className="font-semibold text-on-surface">{u.name}</p>
            <p className="text-xs text-muted">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (u: UserRow) => {
        const plan = effectivePlanOf(u);
        return (
          <div className="flex items-center gap-2">
            {planIcon(plan)}
            <Badge variant={PLAN_COLORS[plan] as any}>
              {PLAN_LABELS[plan]}
            </Badge>
          </div>
        );
      },
    },
    {
      key: "planExpiresAt",
      label: "Expira",
      render: (u: UserRow) =>
        u.planExpiresAt ? (
          <span
            className={
              new Date(u.planExpiresAt) < new Date()
                ? "text-red-500 font-medium"
                : "text-muted"
            }
          >
            {formatDate(u.planExpiresAt)}
          </span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
  ];

  const actions = (u: UserRow) => (
    <div className="flex gap-1">
      <button
        onClick={() => openEdit(u)}
        className="rounded-lg p-1.5 text-muted hover:bg-surface-container hover:text-primary"
        title="Activar plan"
      >
        <Crown size={15} />
      </button>
      <button
        onClick={() => setHistoryUser(u)}
        className="rounded-lg p-1.5 text-muted hover:bg-surface-container hover:text-primary"
        title="Ver historial"
      >
        <History size={15} />
      </button>
    </div>
  );

  const legacyHistory: any[] = historyData?.planHistory ?? [];
  const activations: any[] = activationsData?.planActivations ?? [];
  // Merge both timelines so the admin sees one chronological list. Activations
  // are the primary v2 source; legacy PlanChange rows are annotated so
  // reviewers can tell them apart at a glance.
  const mergedHistory = useMemo(() => {
    const items = [
      ...activations.map((a) => ({ ...a, kind: "activation" as const })),
      ...legacyHistory.map((h) => ({ ...h, kind: "change" as const })),
    ];
    items.sort((a, b) => {
      const at =
        (a.kind === "activation" ? a.activatedAt : a.createdAt) ?? "";
      const bt =
        (b.kind === "activation" ? b.activatedAt : b.createdAt) ?? "";
      return new Date(bt).getTime() - new Date(at).getTime();
    });
    return items;
  }, [activations, legacyHistory]);

  const historyTotalPages = Math.max(
    1,
    Math.ceil(mergedHistory.length / HISTORY_PAGE_SIZE),
  );
  const historyCurrentPage = Math.min(historyPage, historyTotalPages - 1);
  const historyPageItems = mergedHistory.slice(
    historyCurrentPage * HISTORY_PAGE_SIZE,
    historyCurrentPage * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE,
  );

  const legacyIdsOnPage = historyPageItems
    .filter((h) => h.kind === "change")
    .map((h) => h.id);

  const toggleHistorySelect = (id: string) => {
    setHistorySelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleHistorySelectPage = () => {
    setHistorySelected((prev) => {
      const allSelected =
        legacyIdsOnPage.length > 0 &&
        legacyIdsOnPage.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) legacyIdsOnPage.forEach((id) => next.delete(id));
      else legacyIdsOnPage.forEach((id) => next.add(id));
      return next;
    });
  };

  const runDeleteHistory = async (ids: string[]) => {
    if (ids.length === 0) return;
    setHistoryError("");
    try {
      await deletePlanChanges({ variables: { ids } });
      setHistorySelected((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      await refetchHistory();
      await refetchActivations();
    } catch (e) {
      setHistoryError(getErrorMessage(e, "No se pudo eliminar el historial."));
    }
  };
  const deleteHistoryRow = (id: string) => {
    if (!confirm("¿Eliminar esta entrada del historial? No se puede deshacer."))
      return;
    runDeleteHistory([id]);
  };
  const deleteHistorySelected = () => {
    const ids = [...historySelected];
    if (ids.length === 0) return;
    if (
      !confirm(
        `¿Eliminar ${ids.length} entrada(s) del historial? No se puede deshacer.`,
      )
    )
      return;
    runDeleteHistory(ids);
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">
            Gestión de planes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Activa planes Básico, Estrella y Premium con duración de 1 a 12 meses
          </p>
        </div>
        <ExportButton model="plan-changes" label="Exportar historial" />
      </div>

      {/* Stats — 4 cards ahora (v2 add BASIC) */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
          <User size={20} className="mx-auto mb-1 text-gray-400" />
          <p className="text-2xl font-bold text-on-surface">{stats.FREE}</p>
          <p className="text-xs text-muted">Gratis</p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
          <ShieldCheck size={20} className="mx-auto mb-1 text-sky-500" />
          <p className="text-2xl font-bold text-on-surface">{stats.BASIC}</p>
          <p className="text-xs text-muted">Básico</p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
          <Star size={20} className="mx-auto mb-1 text-amber-500" />
          <p className="text-2xl font-bold text-on-surface">{stats.STAR}</p>
          <p className="text-xs text-muted">Estrella</p>
        </div>
        <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
          <Crown size={20} className="mx-auto mb-1 text-purple-500" />
          <p className="text-2xl font-bold text-on-surface">{stats.PREMIUM}</p>
          <p className="text-xs text-muted">Premium</p>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="mb-3 text-sm font-semibold text-on-surface">
            ⏳ Renovaciones próximas ({expiringSoon.length}) — expiran en los
            próximos días
          </p>
          <div className="space-y-2">
            {expiringSoon.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-2.5"
              >
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImage(u.avatarUrl)}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {u.name?.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-surface">
                    {u.name}
                  </p>
                  <p className="text-xs text-muted">
                    {PLAN_LABELS[u.plan ?? "FREE"]} · expira{" "}
                    {formatDate(u.planExpiresAt)}
                  </p>
                </div>
                {u.phone ? (
                  <button
                    onClick={() => renewalWhatsApp(u)}
                    className="rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/20"
                  >
                    WhatsApp
                  </button>
                ) : (
                  <span className="text-xs text-muted">Sin teléfono</span>
                )}
                <button
                  onClick={() => openEdit(u)}
                  className="rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-1.5 text-xs font-medium hover:bg-surface-container"
                >
                  Renovar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest py-2.5 pl-9 pr-4 text-sm text-on-surface placeholder:text-muted focus:border-primary focus:outline-none"
          />
        </div>
        <select
          value={filterPlan}
          onChange={(e) => setFilterPlan(e.target.value)}
          className="rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
        >
          <option value="ALL">Todos los planes</option>
          <option value="FREE">Gratis</option>
          <option value="BASIC">Básico</option>
          <option value="STAR">Estrella</option>
          <option value="PREMIUM">Premium</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        loading={loading}
        actions={actions}
        emptyMessage="No se encontraron usuarios"
        pageSize={USERS_PAGE_SIZE}
      />

      {/* v2 Activate modal — plan × months con preview en tiempo real */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Activar plan — ${editUser?.name}`}
      >
        <div className="space-y-4">
          <div
            className={
              form.plan === "FREE" ? "grid grid-cols-1" : "grid grid-cols-2 gap-3"
            }
          >
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">
                Plan
              </label>
              <select
                value={form.plan}
                onChange={(e) =>
                  setForm({ ...form, plan: e.target.value as SelectablePlan })
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                {SELECTABLE_PLANS.map((p) => (
                  <option key={p} value={p}>
                    {PLAN_LABELS[p]}
                    {p === "FREE" ? " (downgrade)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {form.plan !== "FREE" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-on-surface">
                  Meses (1–12)
                </label>
                <select
                  value={form.months}
                  onChange={(e) =>
                    setForm({ ...form, months: Number(e.target.value) })
                  }
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 1 ? "mes" : "meses"}
                      {m === 3 || m === 5
                        ? " · −5 %"
                        : m === 6 || m === 11
                          ? " · −10 %"
                          : m === 12
                            ? " · −25 %"
                            : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {form.plan === "FREE" && (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-sm text-on-surface">
              <p className="font-semibold">Downgrade a Gratis</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                El usuario pierde inmediatamente su plan y cualquier tiempo
                restante. No se registra pago. Queda en el historial legacy
                para auditoría.
              </p>
            </div>
          )}

          {/* Preview breakdown (server-side). Shown as soon as the query
              lands so the admin sees the total before typing anything else. */}
          {preview && (
            <div className="rounded-xl border border-outline-variant/40 bg-surface-low px-4 py-3 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-muted">
                  Precio unitario · {form.months}{" "}
                  {form.months === 1 ? "mes" : "meses"}
                </span>
                <span className="font-mono text-on-surface">
                  {fmtXaf(Number(preview.unitPrice))} × {form.months} ={" "}
                  {fmtXaf(Number(preview.gross))} XAF
                </span>
              </div>
              {Number(preview.discountPct) > 0 && (
                <div className="mt-1 flex items-baseline justify-between text-emerald-600">
                  <span>
                    Descuento (−
                    {Math.round(Number(preview.discountPct) * 100)} %)
                  </span>
                  <span className="font-mono">
                    −{fmtXaf(Number(preview.discountAmount))} XAF
                  </span>
                </div>
              )}
              <div className="mt-2 flex items-baseline justify-between border-t border-outline-variant/40 pt-2">
                <span className="text-base font-bold text-on-surface">
                  Total
                </span>
                <span className="font-mono text-base font-extrabold text-on-surface">
                  {fmtXaf(Number(preview.total))} XAF
                </span>
              </div>
            </div>
          )}

          {/* v2 Fase 8: warning when 12m is strictly cheaper than the chosen
              duration. Today only triggers at 11m; the helper stays general so
              a future re-tune of DISCOUNT_TIERS is caught automatically. */}
          {preview?.cheaperAtTwelve?.triggered && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3">
              <AlertTriangle
                size={18}
                strokeWidth={2}
                className="mt-0.5 shrink-0 text-amber-600"
              />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-semibold text-on-surface">
                  Con 12 meses pagaría{" "}
                  {fmtXaf(preview.cheaperAtTwelve.yearlyTotal)} XAF y ahorra{" "}
                  <span className="text-emerald-600">
                    {fmtXaf(preview.cheaperAtTwelve.savings)} XAF
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, months: 12 })}
                  className="mt-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
                >
                  Cambiar a 12 meses
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ej: transferencia bancaria #4821"
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEditUser(null)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-muted hover:bg-surface-container"
            >
              Cancelar
            </button>
            <button
              onClick={handleActivate}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Spinner size={14} />}
              Confirmar activación
            </button>
          </div>
        </div>
      </Modal>

      {/* History modal — muestra activations v2 + PlanChange legacy */}
      <Modal
        open={!!historyUser}
        onClose={() => setHistoryUser(null)}
        title={`Historial — ${historyUser?.name}`}
      >
        {historyLoading && mergedHistory.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : mergedHistory.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Sin cambios de plan registrados
          </p>
        ) : (
          <div className="space-y-3">
            {historyError && (
              <div className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
                {historyError}
              </div>
            )}

            {isSuperAdmin && legacyIdsOnPage.length > 0 && (
              <div className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-low px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={
                      legacyIdsOnPage.length > 0 &&
                      legacyIdsOnPage.every((id) => historySelected.has(id))
                    }
                    onChange={toggleHistorySelectPage}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  {historySelected.size > 0
                    ? `${historySelected.size} legacy seleccionada(s)`
                    : "Seleccionar legacy de esta página"}
                </label>
                {historySelected.size > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setHistorySelected(new Set())}
                      className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted transition hover:bg-surface-container"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={deleteHistorySelected}
                      disabled={deletingHistory}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {deletingHistory ? (
                        <Spinner size={12} />
                      ) : (
                        <Trash2 size={12} />
                      )}
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}

            <div className="max-h-96 space-y-3 overflow-y-auto">
              {historyPageItems.map((h) =>
                h.kind === "activation" ? (
                  <div
                    key={`a-${h.id}`}
                    className="rounded-xl border border-primary/25 bg-primary/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-2 text-sm">
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-primary">
                        v2 · activación
                      </span>
                      <Badge variant={PLAN_COLORS[h.plan] as any}>
                        {PLAN_LABELS[h.plan]}
                      </Badge>
                      <span className="text-xs font-semibold text-on-surface-variant">
                        × {h.months} {h.months === 1 ? "mes" : "meses"}
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="text-muted">
                        Total pagado
                        <div className="font-mono text-sm font-bold text-on-surface">
                          {fmtXaf(Number(h.totalPaid))} XAF
                        </div>
                      </div>
                      <div className="text-muted">
                        Descuento
                        <div className="font-mono text-sm font-bold text-on-surface">
                          {Math.round(Number(h.discountPct) * 100)} %
                        </div>
                      </div>
                      <div className="text-muted">
                        Inicio
                        <div className="font-mono text-sm text-on-surface">
                          {formatDate(h.startsAt)}
                        </div>
                      </div>
                      <div className="text-muted">
                        Fin
                        <div className="font-mono text-sm text-on-surface">
                          {formatDate(h.endsAt)}
                        </div>
                      </div>
                    </div>
                    {h.notes && (
                      <p className="mt-2 text-xs italic text-on-surface-variant">
                        “{h.notes}”
                      </p>
                    )}
                  </div>
                ) : (
                  <div
                    key={`c-${h.id}`}
                    className="flex items-start gap-3 rounded-xl border border-outline-variant/30 bg-surface-low px-4 py-3"
                  >
                    {isSuperAdmin && (
                      <input
                        type="checkbox"
                        checked={historySelected.has(h.id)}
                        onChange={() => toggleHistorySelect(h.id)}
                        className="mt-1 h-4 w-4 cursor-pointer accent-primary"
                        aria-label="Seleccionar"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="rounded-full bg-outline-variant/25 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-on-surface-variant">
                          legacy
                        </span>
                        <Badge variant={PLAN_COLORS[h.oldPlan] as any}>
                          {PLAN_LABELS[h.oldPlan]}
                        </Badge>
                        <span className="text-muted">→</span>
                        <Badge variant={PLAN_COLORS[h.newPlan] as any}>
                          {PLAN_LABELS[h.newPlan]}
                        </Badge>
                      </div>
                      <div className="mt-1 flex gap-4 text-xs text-muted">
                        <span>{formatDate(h.createdAt)}</span>
                        {h.expiresAt && (
                          <span>Expira: {formatDate(h.expiresAt)}</span>
                        )}
                      </div>
                      {h.reason && (
                        <p className="mt-1 text-xs text-on-surface-variant">
                          {h.reason}
                        </p>
                      )}
                    </div>
                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => deleteHistoryRow(h.id)}
                        disabled={deletingHistory}
                        title="Eliminar entrada"
                        className="inline-grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-danger transition hover:bg-danger/10 disabled:opacity-40"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ),
              )}
            </div>

            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  {historyCurrentPage * HISTORY_PAGE_SIZE + 1}–
                  {Math.min(
                    (historyCurrentPage + 1) * HISTORY_PAGE_SIZE,
                    mergedHistory.length,
                  )}{" "}
                  de {mergedHistory.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
                    disabled={historyCurrentPage === 0}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-1 font-medium text-on-surface">
                    {historyCurrentPage + 1} / {historyTotalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setHistoryPage((p) =>
                        Math.min(historyTotalPages - 1, p + 1),
                      )
                    }
                    disabled={historyCurrentPage >= historyTotalPages - 1}
                    className="grid h-7 w-7 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
