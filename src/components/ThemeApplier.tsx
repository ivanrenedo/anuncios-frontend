"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

/** Syncs the theme store with the DOM on mount. The actual class is already set
 *  pre-paint by the inline script in the root layout (no flash). */
export default function ThemeApplier() {
  const init = useThemeStore((s) => s.init);
  useEffect(() => {
    init();
  }, [init]);
  return null;
}
