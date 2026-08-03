// WHAT: NeedFull brand mark (icon + wordmark) — single source for all shells
// WHY: Header and sidebar must render the identical logo; wordmark color is
//      themable via props since each surface has different text color

export function BrandMark({
  wordmarkClass = "text-gray-900 dark:text-white",
}: {
  wordmarkClass?: string;
}) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand text-gold"
        style={{ boxShadow: "inset 0 1px 0 rgba(234,163,37,0.3)" }}
      >
        <svg viewBox="0 3 36 30" fill="none" className="h-6 w-6" aria-hidden="true">
          <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18" />
          <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28" />
          <circle cx="23" cy="9" r="4" fill="currentColor" />
          <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M23 15.5l-7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9" />
          <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9" />
          <path d="M8 24.5l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
          <path d="M8 24.5l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
          <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
          <circle cx="16" cy="21" r="2.5" fill="currentColor" />
          <circle cx="16" cy="21" r="1.5" fill="#1A6B4A" />
        </svg>
      </span>
      <span className={`font-display text-lg font-extrabold leading-none ${wordmarkClass}`}>
        NeedFull
      </span>
    </span>
  );
}
