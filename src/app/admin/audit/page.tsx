"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { GET_ADMIN_ACTIONS } from "@/graphql/queries";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";

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
  const { data, loading } = useQuery(GET_ADMIN_ACTIONS, {
    variables: { take: PAGE_SIZE, skip: page * PAGE_SIZE },
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean };

  const actions: AdminAction[] = data?.adminActions ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">Auditoría</h1>
        <p className="mt-1 text-sm text-muted">
          Registro de acciones administrativas — quién hizo qué y cuándo
        </p>
      </div>

      <DataTable<AdminAction>
        loading={loading}
        data={actions}
        pageSize={PAGE_SIZE}
        columns={[
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
