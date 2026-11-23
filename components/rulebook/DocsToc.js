'use client';

import { useState } from 'react';
import { ArrowUp, Check, Link2, Printer } from 'lucide-react';
import { useActiveId } from './useActiveId';

/** Right column: sub-headings of the section being read, key dates and page actions. */
export default function DocsToc({ nav, facts }) {
  const allSubIds = nav.order.flatMap((id) => nav.items[id].sub.map((s) => s.id));
  const section = useActiveId(nav.order);
  const sub = useActiveId(allSubIds);
  const current = nav.items[section];
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const url = `${location.origin}${location.pathname}#${section}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('লিংক কপি করুন:', url);
    }
  }

  return (
    <aside className="no-print sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto py-8 pl-2 xl:block">
      {current?.sub.length > 0 && (
        <nav aria-label="এই অংশে" className="mb-8">
          <p className="text-xs font-semibold text-ink">এই অংশে</p>
          <ul className="mt-3 space-y-2.5">
            {current.sub.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={`block text-[13px] leading-snug transition-colors ${sub === s.id ? 'font-medium text-brand' : 'text-ink-3 hover:text-ink'}`}
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-xs font-semibold text-ink">মনে রাখো</p>
        <dl className="mt-3 space-y-3">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-xs text-ink-3">{f.label}</dt>
              <dd className="mt-0.5 text-[13px] font-medium leading-snug text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-6 space-y-1 border-t border-line pt-4 text-[13px]">
        <button type="button" onClick={() => window.print()} className="flex w-full items-center gap-2 py-1.5 text-ink-3 transition-colors hover:text-ink">
          <Printer className="h-4 w-4" /> প্রিন্ট / PDF সেভ
        </button>
        <button type="button" onClick={copyLink} className="flex w-full items-center gap-2 py-1.5 text-ink-3 transition-colors hover:text-ink" aria-live="polite">
          {copied ? <Check className="h-4 w-4 text-green-700" /> : <Link2 className="h-4 w-4" />}
          {copied ? 'লিংক কপি হয়েছে' : 'এই অংশের লিংক কপি'}
        </button>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex w-full items-center gap-2 py-1.5 text-ink-3 transition-colors hover:text-ink">
          <ArrowUp className="h-4 w-4" /> উপরে ফিরুন
        </button>
      </div>
    </aside>
  );
}
