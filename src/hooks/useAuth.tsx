"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export type { AuthUser, GoogleProfile } from "@/store/authStore";

/**
 * Auth is backed by a Zustand store (see store/authStore.ts). This hook keeps
 * the previous `useAuth()` API so consumers don't change. Selecting fields
 * individually avoids returning a fresh object on every render.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const logout = useAuthStore((s) => s.logout);
  const refresh = useAuthStore((s) => s.refresh);
  return { user, loading, isAuthenticated, loginWithGoogle, logout, refresh };
}

/**
 * Mounted once near the root to hydrate the session from the stored token.
 * Replaces the old AuthProvider's mount effect.
 */
export function AuthHydrator() {
  const refresh = useAuthStore((s) => s.refresh);
  useEffect(() => {
    refresh();
  }, [refresh]);
  return null;
}
