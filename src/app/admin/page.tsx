"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useQuery } from "@apollo/client/react";
import {
  Package,
  CheckCircle,
  Users,
  Flag,
  Store,
  Star,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import Link from "next/link";
import {
  GET_ALL_PRODUCTS,
  GET_USERS,
  GET_REPORTS,
  REVIEW_STATS,
  TOP_RATED_SELLERS,
} from "@/graphql/queries";
import StatCard from "@/components/admin/StatCard";
import Badge from "@/components/admin/Badge";
import Skeleton from "@/components/Skeleton";
import { formatDate } from "@/lib/format";
import type { Product } from "@/lib/types";

const AXIS = "#888780";
const C_AREA = "#1D9E75";
const C_BAR = "#378ADD";
const C_USERS = "#7F77DD";
const C_SELLER = "#D85A30";
const C_RATING = "#E0A82E";
const C_ACTIVE = "#639922";
const C_HIDDEN = "#BA7517";

type Gran = "dia" | "semana" | "mes" | "anio";

// Local YYYY-MM-DD key, ignoring timezones. Avoids toISOString(), which
// converts to UTC and can shift a date back by one day (e.g. a listing
// created on the 18th being counted toward the 19th in UTC+1).
function localDayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfWeek(dt: Date) {
  const d = new Date(dt);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setDate(d.getDate() - day);
  return d;
}

function buildSeries(items: { createdAt?: string | null }[], gran: Gran) {
  const now = new Date();
  if (gran === "dia") {
    const slots: { key: string; label: string }[] = [];
    const map: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const key = localDayKey(d);
      map[key] = 0;
      slots.push({
        key,
        label: d.toLocaleDateString("es", { day: "2-digit", month: "short" }),
      });
    }
    for (const it of items) {
      if (!it.createdAt) continue;
      const k = localDayKey(new Date(it.createdAt));
      if (k in map) map[k]++;
    }
    return slots.map((s) => ({ label: s.label, count: map[s.key] }));
  }
  if (gran === "semana") {
    const slots: { key: string; label: string }[] = [];
    const map: Record<string, number> = {};
    const base = startOfWeek(now);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(d.getDate() - i * 7);
      const key = localDayKey(d);
      map[key] = 0;
      slots.push({
        key,
        label: d.toLocaleDateString("es", { day: "2-digit", month: "short" }),
      });
    }
    for (const it of items) {
      if (!it.createdAt) continue;
      const k = localDayKey(startOfWeek(new Date(it.createdAt)));
      if (k in map) map[k]++;
    }
    return slots.map((s) => ({ label: s.label, count: map[s.key] }));
  }
  if (gran === "mes") {
    const slots: { key: string; label: string }[] = [];
    const map: Record<string, number> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = 0;
      slots.push({ key, label: d.toLocaleDateString("es", { month: "short" }) });
    }
    for (const it of items) {
      if (!it.createdAt) continue;
      const d = new Date(it.createdAt);
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      if (k in map) map[k]++;
    }
    return slots.map((s) => ({ label: s.label, count: map[s.key] }));
  }
  const map: Record<string, number> = {};
  for (const it of items) {
    if (!it.createdAt) continue;
    const y = String(new Date(it.createdAt).getFullYear());
    map[y] = (map[y] ?? 0) + 1;
  }
  return Object.keys(map)
    .sort()
    .map((y) => ({ label: y, count: map[y] }));
}

function GranToggle({
  value,
  onChange,
}: {
  value: Gran;
  onChange: (g: Gran) => void;
}) {
  return (
    <div className="inline-flex overflow-hidden rounded-lg border border-outline-variant/40">
      {(["dia", "semana", "mes", "anio"] as Gran[]).map((g, i) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`px-3 py-1.5 text-xs font-medium transition ${i > 0 ? "border-l border-outline-variant/40" : ""} ${value === g ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-low"}`}
        >
          {g === "dia" ? "Día" : g === "semana" ? "Semana" : g === "mes" ? "Mes" : "Año"}
        </button>
      ))}
    </div>
  );
}

/**
 * Measures its own width with a ResizeObserver and renders the chart with
 * explicit pixel dimensions. This avoids recharts' ResponsiveContainer
 * "width(-1) height(-1)" warning entirely (it never renders at -1).
 */
function ChartBox({
  height,
  children,
}: {
  height: number;
  children: (size: { width: number; height: number }) => ReactElement;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ width: "100%", height }}>
      {width > 0 ? children({ width, height }) : null}
    </div>
  );
}

// Top sellers by average rating, in a single batched query (the backend ranks
// and joins names — no per-seller round trips). `rating` drives the bar; the
// review `count` rides along for the tooltip.
function SellerRatingsChart() {
  const { data, loading } = useQuery(TOP_RATED_SELLERS, {
    variables: { limit: 10 },
  }) as { data?: any; loading: boolean };

  const rows = useMemo(
    () =>
      (data?.topRatedSellers ?? []).map((r: any) => ({
        label: r.name,
        rating: r.average,
        count: r.count,
      })),
    [data]
  );

  return (
    <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
      <h2 className="mb-4 text-base font-bold text-on-surface">Vendedores por valoración</h2>
      {loading ? (
        <Skeleton className="h-[240px] w-full" />
      ) : rows.length === 0 ? (
        <div className="flex h-[240px] items-center justify-center text-sm text-muted">
          Aún no hay valoraciones
        </div>
      ) : (
        <ChartBox height={240}>
          {({ width, height }) => (
            <BarChart width={width} height={height} data={rows} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} horizontal={false} />
              <XAxis type="number" domain={[0, 5]} ticks={[0, 1, 2, 3, 4, 5]} tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
              <Tooltip
                cursor={{ fill: AXIS, fillOpacity: 0.08 }}
                formatter={(value: any, _name: any, item: any) => [
                  `${Number(value).toFixed(1)} ★  ·  ${item?.payload?.count ?? 0} reseñas`,
                  "Valoración",
                ]}
              />
              <Bar dataKey="rating" name="Valoración" fill={C_RATING} radius={[0, 4, 4, 0]} barSize={16} />
            </BarChart>
          )}
        </ChartBox>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const { data, loading } = useQuery(GET_ALL_PRODUCTS, {
    variables: { take: 1000 },
  }) as { data: any; loading: boolean };
  const { data: userData } = useQuery(GET_USERS) as { data: any };
  const { data: reportData } = useQuery(GET_REPORTS) as { data: any };
  const { data: reviewStatsData, loading: reviewStatsLoading } = useQuery(REVIEW_STATS) as {
    data: any;
    loading: boolean;
  };

  const products: Product[] = data?.allProducts ?? [];
  const users: any[] = userData?.users ?? [];
  const reports: any[] = reportData?.reports ?? [];

  const [listingGran, setListingGran] = useState<Gran>("dia");
  const [userGran, setUserGran] = useState<Gran>("mes");

  const active = products.filter((p) => p.status === "active").length;
  const hidden = products.filter((p) => p.status === "hide").length;
  const sellers = new Set(products.map((p) => p.seller?.id).filter(Boolean)).size;
  const pendingReports = reports.filter((r) => r.status === "pending").length;

  const weekAgo = Date.now() - 7 * 86400000;
  const newProductsWeek = products.filter(
    (p) => p.createdAt && new Date(p.createdAt).getTime() >= weekAgo
  ).length;
  const newUsersWeek = users.filter(
    (u) => u.createdAt && new Date(u.createdAt).getTime() >= weekAgo
  ).length;

  function compactNumber(n: number) {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}D`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return Math.round(n).toLocaleString("es");
  }

  const listingSeries = useMemo(
    () => buildSeries(products, listingGran),
    [products, listingGran]
  );
  const userSeries = useMemo(
    () => buildSeries(users, userGran),
    [users, userGran]
  );
  const topCategories = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of products) {
      const l = p.category?.label ?? "Otros";
      m[l] = (m[l] ?? 0) + 1;
    }
    return Object.entries(m)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [products]);
  const topSellers = useMemo(() => {
    const m: Record<string, { name: string; views: number }> = {};
    for (const p of products) {
      const s = p.seller;
      if (!s?.id) continue;
      if (!m[s.id]) m[s.id] = { name: s.name ?? "—", views: 0 };
      m[s.id].views += p.views ?? 0;
    }
    return Object.values(m)
      .sort((a, b) => b.views - a.views)
      .slice(0, 6)
      .map((s) => ({ label: s.name, count: s.views }));
  }, [products]);

  const reviewStats = reviewStatsData?.reviewStats;
  const avgRating = reviewStats?.average;
  const reviewCount = reviewStats?.count ?? 0;

  const statusData = [
    { name: "Activos", value: active, color: C_ACTIVE },
    { name: "Ocultos", value: hidden, color: C_HIDDEN },
  ];

  const listingTotal = listingSeries.reduce((s, d) => s + d.count, 0);
  const userTotal = userSeries.reduce((s, d) => s + d.count, 0);
  const pendingList = reports.filter((r) => r.status === "pending").slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-on-surface">Dashboard</h1>
        <p className="mt-1 text-sm text-muted">Resumen general de Market EG</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Anuncios totales" value={loading ? <Skeleton className="mt-1 h-8 w-16" /> : compactNumber(products.length) } icon={<Package size={18} />} color="primary" trend={newProductsWeek ? `${newProductsWeek} esta semana` : undefined} />
        <StatCard label="Activos" value={loading ? <Skeleton className="mt-1 h-8 w-16" /> : compactNumber(active)} icon={<CheckCircle size={18} />} color="green" trend={products.length ? `${Math.round((active / products.length) * 100)}% del total` : undefined} />
        <StatCard label="Usuarios" value={ compactNumber(users.length)} icon={<Users size={18} />} color="blue" trend={newUsersWeek ? `${compactNumber(+newUsersWeek)} esta semana` : undefined} />
        <StatCard label="Reportes pendientes" value={compactNumber(pendingReports)} icon={<Flag size={18} />} color={pendingReports > 0 ? "orange" : "green"} trend={pendingReports > 0 ? "requieren revisión" : "todo al día"} />
        <StatCard label="Vendedores" value={compactNumber(sellers)} icon={<Store size={18} />} color="blue" />
        <StatCard
          label="Valoración media"
          value={
            reviewStatsLoading ? (
              <Skeleton className="mt-1 h-8 w-16" />
            ) : (
              <span className="inline-flex items-center gap-1">
                <Star size={20} className="text-amber-500" />
                {typeof avgRating === "number" ? avgRating.toFixed(1) : "—"}
              </span>
            )
          }
          icon={<Star size={18} />}
          color="amber"
          trend={reviewCount ? `${compactNumber(reviewCount)} reseñas` : undefined}
        />
      </div>

      {/* Listings over time (toggle) + status donut */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5 lg:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-on-surface">Anuncios publicados</h2>
              <p className="text-xs text-muted">{listingTotal.toLocaleString("es")} en el periodo</p>
            </div>
            <GranToggle value={listingGran} onChange={setListingGran} />
          </div>
          <ChartBox height={240}>
            {({ width, height }) => (
              <AreaChart width={width} height={height} data={listingSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="lcFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C_AREA} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={C_AREA} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <Tooltip cursor={{ stroke: AXIS, strokeOpacity: 0.3 }} />
                <Area type="monotone" dataKey="count" name="Anuncios" stroke={C_AREA} strokeWidth={2} fill="url(#lcFill)" />
              </AreaChart>
            )}
          </ChartBox>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
          <h2 className="mb-2 text-base font-bold text-on-surface">Por estado</h2>
          <ChartBox height={200}>
            {({ width, height }) => (
              <PieChart width={width} height={height}>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={2}>
                  {statusData.map((d) => (
                    <Cell key={d.name} fill={d.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            )}
          </ChartBox>
          <div className="mt-2 space-y-1 text-sm">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-on-surface-variant">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: d.color }} />
                  {d.name}
                </span>
                <span className="text-muted">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top categories + new users (toggle) */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
          <h2 className="mb-4 text-base font-bold text-on-surface">Top categorías</h2>
          <ChartBox height={240}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={topCategories} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={90} />
                <Tooltip cursor={{ fill: AXIS, fillOpacity: 0.08 }} />
                <Bar dataKey="count" name="Anuncios" fill={C_BAR} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            )}
          </ChartBox>
        </div>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-on-surface">Nuevos usuarios</h2>
              <p className="text-xs text-muted">{userTotal.toLocaleString("es")} en el periodo</p>
            </div>
            <GranToggle value={userGran} onChange={setUserGran} />
          </div>
          <ChartBox height={240}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={userSeries} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <Tooltip cursor={{ fill: AXIS, fillOpacity: 0.08 }} />
                <Bar dataKey="count" name="Usuarios" fill={C_USERS} radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            )}
          </ChartBox>
        </div>
      </div>

      {/* Top sellers by views + ratings */}
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
          <h2 className="mb-4 text-base font-bold text-on-surface">Vendedores por visitas</h2>
          <ChartBox height={240}>
            {({ width, height }) => (
              <BarChart width={width} height={height} data={topSellers} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={AXIS} strokeOpacity={0.15} horizontal={false} />
                <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="label" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                <Tooltip cursor={{ fill: AXIS, fillOpacity: 0.08 }} />
                <Bar dataKey="count" name="Visitas" fill={C_SELLER} radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            )}
          </ChartBox>
        </div>

        <SellerRatingsChart />
      </div>

      {/* Requires attention */}
      {pendingList.length > 0 && (
        <div className="mt-5 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-base font-bold text-on-surface">
              <AlertTriangle size={18} className="text-amber-500" />
              Requiere atención
            </h2>
            <Link href="/admin/reports" className="flex items-center gap-1 text-sm font-medium text-primary">
              Ver reportes <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {pendingList.map((r) => (
              <Link
                key={r.id}
                href="/admin/reports"
                className="flex items-center justify-between rounded-xl bg-surface-low px-4 py-2.5 text-sm transition hover:bg-surface-container"
              >
                <span className="flex items-center gap-2 text-on-surface">
                  <Badge variant={r.type === "product" ? "pending" : "sold"}>
                    {r.type === "product" ? "Anuncio" : "Usuario"}
                  </Badge>
                  <span className="truncate line-clamp w-xs overflow-hidden">
                    {r.product?.title || r.reportedUser?.name || "Reporte"} — {r.reason}
                  </span>
                </span>
                <span className="shrink-0 text-muted">{formatDate(r.createdAt)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
