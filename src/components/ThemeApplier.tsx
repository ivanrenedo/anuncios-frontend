"use client";

import { useEffect, useRef } from "react";
import { useThemeStore, type ThemeMode } from "@/store/themeStore";
import { useProfile } from "@/hooks/useProfile";

/** Sincroniza el store de tema con el DOM al montar. La clase ya viene
 *  aplicada pre-paint por el inline script del root layout (no flash).
 *
 *  Además, cuando el perfil autenticado carga y su `themePreference`
 *  difiere del tema aplicado localmente, adoptamos el de la BD — así el
 *  usuario ve su preferencia consistente entre dispositivos. Sólo lo
 *  hacemos una vez por sesión para no forcejear con cambios manuales
 *  posteriores en el mismo dispositivo. */
export default function ThemeApplier() {
  const init = useThemeStore((s) => s.init);
  const currentTheme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const { profile } = useProfile();
  const syncedRef = useRef(false);

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (syncedRef.current) return;
    const dbTheme = profile?.themePreference as ThemeMode | undefined;
    if (!dbTheme) return;
    if (dbTheme !== currentTheme) setTheme(dbTheme);
    syncedRef.current = true;
  }, [profile, currentTheme, setTheme]);

  return null;
}
