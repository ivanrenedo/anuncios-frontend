"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Trash2 } from "lucide-react";
import { GET_ADMIN_ACTIONS } from "@/graphql/queries";
import { DELETE_ADMIN_ACTIONS } from "@/graphql/mutations";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import Spinner from "@/components/Spinner";
import ExportButton from "@/components/admin/ExportButton";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";
import { useAbilities } from "@/hooks/useAbilities";

interface AdminAction {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  detail?: string | null;
  createdAt: string;
  admin?: { id: string; name: string; avatarUrl?: string | null } | null;
}

const ACTION_LABELS: Record<string, { label: string; variant: string }> = {
  hide_product: { label: "Ocultó anuncio", variant: "danger" },
  restore_product: { label: "Restauró anuncio", variant: "active" },
  suspend_user: { label: "Suspendió usuario", variant: "danger" },
  unsuspend_user: { label: "Reactivó usuario", variant: "active" },
  boost: { label: "Destacó anuncio", variant: "sold" },
  unboost: { label: "Quitó destacado", variant: "draft" },
  bump: { label: "Bump", variant: "pending" },
  change_plan: { label: "Cambió plan", variant: "verified" },
  update_product: { label: "Editó anuncio", variant: "pending" },
  delete_image: { label: "Eliminó foto", variant: "danger" },
};

const TARGET_LABELS: Record<string, string> = {
  product: "Anuncio",
  user: "Usuario",
  payment: "Pago",
};

const PAGE_SIZE = 50;

export default function AdminAudit() {
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { isSuperAdmin } = useAbilities();

  const { data, loading, refetch } = useQuery(GET_ADMIN_ACTIONS, {
    variables: { take: PAGE_SIZE, skip: page * PAGE_SIZE },
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean; refetch: () => void };

  const [deleteAdminActions, { loading: deleting }] = useMutation(
    DELETE_ADMIN_ACTIONS,
  );

  const actions: AdminAction[] = data?.adminActions ?? [];

  const runDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    setActionError("");
    try {
      await deleteAdminActions({ variables: { ids } });
      // Drop selections that no longer point at existing rows.
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      await refetch();
    } catch (e) {
      setActionError(
        getErrorMessage(e, "No se pudieron eliminar los registros de auditoría."),
      );
    }
  };

  const deleteRow = (row: AdminAction) => {
    if (
      !confirm("¿Eliminar este registro de auditoría? Esta acción no se puede deshacer.")
    )
      return;
    runDelete([row.id]);
  };

  const deleteSelected = () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !confirm(
        `¿Eliminar ${ids.length} registro(s) de auditoría? Esta acción no se puede deshacer.`,
      )
    )
      return;
    runDelete(ids);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    setSelectedIds((prev) =>
      prev.size === actions.length && actions.length > 0
        ? new Set()
        : new Set(actions.map((a) => a.id)),
    );
  };

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-on-surface">Auditoría</h1>
          <p className="mt-1 text-sm text-muted">
            Registro de acciones administrativas — quién hizo qué y cuándo
          </p>
        </div>
        {isSuperAdmin && <ExportButton model="admin-actions" />}
      </div>

      {actionError && (
        <div className="mb-4 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          {actionError}
        </div>
      )}

      {isSuperAdmin && actions.length > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-low px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={selectedIds.size === actions.length && actions.length > 0}
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

      <DataTable<AdminAction>
        loading={loading}
        data={actions}
        pageSize={PAGE_SIZE}
        columns={[
          ...(isSuperAdmin
            ? [
                {
                  key: "select",
                  label: "",
                  sortable: false,
                  render: (a: AdminAction) => (
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={() => toggleSelect(a.id)}
                      className="h-4 w-4 cursor-pointer accent-primary"
                      aria-label="Seleccionar"
                    />
                  ),
                },
              ]
            : []),
          {
            key: "admin",
            label: "Admin",
            sortable: false,
            render: (a) => (
              <div className="flex items-center gap-2.5">
                {a.admin?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImage(a.admin.avatarUrl)} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {a.admin?.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <span className="text-sm font-medium text-on-surface">
                  {a.admin?.name ?? "—"}
                </span>
              </div>
            ),
          },
          {
            key: "action",
            label: "Acción",
            render: (a) => {
              const meta = ACTION_LABELS[a.action] ?? { label: a.action, variant: "draft" };
              return <Badge variant={meta.variant}>{meta.label}</Badge>;
            },
          },
          {
            key: "targetType",
            label: "Objetivo",
            render: (a) => TARGET_LABELS[a.targetType] ?? a.targetType,
          },
          {
            key: "detail",
            label: "Detalle",
            sortable: false,
            render: (a) => (
              <span className="block max-w-[280px] truncate text-sm text-on-surface-variant">
                {a.detail || "—"}
              </span>
            ),
          },
          { key: "createdAt", label: "Fecha", render: (a) => formatDate(a.createdAt) },
        ]}
        actions={
          isSuperAdmin
            ? (row) => (
                <button
                  type="button"
                  onClick={() => deleteRow(row)}
                  disabled={deleting}
                  title="Eliminar registro"
                  className="inline-grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-danger transition hover:bg-danger/10 disabled:opacity-40"
                >
                  {deleting ? <Spinner size={14} /> : <Trash2 size={15} />}
                </button>
              )
            : undefined
        }
      />

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0 || loading}
          className="h-9 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm font-medium transition hover:bg-surface-container disabled:opacity-40"
        >
          Anterior
        </button>
        <span className="text-sm text-muted">Página {page + 1}</span>
        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={actions.length < PAGE_SIZE || loading}
          className="h-9 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 text-sm font-medium transition hover:bg-surface-container disabled:opacity-40"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
