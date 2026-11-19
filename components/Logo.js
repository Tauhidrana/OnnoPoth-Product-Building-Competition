/** The official OnnoPoth mark (same paths as public/logo.svg), drawn in currentColor for light surfaces. */
export function Mark({ className = 'h-8 w-8', dot = '#2f5bea' }) {
  return (
    <svg viewBox="150 140 230 270" fill="none" aria-hidden="true" className={className}>
      <path d="M275 186 L207 255" stroke="currentColor" strokeWidth="26" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M207 255 C185 282 190 332 225 362 C265 395 322 377 342 332 C354 302 341 270 312 249"
        stroke="currentColor"
        strokeWidth="26"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="282" cy="175" r="19" fill={dot} />
    </svg>
  );
}

export default function Logo({ sub = true }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark className="h-8 w-8 text-ink" />
      <span className="leading-none">
        <span className="block font-display text-[17px] font-bold tracking-tight text-ink">OnnoPoth</span>
        {sub && <span className="mt-1 block text-[11px] font-medium text-ink-3">Product Building Competition</span>}
      </span>
    </span>
  );
}
