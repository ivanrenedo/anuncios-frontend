import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./useAuth";

/**
 * Redirects an authenticated user without a verified phone to the phone
 * verification flow. Skipped when the user is already on `/login`,
 * `/verify-phone` or `/edit-profile` so they can complete the flow (or edit
 * their number) without being bounced.
 *
 * Web equivalent of the React Native `usePhoneGate`. Instead of expo-router
 * segments we read the pathname via `usePathname` from `next/navigation`.
 */
export function usePhoneGate() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    const skipRoutes = ["/login", "/verify-phone", "/edit-profile"];
    const onSkipRoute = skipRoutes.some(
      (r) => pathname === r || pathname.startsWith(`${r}/`),
    );
    if (!user.phone && !onSkipRoute) {
      // The shop doesn't ship a `/verify-phone` full-page yet; nudge the
      // user to `/edit-profile` where the modal is triggered instead. Swap
      // to `/verify-phone` once that page is added.
      router.replace("/edit-profile");
    }
  }, [loading, isAuthenticated, user, pathname, router]);
}
