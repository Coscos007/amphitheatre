export function ArenaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 520 320" className={className} aria-hidden="true">
      <path
        d="M40 280 V150 A220 220 0 0 1 480 150 V280"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="text-accent"
      />
      <path
        d="M90 280 V170 A170 170 0 0 1 430 170 V280"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-ink-muted"
      />
      <path
        d="M140 280 V190 A120 120 0 0 1 380 190 V280"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-ink-subtle"
      />
      <path d="M20 288 H500" stroke="currentColor" strokeWidth="4" className="text-accent" />
      <rect x="232" y="210" width="56" height="78" fill="none" stroke="currentColor" className="text-accent" />
    </svg>
  );
}
