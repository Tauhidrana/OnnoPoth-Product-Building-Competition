/** Shared section header: a short label, the headline and one line of context. */
export default function SectionHeading({ eyebrow, title, subtitle, align = 'left', as: Tag = 'h2', children }) {
  const centered = align === 'center';
  return (
    <div data-reveal className={`max-w-2xl ${centered ? 'mx-auto text-center' : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Tag className="mt-3 text-[2rem] font-bold leading-[1.15] sm:text-[2.6rem]">{title}</Tag>
      {subtitle && <p className="mt-4 text-[17px] leading-relaxed text-ink-2">{subtitle}</p>}
      {children}
    </div>
  );
}
