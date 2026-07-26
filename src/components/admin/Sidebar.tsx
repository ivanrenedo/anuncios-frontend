"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  BadgeCheck,
  Crown,
  Package,
  Tags,
  Star,
  Flag,
  Home,
  Bell,
  User,
  LogOut,
  ExternalLink,
  Monitor,
  Sun,
  Moon,
  ChevronsUpDown,
  ChevronDown,
  Wallet,
  ScrollText,
} from "lucide-react";
import { ADMIN_TOKEN_KEY, resolveImage } from "@/lib/config";
import { ADMIN_ME } from "@/graphql/queries";
import { useThemeStore } from "@/store/themeStore";
import BrandLogo from "@/components/layout/BrandLogo";

const THEME_ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const THEME_LABEL = { system: "Sistema", light: "Claro", dark: "Oscuro" } as const;

type NavItem = { href: string; label: string; Icon: any; exact?: boolean };
type NavSection = { title: string; items: NavItem[] };

const fixedLinks: NavItem[] = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, exact: true },
];

const sections: NavSection[] = [
  {
    title: "Usuarios",
    items: [
      { href: "/admin/users", label: "Usuarios", Icon: Users },
      { href: "/admin/roles", label: "Roles", Icon: ShieldCheck },
      { href: "/admin/verifications", label: "Verificaciones", Icon: BadgeCheck },
      { href: "/admin/plans", label: "Planes", Icon: Crown },
      { href: "/admin/payments", label: "Pagos", Icon: Wallet },
    ],
  },
  {
    title: "Catálogo",
    items: [
      { href: "/admin/products", label: "Anuncios", Icon: Package },
      { href: "/admin/categories", label: "Categorías", Icon: Tags },
      { href: "/admin/reviews", label: "Valoraciones", Icon: Star },
    ],
  },
  {
    title: "Moderación",
    items: [
      { href: "/admin/reports", label: "Reportes", Icon: Flag },
      { href: "/admin/audit", label: "Auditoría", Icon: ScrollText },
    ],
  },
  {
    title: "App",
    items: [
      { href: "/admin/home", label: "Home app", Icon: Home },
      { href: "/admin/notifications", label: "Notificaciones", Icon: Bell },
    ],
  },
];

const ITEM_CLASS =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const theme = useThemeStore((s) => s.theme);
  const cycleTheme = useThemeStore((s) => s.cycle);
  const ThemeIcon = THEME_ICON[theme];

  const { data } = useQuery(ADMIN_ME) as { data: any };
  const me = data?.me;
  const name: string = me?.name ?? "Admin";
  const email: string = me?.email ?? "";
  const avatar = me?.avatarUrl ? resolveImage(me.avatarUrl) : null;
  const initial = (name.trim()[0] ?? "A").toUpperCase();

  const initialOpen = () => {
    const set = new Set<string>();
    for (const s of sections) {
      if (s.items.some(({ href, exact }) => exact ? pathname === href : pathname.startsWith(href))) {
        set.add(s.title);
      }
    }
    return set;
  };
  const [openSections, setOpenSections] = useState<Set<string>>(initialOpen);
  const toggleSection = (title: string) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });

  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const logout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    router.push("/admin/login");
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-outline-variant/30 bg-surface-lowest">
      <Link href="/admin" className="flex items-center gap-2 px-6 py-5" aria-label="Bomelh admin — inicio">
        <BrandLogo size={36} showWordmark={false} />
        <div>
          <p className="text-sm font-extrabold leading-tight text-on-surface">
            bomelh<span style={{ color: "var(--color-primary)" }}>.</span>
          </p>
          <p className="text-xs text-muted">Panel admin</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {fixedLinks.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-container"
              }`}
            >
              <Icon size={19} strokeWidth={1.8} />
              {label}
            </Link>
          );
        })}

        {sections.map((section) => {
          const isOpen = openSections.has(section.title);
          const hasActive = section.items.some(({ href, exact }) =>
            exact ? pathname === href : pathname.startsWith(href),
          );
          return (
            <div key={section.title} className="mt-1">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-widest transition hover:bg-surface-container ${
                  hasActive ? "text-primary" : "text-muted"
                }`}
              >
                {section.title}
                <ChevronDown
                  size={14}
                  strokeWidth={2}
                  className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-0.5 pb-1">
                  {section.items.map(({ href, label, Icon, exact }) => {
                    const active = exact ? pathname === href : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 pl-5 text-sm font-semibold transition ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-on-surface-variant hover:bg-surface-container"
                        }`}
                      >
                        <Icon size={18} strokeWidth={1.8} />
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      <div ref={menuRef} className="relative border-t border-outline-variant/30 p-3">
        {open && (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 mb-2 space-y-1 rounded-2xl border border-outline-variant/30 bg-surface-lowest p-1.5 shadow-lg"
          >
            <Link href="/admin/profile" role="menuitem" onClick={() => setOpen(false)} className={ITEM_CLASS}>
              <User size={18} /> Mi Perfil
            </Link>
            <Link href="/" role="menuitem" onClick={() => setOpen(false)} className={ITEM_CLASS}>
              <ExternalLink size={18} /> Ver tienda
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={cycleTheme}
              title={`Tema: ${THEME_LABEL[theme]} (toca para cambiar)`}
              className={`${ITEM_CLASS} cursor-pointer`}
            >
              <ThemeIcon size={18} /> Tema · {THEME_LABEL[theme]}
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger-soft"
            >
              <LogOut size={18} /> Cerrar sesión
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-surface-container"
        >
          {avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
              {initial}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-on-surface">{name}</p>
            {email && <p className="truncate text-xs text-muted">{email}</p>}
          </div>
          <ChevronsUpDown size={16} className="shrink-0 text-muted" />
        </button>
      </div>
    </aside>
  );
}
