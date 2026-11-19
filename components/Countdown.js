'use client';

import { useEffect, useState } from 'react';
import { dates } from '@/lib/config';

const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).padStart(2, '0').replace(/\d/g, (d) => BN[d]);

function remaining() {
  const diff = new Date(dates.competitionStart).getTime() - Date.now();
  if (diff <= 0) return null;
  return [
    [Math.floor(diff / 86400000), 'দিন'],
    [Math.floor((diff / 3600000) % 24), 'ঘণ্টা'],
    [Math.floor((diff / 60000) % 60), 'মিনিট'],
    [Math.floor((diff / 1000) % 60), 'সেকেন্ড'],
  ];
}

/** Inline countdown to build day. Renders nothing until mounted, so no hydration mismatch. */
export default function Countdown() {
  const [parts, setParts] = useState(undefined);

  useEffect(() => {
    setParts(remaining());
    const id = setInterval(() => setParts(remaining()), 1000);
    return () => clearInterval(id);
  }, []);

  if (parts === undefined) return <div className="h-[52px]" aria-hidden />;
  if (parts === null) return null;

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
    <p className="text-sm text-ink-3">মূল প্রতিযোগিতা শুরু হতে বাকি</p>
    <div className="flex items-end gap-5" role="timer" aria-label="মূল প্রতিযোগিতা শুরু হতে বাকি">
      {parts.map(([value, label]) => (
        <div key={label}>
          <div className="font-display text-[28px] font-semibold leading-none tabular-nums text-ink">{bn(value)}</div>
          <div className="mt-1.5 text-xs text-ink-3">{label}</div>
        </div>
      ))}
    </div>
    </div>
  );
}
