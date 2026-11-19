'use client';

import { usePhase, PHASE_COPY } from '@/lib/phase';

/** "What's happening now" pill, driven by the real dates in lib/config.js. */
export default function PhaseBadge() {
  const phase = usePhase();
  const copy = PHASE_COPY[phase];
  const live = phase === 'registration' || phase === 'live';
  return (
    <span className="chip !py-1.5">
      {live ? <span className="live-dot" /> : <span className="h-2 w-2 rounded-full bg-ink-4" />}
      <span className="font-semibold text-ink">{copy.label}</span>
      <span className="hidden text-ink-3 sm:inline">· {copy.note}</span>
    </span>
  );
}
