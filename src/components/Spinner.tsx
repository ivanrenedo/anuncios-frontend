import { Loader2 } from "lucide-react";

/**
 * Spinning loader for in-flight actions (form submit, create/update/delete
 * mutations). Inherits `currentColor`, so it adopts the text color of its
 * container (e.g. `text-on-primary` inside a primary button).
 */
export default function Spinner({
  size = 16,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Loader2
      size={size}
      className={`animate-spin ${className}`}
      aria-hidden
    />
  );
}
