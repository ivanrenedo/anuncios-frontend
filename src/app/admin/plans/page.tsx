"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_USERS } from "@/graphql/queries";
import {
  CHANGE_PLAN,
  GET_PLAN_HISTORY,
  DELETE_PLAN_CHANGES,
} from "@/graphql/mutations";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import Modal from "@/components/admin/Modal";
import ExportButton from "@/components/admin/ExportButton";
import Spinner from "@/components/Spinner";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";
import { useAbilities } from "@/hooks/useAbilities";
import { Crown, Star, User, Search, History, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

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

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratis",
  STAR: "Estrella",
  PREMIUM: "Premium",
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "pending",
  STAR: "active",
  PREMIUM: "sold",
};

// A paid plan whose expiry date has already passed counts as FREE — mirror the
// backend downgrade (effectivePlan + the daily expiry cron) so the admin table
// doesn't keep showing a stale paid badge in the window before the cron runs.
const effectivePlanOf = (u: {
  plan?: string;
  planExpiresAt?: string | null;
}): string =>
  u.planExpiresAt && new Date(u.planExpiresAt) < new Date()
    ? "FREE"
    : u.plan || "FREE";

export default function AdminPlans() {
  const { data, loading, refetch } = useQuery(GET_USERS) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const [changePlan, { loading: saving }] = useMutation(CHANGE_PLAN);
  const [search, setSearch] = useState("");
  const [filterPlan, setFilterPlan] = useState<string>("ALL");
  const [editUser, setEditUser] = useState<UserRow | null>(null);
  const [form, setForm] = useState({ plan: "FREE", expiresAt: "", reason: "" });
  const [error, setError] = useState("");

  const [historyUser, setHistoryUser] = useState<UserRow | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historySelected, setHistorySelected] = useState<Set<string>>(new Set());
  const [historyError, setHistoryError] = useState("");
  const { isSuperAdmin } = useAbilities();
  const { data: historyData, loading: historyLoading, refetch: refetchHistory } =
    useQuery(GET_PLAN_HISTORY, {
      variables: { userId: historyUser?.id ?? "" },
      skip: !historyUser,
      fetchPolicy: "cache-and-network",
    }) as { data: any; loading: boolean; refetch: () => Promise<unknown> };
  const [deletePlanChanges, { loading: deletingHistory }] =
    useMutation(DELETE_PLAN_CHANGES);

  // Reset paging + selection whenever the modal opens on a different user.
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
          u.email?.toLowerCase().includes(q)
      );
    }
    if (filterPlan !== "ALL") {
      result = result.filter((u) => effectivePlanOf(u) === filterPlan);
    }
    return result;
  }, [users, search, filterPlan]);

  const stats = useMemo(() => {
    const counts = { FREE: 0, STAR: 0, PREMIUM: 0 };
    for (const u of users) {
      const p = effectivePlanOf(u) as keyof typeof counts;
      if (p in counts) counts[p]++;
    }
    return counts;
  }, [users]);

  // Paid plans expiring within 7 days — the manual-renewal chase list.
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
      `Hola ${u.name}, tu plan ${PLAN_LABELS[u.plan ?? "FREE"]} de Bomell expira el ${formatDate(u.planExpiresAt)}. ¿Quieres renovarlo?`,
    );
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  };

  const openEdit = (user: UserRow) => {
    setEditUser(user);
    setForm({
      plan: user.plan || "FREE",
      expiresAt: user.planExpiresAt
        ? new Date(user.planExpiresAt).toISOString().slice(0, 16)
        : "",
      reason: "",
    });
    setError("");
  };

  const handleSave = async () => {
    if (!editUser) return;
    setError("");
    try {
      await changePlan({
        variables: {
          input: {
            userId: editUser.id,
            plan: form.plan,
            expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
            reason: form.reason || null,
          },
        },
      });
      setEditUser(null);
      refetch();
    } catch (e: any) {
      setError(getErrorMessage(e));
    }
  };

  const planIcon = (plan: string) => {
    if (plan === "PREMIUM")
      return <Crown size={14} className="text-purple-500" />;
    if (plan === "STAR")
      return <Star size={14} className="text-amber-500" />;
    return <User size={14} className="text-gray-400" />;
  };

  const columns = [
    {
      key: "name",
      label: "Usuario",
      render: (u: UserRow) => (
        <div className="flex items-center gap-3">
          {u.avatarUrl ? (
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
        title="Cambiar plan"
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

  const history: any[] = historyData?.planHistory ?? [];
  const historyTotalPages = Math.max(
    1,
    Math.ceil(history.length / HISTORY_PAGE_SIZE),
  );
  const historyCurrentPage = Math.min(historyPage, historyTotalPages - 1);
  const historyPageItems = history.slice(
    historyCurrentPage * HISTORY_PAGE_SIZE,
    historyCurrentPage * HISTORY_PAGE_SIZE + HISTORY_PAGE_SIZE,
  );

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
      const pageIds = historyPageItems.map((h) => h.id);
      const allSelected =
        pageIds.length > 0 && pageIds.every((id) => prev.has(id));
      const next = new Set(prev);
      if (allSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
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
    } catch (e) {
      setHistoryError(
        getErrorMessage(e, "No se pudo eliminar el historial."),
      );
    }
  };
  const deleteHistoryRow = (id: string) => {
    if (!confirm("¿Eliminar esta entrada del historial? No se puede deshacer.")) return;
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
            Asigna planes Estrella y Premium a los usuarios
          </p>
        </div>
        <ExportButton model="plan-changes" label="Exportar historial" />
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 text-center">
          <User size={20} className="mx-auto mb-1 text-gray-400" />
          <p className="text-2xl font-bold text-on-surface">{stats.FREE}</p>
          <p className="text-xs text-muted">Gratis</p>
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

      {/* Renovaciones próximas */}
      {expiringSoon.length > 0 && (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="mb-3 text-sm font-semibold text-on-surface">
            ⏳ Renovaciones próximas ({expiringSoon.length}) — expiran en los próximos días
          </p>
          <div className="space-y-2">
            {expiringSoon.map((u) => (
              <div
                key={u.id}
                className="flex flex-wrap items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-2.5"
              >
                {u.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImage(u.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {u.name?.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-on-surface">{u.name}</p>
                  <p className="text-xs text-muted">
                    {PLAN_LABELS[u.plan ?? "FREE"]} · expira {formatDate(u.planExpiresAt)}
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

      {/* Filters */}
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

      {/* Edit modal */}
      <Modal
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title={`Cambiar plan — ${editUser?.name}`}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Plan
            </label>
            <select
              value={form.plan}
              onChange={(e) => setForm({ ...form, plan: e.target.value })}
              className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="FREE">Gratis</option>
              <option value="STAR">Estrella</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>

          {form.plan !== "FREE" && (
            <div>
              <label className="mb-1 block text-sm font-medium text-on-surface">
                Fecha de expiración
              </label>
              <input
                type="datetime-local"
                value={form.expiresAt}
                onChange={(e) =>
                  setForm({ ...form, expiresAt: e.target.value })
                }
                className="w-full rounded-xl border border-outline-variant/40 bg-surface-lowest px-3 py-2.5 text-sm text-on-surface focus:border-primary focus:outline-none"
              />
              <p className="mt-1 text-xs text-muted">
                Deja vacío para plan sin expiración
              </p>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-on-surface">
              Motivo (opcional)
            </label>
            <input
              type="text"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder="Ej: Pago recibido en persona"
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
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            >
              {saving && <Spinner size={14} />}
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* History modal */}
      <Modal
        open={!!historyUser}
        onClose={() => setHistoryUser(null)}
        title={`Historial de planes — ${historyUser?.name}`}
      >
        {historyLoading && history.length === 0 ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : history.length === 0 ? (
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

            {isSuperAdmin && (
              <div className="flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-low px-3 py-2">
                <label className="flex cursor-pointer items-center gap-2 text-xs text-muted">
                  <input
                    type="checkbox"
                    checked={
                      historyPageItems.length > 0 &&
                      historyPageItems.every((h) => historySelected.has(h.id))
                    }
                    onChange={toggleHistorySelectPage}
                    className="h-4 w-4 cursor-pointer accent-primary"
                  />
                  {historySelected.size > 0
                    ? `${historySelected.size} seleccionada(s)`
                    : "Seleccionar página"}
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

            <div className="max-h-80 space-y-3 overflow-y-auto">
              {historyPageItems.map((h) => (
                <div
                  key={h.id}
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
              ))}
            </div>

            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-muted">
                <span>
                  {historyCurrentPage * HISTORY_PAGE_SIZE + 1}–
                  {Math.min(
                    (historyCurrentPage + 1) * HISTORY_PAGE_SIZE,
                    history.length,
                  )}{" "}
                  de {history.length}
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
