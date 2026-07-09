"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ChevronUp,
  ChevronDown,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Skeleton from "@/components/Skeleton";

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
}

export default function DataTable<T extends { id: string }>({
  data,
  columns,
  loading,
  onRowClick,
  actions,
  emptyMessage = "Sin datos",
  searchable = false,
  searchKeys,
  searchPlaceholder = "Buscar…",
  pageSize = 0,
}: {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => ReactNode;
  emptyMessage?: string;
  /** Show a search box that filters rows. */
  searchable?: boolean;
  /** Row keys to match against (defaults to all values). */
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  /** Rows per page. 0 (default) disables pagination. */
  pageSize?: number;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [asc, setAsc] = useState(true);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  // Reset to the first page when the filter or dataset size changes.
  useEffect(() => {
    setPage(0);
  }, [query, data.length]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!searchable || !q) return data;
    return data.filter((row) => {
      const keys = searchKeys ?? (Object.keys(row) as (keyof T)[]);
      return keys.some((k) => {
        const v = (row as Record<string, unknown>)[k as string];
        return v != null && String(v).toLowerCase().includes(q);
      });
    });
  }, [data, query, searchable, searchKeys]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortKey];
      const bv = (b as Record<string, unknown>)[sortKey];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (av < bv) return asc ? -1 : 1;
      if (av > bv) return asc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, asc]);

  const usePaging = pageSize > 0;
  const totalPages = usePaging
    ? Math.max(1, Math.ceil(sorted.length / pageSize))
    : 1;
  const current = Math.min(page, totalPages - 1);
  const rows = usePaging
    ? sorted.slice(current * pageSize, current * pageSize + pageSize)
    : sorted;

  const toggleSort = (key: string) => {
    if (sortKey === key) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  };

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-10 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      )}

      {loading && data.length === 0 ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-outline-variant/30 bg-surface-lowest">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface-low">
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      onClick={() => c.sortable !== false && toggleSort(c.key)}
                      className={`px-4 py-3 text-left font-semibold text-on-surface-variant ${
                        c.sortable !== false ? "cursor-pointer select-none" : ""
                      }`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        {sortKey === c.key &&
                          (asc ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                      </span>
                    </th>
                  ))}
                  {actions && (
                    <th className="px-4 py-3 text-right font-semibold text-on-surface-variant">
                      Acciones
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length + (actions ? 1 : 0)}
                      className="px-4 py-12 text-center text-muted"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => onRowClick?.(row)}
                      className={`border-b border-outline-variant/20 last:border-0 ${
                        onRowClick ? "cursor-pointer hover:bg-surface-container" : ""
                      }`}
                    >
                      {columns.map((c) => (
                        <td key={c.key} className="px-4 py-3 text-on-surface">
                          {c.render
                            ? c.render(row)
                            : String((row as Record<string, unknown>)[c.key] ?? "-")}
                        </td>
                      ))}
                      {actions && (
                        <td
                          className="px-4 py-3 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {actions(row)}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {usePaging && sorted.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted">
          <span>
            {current * pageSize + 1}–{Math.min((current + 1) * pageSize, sorted.length)} de{" "}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(current - 1)}
              disabled={current === 0}
              className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="px-2 font-medium text-on-surface">
              Página {current + 1} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage(current + 1)}
              disabled={current >= totalPages - 1}
              className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant/50 bg-surface-lowest text-on-surface transition hover:bg-surface-container disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
