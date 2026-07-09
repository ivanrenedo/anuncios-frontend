"use client";

import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import PhoneVerificationModal from "./PhoneVerificationModal";

export default function PhoneVerificationGate() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const loading = useAuthStore((s) => s.loading);
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;
  if (loading || !isAuthenticated || !user) return null;
  if (user.phone) return null;

  return <PhoneVerificationModal />;
}
