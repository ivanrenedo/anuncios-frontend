"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { Wallet, TrendingUp, Trash2 } from "lucide-react";
import { GET_PAYMENTS } from "@/graphql/queries";
import { DELETE_PAYMENT } from "@/graphql/mutations";
import DataTable from "@/components/admin/DataTable";
import Badge from "@/components/admin/Badge";
import Modal from "@/components/admin/Modal";
import Spinner from "@/components/Spinner";
import { formatPrice, formatDate } from "@/lib/format";
import { resolveImage } from "@/lib/config";
import { useAbilities } from "@/hooks/useAbilities";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  concept: string;
  note?: string | null;
  productId?: string | null;
  createdAt: string;
  user?: { id: string; name: string; email?: string; avatarUrl?: string | null };
  createdBy?: { id: string; name: string } | null;
}

const CONCEPTS: Record<string, { label: string; variant: string }> = {
  plan_star: { label: "Plan Estrella", variant: "verified" },
  plan_premium: { label: "Plan Premium", variant: "active" },
  boost: { label: "Destacado", variant: "draft" },
};

export default function AdminPayments() {
  const { data, loading, refetch } = useQuery(GET_PAYMENTS, {
    variables: { take: 500 },
  }) as { data: any; loading: boolean; refetch: () => void };
  const [deletePayment, { loading: deleting }] = useMutation(DELETE_PAYMENT);
  const { can } = useAbilities();
  const canDelete = can("delete");
  const [confirm, setConfirm] = useState<Payment | null>(null);

  const payments: Payment[] = data?.payments ?? [];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTotal = payments
    .filter((p) => new Date(p.createdAt) >= monthStart)
    .reduce((s, p) => s + Number(p.amount), 0);
  const allTotal = payments.reduce((s, p) => s + Number(p.amount), 0);

  // Last 6 months of revenue, oldest first, for the bar chart.
  const monthly = Array.from({ length: 6 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const total = payments
      .filter((p) => {
        const d = new Date(p.createdAt);
        return d >= start && d < end;
      })
      .reduce((s, p) => s + Number(p.amount), 0);
    return {
      label: start.toLocaleDateString("es-ES", { month: "short" }),
      total,
    };
  });
  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));

  const byConcept = payments.reduce<Record<string, number>>((acc, p) => {
    acc[p.concept] = (acc[p.concept] ?? 0) + Number(p.amount);
    return acc;
  }, {});

  const doDelete = async () => {
    if (!confirm) return;
    try {
      await deletePayment({ variables: { id: confirm.id } });
      setConfirm(null);
      refetch();
    } catch {
      /* ignore */
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-on-surface">Pagos</h1>
        <p className="mt-1 text-sm text-muted">
          Registro de pagos manuales — se crea uno al activar un plan o un destacado
        </p>
      </div>

      {/* Totals */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <TrendingUp size={20} />
          </span>
          <div>
            <p className="text-xs text-muted">
              Ingresos de {now.toLocaleDateString("es-ES", { month: "long", year: "numeric" })}
            </p>
            <p className="text-xl font-extrabold text-on-surface">{formatPrice(monthTotal)}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Wallet size={20} />
          </span>
          <div>
            <p className="text-xs text-muted">Ingresos totales ({payments.length} pagos)</p>
            <p className="text-xl font-extrabold text-on-surface">{formatPrice(allTotal)}</p>
          </div>
        </div>
      </div>

      {/* Revenue chart + concept breakdown */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4 lg:col-span-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Ingresos últimos 6 meses
          </p>
          <div className="flex h-36 items-end gap-3">
            {monthly.map((m, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[11px] font-semibold text-on-surface-variant">
                  {m.total > 0 ? formatPrice(m.total) : ""}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-primary/70 transition-all"
                    style={{ height: `${Math.max(m.total > 0 ? 6 : 2, (m.total / maxMonthly) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Por concepto
          </p>
          <div className="space-y-2.5">
            {Object.entries(CONCEPTS).map(([key, c]) => (
              <div key={key} className="flex items-center justify-between gap-2">
                <Badge variant={c.variant}>{c.label}</Badge>
                <span className="text-sm font-semibold text-on-surface">
                  {formatPrice(byConcept[key] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DataTable<Payment>
        loading={loading}
        data={payments}
        pageSize={15}
        columns={[
          {
            key: "user",
            label: "Usuario",
            sortable: false,
            render: (p) => (
              <div className="flex items-center gap-3">
                {p.user?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={resolveImage(p.user.avatarUrl)} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
                    {p.user?.name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div>
                  <p className="font-medium text-on-surface">{p.user?.name ?? "—"}</p>
                  <p className="text-xs text-muted">{p.user?.email}</p>
                </div>
              </div>
            ),
          },
          {
            key: "concept",
            label: "Concepto",
            render: (p) => {
              const c = CONCEPTS[p.concept] ?? { label: p.concept, variant: "draft" };
              return <Badge variant={c.variant}>{c.label}</Badge>;
            },
          },
          {
            key: "amount",
            label: "Importe",
            render: (p) => (
              <span className="font-semibold text-on-surface">{formatPrice(Number(p.amount))}</span>
            ),
          },
          { key: "note", label: "Nota", render: (p) => p.note || "—", sortable: false },
          {
            key: "createdBy",
            label: "Registrado por",
            sortable: false,
            render: (p) => p.createdBy?.name ?? "—",
          },
          { key: "createdAt", label: "Fecha", render: (p) => formatDate(p.createdAt) },
        ]}
        actions={
          canDelete
            ? (p) => (
                <button
                  onClick={() => setConfirm(p)}
                  className="rounded-lg bg-danger-soft px-3 py-1.5 text-xs font-medium text-danger"
                >
                  <Trash2 size={13} />
                </button>
              )
            : undefined
        }
      />

      {/* Confirm delete */}
      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Eliminar pago">
        <p className="mb-4 text-sm text-muted">
          ¿Eliminar el pago de {confirm ? formatPrice(Number(confirm.amount)) : ""} de “
          {confirm?.user?.name}”? Úsalo solo para corregir errores de registro.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setConfirm(null)}
            className="rounded-xl bg-surface-container px-4 py-2 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={doDelete}
            disabled={deleting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-danger px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {deleting && <Spinner size={15} />}
            {deleting ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
