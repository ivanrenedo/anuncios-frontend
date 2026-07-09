import { create } from "zustand";

export type ThemeMode = "system" | "light" | "dark";
type Resolved = "light" | "dark";

const STORAGE_KEY = "market_theme";

function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(mode: ThemeMode): Resolved {
  if (mode === "system") return systemPrefersDark() ? "dark" : "light";
  return mode;
}

function applyClass(resolved: Resolved) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

interface ThemeState {
  theme: ThemeMode;
  resolved: Resolved;
  /** Set the explicit preference and persist it. */
  setTheme: (mode: ThemeMode) => void;
  /** Cycle system → light → dark → system. */
  cycle: () => void;
  /** Read the stored preference and start watching the system scheme. */
  init: () => void;
}

let mediaBound = false;

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "system",
  resolved: "light",

  setTheme: (mode) => {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, mode);
    const resolved = resolve(mode);
    applyClass(resolved);
    set({ theme: mode, resolved });
  },

  cycle: () => {
    const order: ThemeMode[] = ["system", "light", "dark"];
    const next = order[(order.indexOf(get().theme) + 1) % order.length];
    get().setTheme(next);
  },

  init: () => {
    if (typeof window === "undefined") return;
    const stored = (localStorage.getItem(STORAGE_KEY) as ThemeMode) || "system";
    const resolved = resolve(stored);
    applyClass(resolved);
    set({ theme: stored, resolved });

    if (!mediaBound) {
      mediaBound = true;
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", () => {
          if (get().theme !== "system") return;
          const r = resolve("system");
          applyClass(r);
          set({ resolved: r });
        });
    }
  },
}));
