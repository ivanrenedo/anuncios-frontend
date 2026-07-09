/**
 * Placeholder block shown while a query is loading. Compose several of these
 * to mirror the shape of the content being fetched. Pass Tailwind sizing /
 * shape utilities via `className` (e.g. "h-14 rounded-xl").
 */
export default function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container ${className}`}
      aria-hidden
    />
  );
}
