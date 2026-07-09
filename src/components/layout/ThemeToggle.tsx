"use client";

import { Monitor, Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

const ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const LABEL = { system: "Sistema", light: "Claro", dark: "Oscuro" } as const;

/** Cycles system → light → dark. Icon reflects the current preference. */
export default function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useThemeStore((s) => s.theme);
  const cycle = useThemeStore((s) => s.cycle);
  const Icon = ICON[theme];
  return (
    <button
      onClick={cycle}
      aria-label={`Tema: ${LABEL[theme]}`}
      title={`Tema: ${LABEL[theme]} (toca para cambiar)`}
      className={`grid h-10 w-10 place-items-center rounded-full text-on-surface-variant transition hover:bg-surface-container ${className}`}
    >
      <Icon size={19} strokeWidth={1.7} />
    </button>
  );
}
