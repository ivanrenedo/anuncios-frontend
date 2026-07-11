"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@apollo/client/react";
import { Flag, Package, User as UserIcon, ExternalLink, Trash2, EyeOff, Ban } from "lucide-react";
import { GET_REPORTS } from "@/graphql/queries";
import {
  UPDATE_REPORT_STATUS,
  DELETE_REPORTS,
  ADMIN_SET_PRODUCT_STATUS,
  SUSPEND_USER,
} from "@/graphql/mutations";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import Modal from "@/components/admin/Modal";
import Spinner from "@/components/Spinner";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";

interface ReportUser {
  id: string;
  name: string;
  avatarUrl?: string | null;
  location?: string | null;
}
interface ReportProduct {
  id: string;
  title: string;
  images?: { id: string; url: string }[];
}
interface Report {
  id: string;
  type: "product" | "user";
  reason: string;
  description?: string | null;
  status: "pending" | "reviewed" | "dismissed";
  createdAt: string;
  reviewedAt?: string | null;
  resolutionNote?: string | null;
  reviewedBy?: ReportUser | null;
  reporter?: ReportUser | null;
  reportedUser?: ReportUser | null;
  product?: ReportProduct | null;
}

// One row per reported target (product/user), aggregating all its reports.
type ReportGroup = {
  id: string; // DataTable requires an id; reuse the group key.
  key: string; // "p:<id>" | "u:<id>"
  type: "product" | "user";
  reports: Report[];
  count: number; // total reports in the group
  reasons: string[]; // distinct reason keys
  latest: string; // createdAt of the most recent report
};

const REASON: Record<string, string> = {
  spam: "Spam o engañoso",
  scam: "Estafa o fraude",
  prohibited: "Anuncio prohibido/ilegal",
  offensive: "Contenido ofensivo",
  fake: "Perfil falso/suplantación",
  harassment: "Acoso o abuso",
  other: "Otro",
};
const STATUS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Pendiente", variant: "pending" },
  reviewed: { label: "Revisado", variant: "active" },
  dismissed: { label: "Descartado", variant: "sold" },
};
const TYPE: Record<string, string> = { product: "Anuncio", user: "Usuario" };

const targetKey = (r: Report) =>
  r.type === "product" ? `p:${r.product?.id ?? ""}` : `u:${r.reportedUser?.id ?? ""}`;

// Group reports by their target (product or user) into a keyed map.
function buildGroups(list: Report[]): Record<string, ReportGroup> {
  const map: Record<string, ReportGroup> = {};
  for (const r of list) {
    const k = targetKey(r);
    if (!map[k]) {
      map[k] = { id: k, key: k, type: r.type, reports: [], count: 0, reasons: [], latest: r.createdAt };
    }
    const g = map[k];
    g.reports.push(r);
    g.count += 1;
    if (!g.reasons.includes(r.reason)) g.reasons.push(r.reason);
    if (r.createdAt > g.latest) g.latest = r.createdAt;
  }
  return map;
}

export default function AdminReports() {
  const { data, loading, refetch } = useQuery(GET_REPORTS) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const [updateStatus, { loading: updating }] = useMutation(UPDATE_REPORT_STATUS);
  const [deleteReportsMut, { loading: deleting }] = useMutation(DELETE_REPORTS);
  const [hideProduct, { loading: hiding }] = useMutation(ADMIN_SET_PRODUCT_STATUS);
  const [suspendUserMut, { loading: suspending }] = useMutation(SUSPEND_USER);

  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [actionError, setActionError] = useState("");

  const reports: Report[] = data?.reports ?? [];
  const pending = reports.filter((r) => r.status === "pending").length;

  let filtered = reports;
  if (statusFilter !== "all") filtered = filtered.filter((r) => r.status === statusFilter);
  if (typeFilter !== "all") filtered = filtered.filter((r) => r.type === typeFilter);

  // Table groups respect the filters; sorted by report volume then recency.
  const groups: ReportGroup[] = Object.values(buildGroups(filtered)).sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return b.latest.localeCompare(a.latest);
  });

  // The modal reads from the *unfiltered* grouping and is derived (not a frozen
  // copy), so it reflects live status the instant a mutation updates the cache —
  // and a resolved report doesn't vanish because of the table's status filter.
  const allGroupsByKey = useMemo(() => buildGroups(reports), [reports]);
  const selected = selectedKey ? allGroupsByKey[selectedKey] ?? null : null;
  const pendingInGroup = selected
    ? selected.reports.filter((r) => r.status === "pending").length
    : 0;

  const openReport = (g: ReportGroup) => {
    setSelectedKey(g.key);
    setNote("");
    setActionError("");
  };
  const closeReport = () => {
    setSelectedKey(null);
    setNote("");
    setActionError("");
  };

  const setStatus = async (
    reportId: string,
    status: "reviewed" | "dismissed" | "pending",
    reportNote?: string,
  ) => {
    setActionError("");
    try {
      await updateStatus({
        variables: {
          id: reportId,
          status,
          note: reportNote?.trim() || null,
        },
      });
      refetch();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo actualizar el reporte."));
    }
  };

  // Bulk resolve every pending report in the open group in one shot, then a
  // single refetch (instead of firing one mutation + refetch per report).
  const bulkSetStatus = async (status: "reviewed" | "dismissed") => {
    if (!selected) return;
    const pendingReports = selected.reports.filter((r) => r.status === "pending");
    if (pendingReports.length === 0) return;
    setActionError("");
    try {
      await Promise.all(
        pendingReports.map((r) =>
          updateStatus({ variables: { id: r.id, status, note: note.trim() || null } }),
        ),
      );
      refetch();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo actualizar el reporte."));
    }
  };

  const targetCell = (g: ReportGroup) => {
    const r = g.reports[0];
    return g.type === "product"
      ? r.product?.title ?? "Anuncio eliminado"
      : r.reportedUser?.name ?? "Usuario eliminado";
  };

  // Severity by volume of reports: 1 = discreet, 2-3 = warning, 4+ = critical.
  const severityVariant = (n: number) => (n >= 4 ? "danger" : n >= 2 ? "pending" : "draft");

  const toggleSelect = (key: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === groups.length ? new Set() : new Set(groups.map((g) => g.key)),
    );
  };

  // Delete report records by id, then refetch so table + modal reflect it.
  const runDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    setActionError("");
    try {
      await deleteReportsMut({ variables: { ids } });
      await refetch();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudieron eliminar los reportes."));
    }
  };

  // Table-row trash: delete every report of one target group.
  const deleteGroup = (g: ReportGroup) => {
    if (
      !confirm(
        `¿Eliminar los ${g.count} reporte(s) de "${targetCell(g)}"? Esta acción no se puede deshacer.`,
      )
    )
      return;
    runDelete(g.reports.map((r) => r.id));
  };

  // Bulk toolbar: delete every report of all selected target groups.
  const deleteSelected = async () => {
    const keys = [...selectedIds];
    const ids = keys.flatMap((k) => allGroupsByKey[k]?.reports.map((r) => r.id) ?? []);
    if (ids.length === 0) return;
    if (
      !confirm(
        `¿Eliminar ${ids.length} reporte(s) de ${keys.length} objetivo(s)? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await runDelete(ids);
    setSelectedIds(new Set());
  };

  // Modal: delete a single report record.
  const deleteOneReport = (id: string) => {
    if (!confirm("¿Eliminar este reporte? Esta acción no se puede deshacer.")) return;
    runDelete([id]);
  };

  // Moderation shortcuts: act on the reported target without leaving the modal.
  const moderateHideProduct = async () => {
    const product = selected?.reports[0]?.product;
    if (!product) return;
    const reason =
      window.prompt("Motivo (se envía al vendedor, opcional):") ?? undefined;
    setActionError("");
    try {
      await hideProduct({
        variables: { id: product.id, status: "hide", reason },
      });
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo ocultar el anuncio."));
    }
  };

  const moderateSuspendUser = async () => {
    const target = selected?.reports[0]?.reportedUser;
    if (!target) return;
    if (!confirm(`¿Suspender a "${target.name}"? Se ocultarán sus anuncios y perderá el acceso.`)) return;
    const reason =
      window.prompt("Motivo de la suspensión (opcional):") ?? undefined;
    setActionError("");
    try {
      await suspendUserMut({ variables: { id: target.id, reason } });
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo suspender al usuario."));
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">Reportes</h1>
        <p className="mt-1 text-sm text-muted">
          {reports.length} totales · {pending} pendientes
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none"
        >
          <option value="all">Todos los estados</option>
          <option value="pending">Pendientes</option>
          <option value="reviewed">Revisados</option>
          <option value="dismissed">Descartados</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-10 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm outline-none"
        >
          <option value="all">Todos los tipos</option>
          <option value="product">Anuncios</option>
          <option value="user">Usuarios</option>
        </select>
      </div>

      {groups.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-low px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={selectedIds.size === groups.length && groups.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
            {selectedIds.size > 0
              ? `${selectedIds.size} seleccionado${selectedIds.size > 1 ? "s" : ""}`
              : "Seleccionar todos"}
          </label>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-container"
              >
                Limpiar
              </button>
              <button
                onClick={deleteSelected}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deleting ? <Spinner size={14} /> : <Trash2 size={14} />} Eliminar
              </button>
            </div>
          )}
        </div>
      )}

      <DataTable<ReportGroup>
        loading={loading}
        data={groups}
        pageSize={10}
        onRowClick={openReport}
        emptyMessage="Sin reportes"
        actions={(g) => (
          <button
            onClick={() => deleteGroup(g)}
            disabled={deleting}
            aria-label="Eliminar reportes"
            className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-60"
          >
            <Trash2 size={16} />
          </button>
        )}
        columns={[
          {
            key: "select",
            label: "",
            sortable: false,
            render: (g) => (
              <input
                type="checkbox"
                checked={selectedIds.has(g.key)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSelect(g.key)}
                className="h-4 w-4 cursor-pointer accent-primary"
                aria-label="Seleccionar"
              />
            ),
          },
          {
            key: "type",
            label: "Tipo",
            render: (g) => (
              <Badge variant={g.type === "product" ? "verified" : "draft"}>
                {TYPE[g.type] ?? g.type}
              </Badge>
            ),
          },
          {
            key: "target",
            label: "Reportado",
            sortable: false,
            render: (g) => (
              <span className="max-w-[220px] truncate text-on-surface">{targetCell(g)}</span>
            ),
          },
          {
            key: "count",
            label: "Reportes",
            render: (g) => (
              <Badge variant={severityVariant(g.count)}>
                <span className="inline-flex items-center gap-1">
                  <Flag size={11} />
                  {g.count}
                </span>
              </Badge>
            ),
          },
          {
            key: "reasons",
            label: "Motivos",
            sortable: false,
            render: (g) => {
              const visible = g.reasons.slice(0, 2).map((rk) => REASON[rk] ?? rk);
              const extra = g.reasons.length - visible.length;
              return (
                <div className="flex max-w-[220px] flex-wrap gap-1">
                  {visible.map((label) => (
                    <Badge key={label} variant="hide">
                      {label}
                    </Badge>
                  ))}
                  {extra > 0 && <Badge variant="draft">+{extra}</Badge>}
                </div>
              );
            },
          },
          {
            key: "status",
            label: "Estado",
            sortable: false,
            render: (g) => {
              const p = g.reports.filter((r) => r.status === "pending").length;
              const done = g.count - p;
              return (
                <span className="text-xs text-muted">
                  {p > 0 ? (
                    <>
                      <span className="font-semibold text-amber-600 dark:text-amber-300">{p}</span>{" "}
                      pendiente{p > 1 ? "s" : ""}
                    </>
                  ) : (
                    <span className="font-semibold text-emerald-600 dark:text-emerald-300">
                      Resuelto
                    </span>
                  )}
                  {done > 0 && p > 0 && ` · ${done} resuelto${done > 1 ? "s" : ""}`}
                </span>
              );
            },
          },
          { key: "latest", label: "Último", render: (g) => formatDate(g.latest) },
        ]}
      />

      {/* Detalle del grupo de reportes */}
      <Modal open={!!selected} onClose={closeReport} title={`Reportes · ${selected ? targetCell(selected) : ""}`}>
        {selected && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={selected.type === "product" ? "verified" : "draft"}>
                {TYPE[selected.type]}
              </Badge>
              <Badge variant={severityVariant(selected.count)}>
                <span className="inline-flex items-center gap-1">
                  <Flag size={11} /> {selected.count} reporte{selected.count > 1 ? "s" : ""}
                </span>
              </Badge>
              <span className="text-xs text-muted">Último: {formatDate(selected.latest)}</span>
            </div>

            {/* Target (producto o usuario) */}
            <div className="rounded-xl border border-outline-variant/30 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Reportado
              </p>
              {selected.type === "product" ? (
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-surface-container text-muted">
                    {selected.reports[0].product?.images?.[0]?.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveImage(selected.reports[0].product!.images![0].url)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Package size={18} />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium text-on-surface">
                    {selected.reports[0].product?.title ?? "Anuncio eliminado"}
                  </span>
                  {selected.reports[0].product && (
                    <a
                      href={`/product/${selected.reports[0].product!.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                    >
                      <ExternalLink size={14} /> Ver
                    </a>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary">
                    {selected.reports[0].reportedUser?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={resolveImage(selected.reports[0].reportedUser!.avatarUrl!)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon size={18} />
                    )}
                  </span>
                  <span className="flex-1 text-sm font-medium text-on-surface">
                    {selected.reports[0].reportedUser?.name ?? "Usuario eliminado"}
                  </span>
                  {selected.reports[0].reportedUser && (
                    <Link
                      href={`/admin/users/${selected.reports[0].reportedUser!.id}`}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-primary"
                    >
                      <ExternalLink size={14} /> Ver
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Acciones de moderación directas */}
            <div className="flex flex-wrap gap-2">
              {selected.type === "product" && selected.reports[0].product && (
                <button
                  onClick={moderateHideProduct}
                  disabled={hiding}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
                >
                  <EyeOff size={14} />
                  {hiding ? "Ocultando…" : "Ocultar anuncio"}
                </button>
              )}
              {selected.type === "user" && selected.reports[0].reportedUser && (
                <button
                  onClick={moderateSuspendUser}
                  disabled={suspending}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
                >
                  <Ban size={14} />
                  {suspending ? "Suspendiendo…" : "Suspender usuario"}
                </button>
              )}
            </div>

            {/* Lista de reportes del grupo */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Reportes ({selected.count})
              </p>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                {selected.reports.map((r) => (
                  <div
                    key={r.id}
                    className="rounded-xl border border-outline-variant/30 bg-surface-low p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="hide">{REASON[r.reason] ?? r.reason}</Badge>
                        <Badge variant={STATUS[r.status]?.variant ?? "draft"}>
                          {STATUS[r.status]?.label ?? r.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">{formatDate(r.createdAt)}</span>
                        <button
                          onClick={() => deleteOneReport(r.id)}
                          disabled={deleting}
                          aria-label="Eliminar reporte"
                          className="grid h-6 w-6 place-items-center rounded-md text-muted transition hover:bg-danger/10 hover:text-danger disabled:opacity-60"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      Reportado por <span className="font-medium text-on-surface">{r.reporter?.name ?? "—"}</span>
                    </p>
                    {r.description && (
                      <p className="mt-1 whitespace-pre-line text-sm text-on-surface-variant">
                        {r.description}
                      </p>
                    )}
                    {r.reviewedBy && (
                      <p className="mt-1 text-xs text-muted">
                        Revisado por{" "}
                        <span className="font-semibold text-on-surface-variant">
                          {r.reviewedBy.name}
                        </span>
                        {r.reviewedAt ? ` · ${formatDate(r.reviewedAt)}` : ""}
                      </p>
                    )}

                    {r.status === "pending" && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          onClick={() => setStatus(r.id, "dismissed")}
                          disabled={updating}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                        >
                          Descartar
                        </button>
                        <button
                          onClick={() => setStatus(r.id, "reviewed")}
                          disabled={updating}
                          className="inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-on-primary disabled:opacity-60"
                        >
                          Marcar revisado
                        </button>
                      </div>
                    )}
                    {r.status !== "pending" && (
                      <button
                        onClick={() => setStatus(r.id, "pending")}
                        disabled={updating}
                        className="mt-2 rounded-lg bg-surface-container px-3 py-1.5 text-xs font-medium disabled:opacity-60"
                      >
                        Reabrir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error de acción (per-reporte o en bloque) */}
            {actionError && <p className="text-sm text-danger">{actionError}</p>}

            {/* Acciones en bloque — solo mientras queden pendientes */}
            {pendingInGroup > 0 && (
              <div className="space-y-2 border-t border-outline-variant/30 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Resolver {pendingInGroup} pendiente{pendingInGroup > 1 ? "s" : ""}
                </p>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Nota interna opcional para todos los pendientes…"
                  className="w-full rounded-xl border border-outline-variant/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() => bulkSetStatus("dismissed")}
                    disabled={updating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-sm font-medium disabled:opacity-60"
                  >
                    {updating && <Spinner size={15} />} Descartar pendientes
                  </button>
                  <button
                    onClick={() => bulkSetStatus("reviewed")}
                    disabled={updating}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
                  >
                    {updating && <Spinner size={15} />} Revisar pendientes
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
