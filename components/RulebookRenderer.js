import { ChevronDown } from 'lucide-react';
import { submissionLink } from '@/lib/config';
import HeadingAnchor from './rulebook/HeadingAnchor';
import { navTitle } from './rulebook/nav';

/**
 * Renders the rulebook from the typed blocks in lib/rulebook.js, docs-style.
 * Sub-heading ids match subHeadings() in components/rulebook/nav.js.
 */
const text = (s) => String(s).replaceAll('{{SUBMISSION_LINK}}', submissionLink);
const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);

export function renderBlock(block, key, section) {
  switch (block.type) {
    case 'p':
      return <p key={key} className="text-[16px] leading-[1.85] text-ink-2">{text(block.text)}</p>;

    case 'list':
      return (
        <ul key={key} className="space-y-2.5">
          {block.items.map((item, i) => (
            <li key={i} className="relative pl-6 text-[16px] leading-[1.8] text-ink-2">
              <span aria-hidden className="absolute left-1.5 top-[0.8em] h-1.5 w-1.5 rounded-full bg-ink-4" />
              {text(item)}
            </li>
          ))}
        </ul>
      );

    case 'numbered':
      return (
        <ol key={key} className="space-y-3">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3.5 text-[16px] leading-[1.8] text-ink-2">
              <span className="mt-[3px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sunken font-display text-[13px] font-semibold text-ink">{bn(i + 1)}</span>
              <span className="min-w-0">{text(item)}</span>
            </li>
          ))}
        </ol>
      );

    case 'table':
      return (
        <div key={key} className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full border-collapse text-left text-[15px]">
            <tbody className="divide-y divide-line">
              {block.rows.map(([label, value], i) => (
                <tr key={i}>
                  <th scope="row" className="px-4 py-3 align-top font-semibold text-ink sm:w-[38%]">{text(label)}</th>
                  <td className="px-4 py-3 align-top leading-relaxed text-ink-2">{text(value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'steps':
      return (
        <ol key={key} className="relative space-y-8 border-l border-line pl-8">
          {block.items.map((step, i) => (
            <li key={i} className="relative">
              <span className="absolute -left-[45px] top-0 grid h-7 w-7 place-items-center rounded-full border border-line-strong bg-paper font-display text-[13px] font-semibold text-ink">
                {bn(i + 1)}
              </span>
              <h3 id={`${section.id}-${i + 1}`} className="group scroll-mt-36 text-lg font-semibold leading-snug lg:scroll-mt-24">
                {text(step.title).replace(/^ধাপ\s*[০-৯0-9]+:\s*/, '')}
                <HeadingAnchor id={`${section.id}-${i + 1}`} label={step.title} />
              </h3>
              <div className="mt-3 space-y-4">{step.blocks.map((b, j) => renderBlock(b, `${key}-${i}-${j}`, section))}</div>
            </li>
          ))}
        </ol>
      );

    case 'qa':
      return (
        <div key={key} className="divide-y divide-line rounded-xl border border-line bg-surface">
          {block.items.map((qa, i) => (
            <details key={i} id={`${section.id}-q${i + 1}`} className="group scroll-mt-36 lg:scroll-mt-24" open>
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {text(qa.q)}
                <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
              </summary>
              <p className="faq-answer px-5 pb-5 text-[15px] leading-relaxed text-ink-2">{text(qa.a)}</p>
            </details>
          ))}
        </div>
      );

    default:
      return null;
  }
}

export default function RulebookRenderer({ sections }) {
  return (
    <>
      {sections.map((section, i) => (
        <section key={section.id} id={section.id} className={`scroll-mt-36 lg:scroll-mt-20 ${i ? 'mt-14 border-t border-line pt-12' : ''}`}>
          <h2 className="group text-[1.65rem] font-bold leading-tight sm:text-3xl">
            {navTitle(section.title)}
            <HeadingAnchor id={section.id} label={navTitle(section.title)} />
          </h2>
          <div className="mt-6 space-y-5">{section.blocks.map((block, j) => renderBlock(block, `${section.id}-${j}`, section))}</div>
        </section>
      ))}
    </>
  );
}
