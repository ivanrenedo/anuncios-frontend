"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Search,
  Bell,
  Heart,
  Plus,
  LogIn,
  User,
  LayoutGrid,
} from "lucide-react";
import { useQuery } from "@apollo/client/react";
import { useAuth } from "@/hooks/useAuth";
import { resolveImage } from "@/lib/config";
import { UNREAD_COUNT, GET_CATEGORIES } from "@/graphql/queries";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [q, setQ] = useState("");

  // Unread notifications count
  const { data: unreadData } = useQuery(UNREAD_COUNT, {
    skip: !isAuthenticated,
    pollInterval: 30000, // poll every 30s
    fetchPolicy: "cache-and-network",
  }) as { data: any };
  const unreadCount = unreadData?.unreadNotificationsCount ?? 0;

  // Root categories for the pill bar
  const { data: catData } = useQuery(GET_CATEGORIES) as { data: any };
  const categories = catData?.categories ?? [];
  const rootCategories = categories.filter((c: any) => !c.parentId);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/explore?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/40 bg-surface/85 backdrop-blur-xl">
      {/* ── Main bar ─────────────────────────────────────────────── */}
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-sm font-extrabold text-on-primary">
            M
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight text-on-surface sm:block">
            Market EG
          </span>
        </Link>

        {/* Search (desktop) */}
        <form onSubmit={submit} className="relative hidden flex-1 sm:block">
          <div className="relative max-w-xl">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar productos, vehículos, inmuebles…"
              className="h-10 w-full rounded-full border border-outline-variant/50 bg-surface-lowest pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </form>

        {/* Desktop nav — icon buttons + actions */}
        <nav className="ml-auto hidden items-center gap-1 sm:flex">
          <Link
            href="/saved"
            aria-label="Favoritos"
            title="Favoritos"
            className="grid h-10 w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
          >
            <Heart size={20} strokeWidth={1.7} />
          </Link>
          {isAuthenticated && (
            <Link
              href="/notifications"
              aria-label="Notificaciones"
              title="Notificaciones"
              className="relative grid h-10 w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container hover:text-on-surface"
            >
              <Bell size={20} strokeWidth={1.6} />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}
          <ThemeToggle />
          <Link
            href="/post"
            className="ml-1 flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-soft transition hover:bg-primary/90"
          >
            <Plus size={17} strokeWidth={2.4} />
            Vender
          </Link>
          {isAuthenticated ? (
            <Link
              href="/profile"
              className="ml-1 grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-outline-variant/50"
              aria-label="Perfil"
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveImage(user.avatarUrl)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User size={20} className="text-on-surface-variant" />
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="ml-1 flex items-center gap-1.5 rounded-lg border border-outline-variant/50 bg-surface-lowest px-4 py-2 text-sm font-bold text-on-surface transition hover:bg-surface-container"
            >
              Entrar
            </Link>
          )}
        </nav>

        {/* Mobile right actions */}
        <div className="ml-auto flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <Link
            href="/explore"
            className="grid h-10 w-10 place-items-center rounded-full text-primary"
            aria-label="Buscar"
          >
            <Search size={22} strokeWidth={1.8} />
          </Link>
          {isAuthenticated ? (
            <Link
              href="/notifications"
              className="relative grid h-10 w-10 place-items-center rounded-full text-primary"
              aria-label="Notificaciones"
            >
              <Bell size={22} strokeWidth={1.6} />
              {unreadCount > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-bold text-on-primary"
            >
              <LogIn size={15} strokeWidth={2} />
              Entrar
            </Link>
          )}
        </div>
      </div>

      {/* ── Category pill bar ────────────────────────────────────── */}
      {rootCategories.length > 0 && (
        <div className="border-t border-outline-variant/30 bg-surface/60">
          <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-2 scrollbar-hide sm:px-4">
            <Link
              href="/explore"
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-semibold text-on-primary transition hover:bg-primary/90"
            >
              <LayoutGrid size={14} strokeWidth={2} />
              Todo
            </Link>
            {rootCategories.map((cat: any) => (
              <Link
                key={cat.id}
                href={`/explore?cat=${cat.slug}`}
                className="flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-muted transition hover:bg-surface-container hover:text-on-surface"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: cat.color || "#006b5e" }}
                />
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
