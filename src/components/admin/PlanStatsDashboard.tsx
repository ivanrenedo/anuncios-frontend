"use client";

import { useQuery } from "@apollo/client/react";
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Users,
  BarChart3,
} from "lucide-react";
import { ADMIN_PLAN_STATS } from "@/graphql/queries";

const PLAN_LABELS: Record<string, string> = {
  FREE: "Gratis",
  BASIC: "Básico",
  STAR: "Estrella",
  PREMIUM: "Premium",
};

const PLAN_COLORS: Record<string, string> = {
  FREE: "#6B7280",
  BASIC: "#0EA5E9",
  STAR: "#F5A623",
  PREMIUM: "#7C3AED",
};

function fmtXaf(n: number): string {
  return new Intl.NumberFormat("es-ES").format(Math.round(n));
}

/**
 * v2 Fase 10d.2 — Dashboard superior de /admin/plans.
 *
 * Métricas del briefing:
 *   - MRR activo (sum PLAN_PRICES por usuario paid activo)
 *   - Distribución (% por plan)
 *   - Churn últimos 30d (proxy: paid expirados sin renovar)
 *   - Expirando próximos 7d (chase list)
 *   - Bar chart de activations por mes (últimos 6 meses)
 */
export default function PlanStatsDashboard() {
  const { data, loading } = useQuery(ADMIN_PLAN_STATS, {
    variables: { monthsBack: 6 },
    fetchPolicy: "cache-and-network",
  }) as { data: any; loading: boolean };

  const stats = data?.adminPlanStats;
  if (loading && !stats) {
    return (
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl bg-surface-container"
          />
        ))}
      </div>
    );
  }
  if (!stats) return null;

  const totalUsers = stats.distribution.reduce(
    (a: number, e: any) => a + e.count,
    0,
  );
  const maxMonthly = Math.max(
    1,
    ...stats.activationsByMonth.map((m: any) => m.revenue),
  );

  return (
    <div className="mb-8 space-y-4">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard
          icon={<TrendingUp size={18} />}
          color="#10B981"
          label="MRR activo"
          value={`${fmtXaf(stats.activeMrr)} XAF`}
          hint="Suma PLAN_PRICES por usuario paid activo"
        />
        <KpiCard
          icon={<Users size={18} />}
          color="#3B82F6"
          label="Usuarios paid"
          value={fmtXaf(
            stats.distribution
              .filter((e: any) => e.plan !== "FREE")
              .reduce((a: number, e: any) => a + e.count, 0),
          )}
          hint={`${totalUsers} totales`}
        />
        <KpiCard
          icon={<Clock size={18} />}
          color="#F5A623"
          label="Expiran en 7d"
          value={fmtXaf(stats.expiringNext7d)}
          hint="Chase list de renovaciones"
        />
        <KpiCard
          icon={<TrendingDown size={18} />}
          color="#EF4444"
          label="Churn 30d"
          value={fmtXaf(stats.churnedLast30d)}
          hint="Paid expirado sin renovar"
        />
      </div>

      {/* Distribution bar */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-on-surface">Distribución</p>
          <p className="text-xs text-on-surface-variant">
            {totalUsers} usuarios totales
          </p>
        </div>
        <div className="flex h-6 overflow-hidden rounded-lg">
          {stats.distribution.map((e: any) => {
            if (e.count === 0 || totalUsers === 0) return null;
            const pct = (e.count / totalUsers) * 100;
            return (
              <div
                key={e.plan}
                title={`${PLAN_LABELS[e.plan]}: ${e.count} (${pct.toFixed(1)}%)`}
                className="flex items-center justify-center text-[10px] font-bold text-white"
                style={{
                  width: `${pct}%`,
                  backgroundColor: PLAN_COLORS[e.plan],
                }}
              >
                {pct > 8 ? `${pct.toFixed(0)}%` : ""}
              </div>
            );
          })}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {stats.distribution.map((e: any) => (
            <span
              key={e.plan}
              className="inline-flex items-center gap-1.5 text-on-surface-variant"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: PLAN_COLORS[e.plan] }}
              />
              {PLAN_LABELS[e.plan]} · {e.count}
            </span>
          ))}
        </div>
      </div>

      {/* Activations by month bar chart */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          <p className="text-sm font-bold text-on-surface">
            Activaciones por mes
          </p>
          <span className="ml-auto text-xs text-on-surface-variant">
            Últimos 6 meses
          </span>
        </div>
        <div className="flex items-end gap-2 pt-4">
          {stats.activationsByMonth.map((m: any) => {
            const height = Math.max(2, (m.revenue / maxMonthly) * 100);
            return (
              <div key={m.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-on-surface">
                  {m.activations > 0 ? m.activations : ""}
                </span>
                <div
                  title={`${m.month} · ${m.activations} activaciones · ${fmtXaf(m.revenue)} XAF`}
                  className="w-full rounded-t bg-primary transition"
                  style={{ height: `${height}px` }}
                />
                <span className="text-[10px] text-on-surface-variant">
                  {m.month.slice(-2)}/{m.month.slice(2, 4)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 border-t border-outline-variant/30 pt-3 text-xs text-on-surface-variant">
          Total revenue últimos 6 meses:{" "}
          <strong className="text-on-surface">
            {fmtXaf(
              stats.activationsByMonth.reduce(
                (a: number, m: any) => a + m.revenue,
                0,
              ),
            )}{" "}
            XAF
          </strong>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  color,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4">
      <div className="mb-1 flex items-center gap-2">
        <span
          className="grid h-7 w-7 place-items-center rounded-lg"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {icon}
        </span>
        <span className="text-xs font-semibold text-on-surface-variant">
          {label}
        </span>
      </div>
      <p className="mt-1 text-xl font-extrabold text-on-surface">{value}</p>
      <p className="mt-0.5 text-[11px] text-on-surface-variant">{hint}</p>
    </div>
  );
}
