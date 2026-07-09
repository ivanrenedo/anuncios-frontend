"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Plus, Heart, User } from "lucide-react";

const tabs = [
  { href: "/", label: "Inicio", Icon: Home },
  { href: "/categories", label: "Categorías", Icon: LayoutGrid },
  { href: "/post", label: "Vender", Icon: Plus, primary: true },
  { href: "/saved", label: "Favorito", Icon: Heart },
  { href: "/profile", label: "Perfil", Icon: User },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/40 bg-surface/90 backdrop-blur-xl sm:hidden">
      <div className="flex h-16 items-center justify-around px-2 pb-1">
        {tabs.map(({ href, label, Icon, primary }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          if (primary) {
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center"
                aria-label={label}
              >
                <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-on-primary shadow-card">
                  <Plus size={26} strokeWidth={2.5} />
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-0.5"
            >
              <Icon
                size={23}
                strokeWidth={active ? 2.2 : 1.6}
                className={active ? "text-secondary" : "text-muted"}
                fill={
                  active && (label === "Inicio" || label === "Favorito" || label === "Perfil")
                    ? "currentColor"
                    : "transparent"
                }
              />
              <span
                className={`text-[10px] ${
                  active ? "font-bold text-secondary" : "text-muted"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
