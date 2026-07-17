"use client";

import { useRef, useState } from "react";
import { Download, X } from "lucide-react";
import Spinner from "@/components/Spinner";
import { API_URL, ADMIN_TOKEN_KEY } from "@/lib/config";

interface Props {
  /** Path segment on the export controller — e.g. "users" hits /export/users.csv */
  model: string;
  /** Label shown on the trigger button. Defaults to "Exportar". */
  label?: string;
}

/**
 * Popover trigger + CSV download for admin data models. The token lives in
 * localStorage (not a cookie), so we can't rely on a plain `<a href download>`
 * — the browser wouldn't attach the header. Instead we fetch → blob → object
 * URL → programmatic click, which is the standard pattern for header-auth
 * downloads.
 */
export default function ExportButton({ model, label = "Exportar" }: Props) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);

  const reset = () => {
    setOpen(false);
    setError("");
    setFrom("");
    setTo("");
  };

  const download = async () => {
    setError("");
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set("from", new Date(from).toISOString());
      if (to) params.set("to", new Date(to).toISOString());
      const qs = params.toString();
      const url = `${API_URL}/export/${model}.csv${qs ? `?${qs}` : ""}`;
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(ADMIN_TOKEN_KEY)
          : null;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Descarga falló (${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const filename = `${model}-${new Date().toISOString().slice(0, 10)}.csv`;
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke on next tick so the click has time to consume the URL.
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      reset();
    } catch (e: any) {
      setError(e?.message ?? "Error inesperado al descargar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={anchorRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-outline-variant/50 bg-surface-lowest px-3 py-2 text-sm font-medium text-on-surface transition hover:bg-surface-container"
      >
        <Download size={15} /> {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={reset} />
          <div className="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-outline-variant/40 bg-surface-lowest p-4 shadow-lg">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface">
                Exportar CSV
              </p>
              <button
                type="button"
                onClick={reset}
                className="rounded-lg p-1 text-muted hover:bg-surface-container"
              >
                <X size={14} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Desde
                </label>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-lowest px-2.5 py-1.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">
                  Hasta
                </label>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-lowest px-2.5 py-1.5 text-sm text-on-surface focus:border-primary focus:outline-none"
                />
              </div>
              <p className="text-xs text-muted">
                Deja vacío para exportar todos los registros.
              </p>
              {error && (
                <p className="rounded-lg bg-danger/10 px-2.5 py-1.5 text-xs text-danger">
                  {error}
                </p>
              )}
              <button
                type="button"
                onClick={download}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
              >
                {loading ? <Spinner size={14} /> : <Download size={14} />}
                Descargar CSV
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
