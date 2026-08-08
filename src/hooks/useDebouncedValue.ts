import { useEffect, useState } from "react";

/** Returns `value` delayed by `delay` ms, resetting the timer on every change.
 *  Used to coalesce keystrokes into a single downstream side-effect
 *  (e.g. a network query). */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
