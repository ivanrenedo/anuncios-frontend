"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { BadgeCheck, User as UserIcon, X, Check, Clock, Trash2 } from "lucide-react";
import { GET_VERIFICATION_REQUESTS } from "@/graphql/queries";
import { APPROVE_VERIFICATION, REJECT_VERIFICATION, DELETE_VERIFICATION_REQUESTS } from "@/graphql/mutations";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import Modal from "@/components/admin/Modal";
import Spinner from "@/components/Spinner";
import { formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { getErrorMessage } from "@/lib/errors";

interface VUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  verified: boolean;
  location?: string | null;
  createdAt: string;
}

interface VerificationRequest {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  rejectedReason?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  user?: VUser | null;
  reviewedBy?: { id: string; name: string } | null;
}

const STATUS: Record<string, { label: string; variant: string }> = {
  pending: { label: "Pendiente", variant: "pending" },
  approved: { label: "Aprobada", variant: "active" },
  rejected: { label: "Rechazada", variant: "danger" },
};

export default function AdminVerifications() {
  const { data, loading, refetch } = useQuery(GET_VERIFICATION_REQUESTS) as {
    data: any;
    loading: boolean;
    refetch: () => void;
  };
  const [approveMut, { loading: approving }] = useMutation(APPROVE_VERIFICATION);
  const [rejectMut, { loading: rejecting }] = useMutation(REJECT_VERIFICATION);
  const [deleteMut, { loading: deleting }] = useMutation(DELETE_VERIFICATION_REQUESTS);

  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<VerificationRequest | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [rejectReason, setRejectReason] = useState("");
  const [actionError, setActionError] = useState("");

  const requests: VerificationRequest[] = data?.verificationRequests ?? [];
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const filtered =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  const openRequest = (r: VerificationRequest) => {
    setSelected(r);
    setRejectReason("");
    setActionError("");
  };
  const closeRequest = () => {
    setSelected(null);
    setRejectReason("");
    setActionError("");
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds((prev) =>
      prev.size === filtered.length && filtered.length > 0
        ? new Set()
        : new Set(filtered.map((r) => r.id)),
    );

  const runDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    setActionError("");
    try {
      await deleteMut({ variables: { ids } });
      await refetch();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      if (selected && ids.includes(selected.id)) closeRequest();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudieron eliminar las solicitudes."));
    }
  };

  const deleteSelected = () => {
    const ids = [...selectedIds];
    if (
      ids.length === 0 ||
      !confirm(`¿Eliminar ${ids.length} solicitud(es)? Esta acción no se puede deshacer.`)
    )
      return;
    runDelete(ids);
  };

  const approve = async () => {
    if (!selected) return;
    setActionError("");
    try {
      await approveMut({ variables: { id: selected.id } });
      await refetch();
      closeRequest();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo aprobar la solicitud."));
    }
  };

  const reject = async () => {
    if (!selected) return;
    setActionError("");
    try {
      await rejectMut({
        variables: { id: selected.id, reason: rejectReason.trim() || null },
      });
      await refetch();
      closeRequest();
    } catch (e) {
      setActionError(getErrorMessage(e, "No se pudo rechazar la solicitud."));
    }
  };

  const checklist = (u?: VUser | null) => {
    if (!u) return [];
    return [
      { label: "Teléfono verificado", ok: !!u.phone },
      { label: "Email confirmado", ok: !!u.email },
      { label: "Foto de perfil", ok: !!u.avatarUrl },
      { label: "Nombre completo", ok: !!u.name && u.name.trim().length >= 3 },
    ];
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">
          Verificaciones
        </h1>
        <p className="mt-1 text-sm text-muted">
          {requests.length} totales · {pendingCount} pendientes
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
          <option value="approved">Aprobadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-3 flex items-center justify-between rounded-xl border border-outline-variant/40 bg-surface-low px-4 py-2.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 cursor-pointer accent-primary"
            />
            {`${selectedIds.size} seleccionado${selectedIds.size > 1 ? "s" : ""}`}
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface-container"
            >
              Deseleccionar
            </button>
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {deleting ? <Spinner size={13} /> : <Trash2 size={13} />}
              Eliminar
            </button>
          </div>
        </div>
      )}

      <DataTable<VerificationRequest>
        loading={loading}
        data={filtered}
        pageSize={10}
        onRowClick={openRequest}
        emptyMessage="Sin solicitudes de verificación"
        columns={[
          {
            key: "select",
            label: "",
            sortable: false,
            render: (r) => (
              <input
                type="checkbox"
                checked={selectedIds.has(r.id)}
                onClick={(e) => e.stopPropagation()}
                onChange={() => toggleSelect(r.id)}
                className="h-4 w-4 cursor-pointer accent-primary"
              />
            ),
          },
          {
            key: "user",
            label: "Usuario",
            sortable: false,
            render: (r) => (
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary">
                  {r.user?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={resolveImage(r.user.avatarUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon size={16} />
                  )}
                </span>
                <span className="max-w-[180px] truncate text-sm font-medium text-on-surface">
                  {r.user?.name ?? "Usuario eliminado"}
                </span>
              </div>
            ),
          },
          {
            key: "email",
            label: "Email",
            render: (r) => (
              <span className="text-xs text-muted">{r.user?.email ?? "—"}</span>
            ),
          },
          {
            key: "status",
            label: "Estado",
            render: (r) => (
              <Badge variant={STATUS[r.status]?.variant ?? "draft"}>
                {STATUS[r.status]?.label ?? r.status}
              </Badge>
            ),
          },
          {
            key: "createdAt",
            label: "Solicitado",
            render: (r) => formatDate(r.createdAt),
          },
          {
            key: "reviewedAt",
            label: "Revisado",
            render: (r) =>
              r.reviewedAt ? formatDate(r.reviewedAt) : (
                <span className="text-xs text-muted">—</span>
              ),
          },
        ]}
      />

      {/* Detail modal */}
      <Modal
        open={!!selected}
        onClose={closeRequest}
        title="Solicitud de verificación"
      >
        {selected && (
          <div className="space-y-5">
            {/* User info */}
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary/15 text-primary">
                {selected.user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveImage(selected.user.avatarUrl)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserIcon size={24} />
                )}
              </span>
              <div>
                <p className="text-base font-bold text-on-surface">
                  {selected.user?.name ?? "—"}
                </p>
                <p className="text-xs text-muted">{selected.user?.email}</p>
                {selected.user?.location && (
                  <p className="text-xs text-muted">{selected.user.location}</p>
                )}
                <p className="text-xs text-muted">
                  Miembro desde {formatDate(selected.user?.createdAt ?? "")}
                </p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <Badge variant={STATUS[selected.status]?.variant ?? "draft"}>
                {STATUS[selected.status]?.label ?? selected.status}
              </Badge>
              {selected.reviewedBy && (
                <span className="text-xs text-muted">
                  por {selected.reviewedBy.name}
                  {selected.reviewedAt
                    ? ` · ${formatDate(selected.reviewedAt)}`
                    : ""}
                </span>
              )}
            </div>

            {selected.status === "rejected" && selected.rejectedReason && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">
                  Motivo del rechazo
                </p>
                <p className="mt-1 text-sm text-red-600 dark:text-red-200">
                  {selected.rejectedReason}
                </p>
              </div>
            )}

            {/* Checklist */}
            <div className="rounded-xl border border-outline-variant/30 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
                Requisitos
              </p>
              <div className="space-y-2">
                {checklist(selected.user).map((c) => (
                  <div key={c.label} className="flex items-center gap-2.5">
                    <span
                      className={`grid h-5 w-5 place-items-center rounded-full text-white ${
                        c.ok
                          ? "bg-emerald-500"
                          : "bg-gray-300 dark:bg-white/20"
                      }`}
                    >
                      {c.ok ? (
                        <Check size={12} strokeWidth={3} />
                      ) : (
                        <X size={12} strokeWidth={3} />
                      )}
                    </span>
                    <span
                      className={`text-sm ${
                        c.ok
                          ? "text-on-surface"
                          : "text-muted line-through"
                      }`}
                    >
                      {c.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error */}
            {actionError && (
              <p className="text-sm text-danger">{actionError}</p>
            )}

            {/* Actions - only for pending */}
            {selected.status === "pending" && (
              <div className="space-y-3 border-t border-outline-variant/30 pt-4">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Motivo del rechazo (opcional, solo si rechazas)…"
                  className="w-full rounded-xl border border-outline-variant/50 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={reject}
                    disabled={rejecting || approving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-container px-4 py-2 text-sm font-medium text-danger disabled:opacity-60"
                  >
                    {rejecting ? (
                      <Spinner size={15} />
                    ) : (
                      <X size={15} strokeWidth={2} />
                    )}
                    Rechazar
                  </button>
                  <button
                    onClick={approve}
                    disabled={approving || rejecting}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
                  >
                    {approving ? (
                      <Spinner size={15} />
                    ) : (
                      <BadgeCheck size={15} strokeWidth={2} />
                    )}
                    Aprobar verificación
                  </button>
                </div>
              </div>
            )}

            {/* Delete */}
            <div className="border-t border-outline-variant/30 pt-4">
              <button
                onClick={() => {
                  if (!confirm("¿Eliminar esta solicitud? Esta acción no se puede deshacer.")) return;
                  runDelete([selected.id]);
                }}
                disabled={deleting}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
              >
                {deleting ? <Spinner size={15} /> : <Trash2 size={15} />}
                Eliminar solicitud
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
