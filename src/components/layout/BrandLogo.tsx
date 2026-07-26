interface BrandLogoProps {
  size?: number;
  showWordmark?: boolean;
  wordmarkClassName?: string;
}

/**
 * Bomelh brand mark + wordmark. Colors come from theme tokens
 * (--color-primary / --color-on-primary / --color-on-surface),
 * so light/dark switch happens automatically.
 */
export default function BrandLogo({
  size = 36,
  showWordmark = true,
  wordmarkClassName = "text-xl font-extrabold tracking-tight text-on-surface sm:text-2xl",
}: BrandLogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        aria-label="Bomelh"
        role="img"
      >
        <rect
          x="0"
          y="0"
          width="240"
          height="240"
          rx="54"
          ry="54"
          fill="var(--color-primary)"
        />
        <rect
          x="64"
          y="44"
          width="28"
          height="152"
          rx="6"
          fill="var(--color-on-primary)"
        />
        <circle cx="126" cy="140" r="56" fill="var(--color-on-primary)" />
        <circle cx="126" cy="140" r="22" fill="var(--color-primary)" />
      </svg>
      {showWordmark && (
        <span className={wordmarkClassName}>
          bomelh<span style={{ color: "var(--color-primary)" }}>.</span>
        </span>
      )}
    </div>
  );
}
