"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { ADMIN_TOKEN_KEY } from "@/lib/config";
import ThemeToggle from "@/components/layout/ThemeToggle";
import BrandLogo from "@/components/layout/BrandLogo";
import Spinner from "@/components/Spinner";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo iniciar sesión");
        return;
      }
      localStorage.setItem(ADMIN_TOKEN_KEY, data.token);
      router.push("/admin");
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center bg-linear-to-br from-surface via-surface-low to-primary-soft px-4">
      <ThemeToggle className="absolute right-4 top-4" />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo size={64} showWordmark={false} />
          <h1 className="mt-4 text-3xl font-extrabold text-on-surface">
            bomell<span style={{ color: "var(--color-primary)" }}>.</span>
          </h1>
          <p className="mt-1 text-muted">Panel de administración</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl bg-surface-lowest p-8 shadow-card"
        >
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bomell.com"
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest px-4 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              PIN secreto
            </label>
            <div className="relative">
              <Lock
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              />
              <input
                type="password"
                required
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                className="h-11 w-full rounded-xl border border-outline-variant/50 bg-surface-lowest pl-10 pr-4 text-sm tracking-[0.3em] text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-on-primary transition hover:opacity-90 disabled:opacity-50"
          >
            {loading && <Spinner size={16} />}
            {loading ? "Verificando…" : "Acceder al panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
