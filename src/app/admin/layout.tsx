"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQuery } from "@apollo/client/react";
import Sidebar from "@/components/admin/Sidebar";
import { ADMIN_TOKEN_KEY } from "@/lib/config";
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

  // Read the token after mount to avoid SSR/hydration mismatch.
  const [mounted, setMounted] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    setMounted(true);
    setToken(localStorage.getItem(ADMIN_TOKEN_KEY));
  }, []);

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
