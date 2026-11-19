import { submissionLink } from '@/lib/config';

/**
 * Renders one typed content block. Blocks are defined in lib/rulebook.js.
 * Keeping the renderer generic means the rulebook content stays in one file.
 */
function replaceTokens(text) {
  return String(text).replaceAll('{{SUBMISSION_LINK}}', submissionLink);
}

export function renderBlock(block, key) {
  switch (block.type) {
    case 'p':
      return (
        <p key={key} className="mb-4 text-[15px] leading-[1.9] text-ink-2 last:mb-0">
          {replaceTokens(block.text)}
        </p>
      );

    case 'list':
      return (
        <ul key={key} className="mb-4 list-disc space-y-2 pl-6 text-[15px] leading-[1.9] text-ink-2 marker:text-ink-3 last:mb-0">
          {block.items.map((item, i) => (
            <li key={i}>{replaceTokens(item)}</li>
          ))}
        </ul>
      );

    case 'numbered':
      return (
        <ol key={key} className="mb-4 list-decimal space-y-3 pl-6 text-[15px] leading-[1.9] text-ink-2 marker:font-bold marker:text-ink-3 last:mb-0">
          {block.items.map((item, i) => (
            <li key={i}>{replaceTokens(item)}</li>
          ))}
        </ol>
      );

    case 'table':
      return (
        <div key={key} className="mb-5 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[440px] border-collapse text-left text-[15px]">
            <tbody>
              {block.rows.map(([label, value], i) => (
                <tr key={i} className="border-b border-line last:border-0 odd:bg-paper">
                  <th className="w-2/5 px-4 py-3 align-top font-bold text-ink">
                    {replaceTokens(label)}
                  </th>
                  <td className="px-4 py-3 align-top leading-relaxed text-ink-2">
                    {replaceTokens(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'steps':
      return (
        <div key={key} className="space-y-7">
          {block.items.map((step, i) => (
            <div key={i} className="rounded-2xl border border-line bg-paper p-5">
              <h4 className="mb-3 flex items-center gap-2.5 text-base font-bold text-ink">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand text-xs font-bold text-ink">
                  {i + 1}
                </span>
                {replaceTokens(step.title)}
              </h4>
              <div>{step.blocks.map((b, j) => renderBlock(b, `${key}-${i}-${j}`))}</div>
            </div>
          ))}
        </div>
      );

    case 'qa':
      return (
        <div key={key} className="space-y-4">
          {block.items.map((qa, i) => (
            <div key={i} className="rounded-xl border border-line bg-paper p-4">
              <p className="font-bold text-ink">প্রশ্ন: {replaceTokens(qa.q)}</p>
              <p className="mt-2 text-[15px] leading-[1.9] text-ink-2">
                <span className="font-semibold text-brand">উত্তর:</span> {replaceTokens(qa.a)}
              </p>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
}

/**
 * Renders all rulebook sections. `section.id` is used for the anchor links in
 * the table of contents.
 */
export default function RulebookRenderer({ sections }) {
  return (
    <>
      {sections.map((section) => (
        <section key={section.id} id={section.id} className="mb-12 scroll-mt-24 last:mb-0">
          <h2 className="mb-5 border-b border-line pb-3 text-xl font-bold text-ink sm:text-2xl">
            {section.title}
          </h2>
          <div>{section.blocks.map((block, i) => renderBlock(block, `${section.id}-${i}`))}</div>
        </section>
      ))}
    </>
  );
}
