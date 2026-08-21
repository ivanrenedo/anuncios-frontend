"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import Sidebar from "@/components/admin/Sidebar";
import { ADMIN_AUTH_EVENT, ADMIN_TOKEN_KEY } from "@/lib/config";
import { ADMIN_ME } from "@/graphql/queries";
import Spinner from "@/components/Spinner";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isLogin = pathname === "/admin/login";

  // Read the token after mount to avoid SSR/hydration mismatch. This layout
  // persists between /admin/login and /admin, so keep it synced explicitly.
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const syncToken = () => setToken(localStorage.getItem(ADMIN_TOKEN_KEY));

    setMounted(true);
    syncToken();

    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_TOKEN_KEY) syncToken();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(ADMIN_AUTH_EVENT, syncToken);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(ADMIN_AUTH_EVENT, syncToken);
    };
  }, [pathname]);

  // Validate the session: the account must still have panel access (GRANTED).
  // This stops AdminGuard-protected pages from firing with a stale/insufficient
  // token (which would return "Forbidden").
  const { data, loading } = useQuery(ADMIN_ME, {
    skip: isLogin || !token,
    fetchPolicy: "network-only",
    // Surface auth errors on the result instead of rejecting (which would log
    // an unhandled rejection); we react to them in the effect below.
    errorPolicy: "all",
  }) as { data: any; loading: boolean };

  const granted = data?.me?.permission === "GRANTED" && !!data?.me?.rolId;

  useEffect(() => {
    if (isLogin || !mounted) return;
    if (!token) {
      router.replace("/admin/login");
      return;
    }
    if (loading) return;
    if (!granted) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
      router.replace("/admin/login");
    }
  }, [isLogin, mounted, token, loading, granted, router]);

  if (isLogin) return <>{children}</>;

  if (!mounted || !token || loading || !granted) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-low text-muted">
        <Spinner size={50} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-low">
      <Sidebar />
      <main className="ml-64 p-8">{children}</main>
    </div>
  );
}
