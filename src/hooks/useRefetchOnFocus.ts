import { useEffect, useRef } from "react";

type Refetcher = (() => Promise<unknown>) | (() => unknown);

/**
 * Runs the given refetch functions when the browser tab regains focus or
 * becomes visible again (returning from another tab, unminimising the window,
 * unlocking the phone). The initial mount is skipped because Apollo's first
 * query already runs then — refetching again would just double-fetch on cold
 * boot.
 *
 * Web equivalent of the React Native version in mobile/hooks: instead of
 * `useIsFocused` from React Navigation, we listen to `visibilitychange` on
 * `document` and `focus` on `window`, which together cover every real "user
 * came back to the page" transition.
 *
 * Callers may pass a single refetcher or an array literal — no need to
 * `useCallback`/`useMemo`; the latest reference is stashed in a ref so
 * changes across renders don't retrigger the effect.
 */
export function useRefetchOnFocus(refetchers: Refetcher | Refetcher[]) {
  const firstFocus = useRef(true);
  const latest = useRef(refetchers);
  latest.current = refetchers;

  useEffect(() => {
    // In SSR/prerender there is no window; abort silently.
    if (typeof window === "undefined") return;

    const trigger = () => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      const list = Array.isArray(latest.current)
        ? latest.current
        : [latest.current];
      // Fire-and-forget: focus refetch is a UX freshness signal, not a
      // blocking load. Errors are swallowed so a stale token (401 on
      // refetch) doesn't crash the screen.
      Promise.allSettled(
        list.map((fn) => Promise.resolve().then(() => fn())),
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") trigger();
    };

    // Fire once on mount so the first-focus flag flips even if the user
    // never blurs the tab (the effect must have run for the ref to update).
    trigger();

    window.addEventListener("focus", trigger);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", trigger);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);
}
