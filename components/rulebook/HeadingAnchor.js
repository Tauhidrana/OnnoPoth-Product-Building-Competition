'use client';

import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';

/** "#" button beside a heading: updates the URL and copies a direct link. */
export default function HeadingAnchor({ id, label }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        const url = `${location.origin}${location.pathname}#${id}`;
        history.replaceState(null, '', `#${id}`);
        try {
          await navigator.clipboard.writeText(url);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
      aria-label={`${label} — লিংক কপি করুন`}
      className="no-print ml-2 inline-grid h-7 w-7 translate-y-[-2px] place-items-center rounded-md align-middle text-ink-4 opacity-0 transition hover:bg-sunken hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
    >
      {done ? <Check className="h-4 w-4 text-green-700" /> : <Link2 className="h-4 w-4" />}
    </button>
  );
}
