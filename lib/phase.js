'use client';

import { useEffect, useState } from 'react';
import { dates } from './config';

const t = (iso) => new Date(iso).getTime();

/**
 * Where the competition is right now:
 * 'registration' → 'review' (closed, waiting for build day) → 'live' → 'judging'.
 */
export function phaseAt(now = Date.now()) {
  if (now < t(dates.registrationDeadline)) return 'registration';
  if (now < t(dates.competitionStart)) return 'review';
  if (now < t(dates.competitionEnd)) return 'live';
  return 'judging';
}

/** Client-only phase; the first render uses `fallback` so server and client markup match. */
export function usePhase(fallback = 'registration') {
  const [phase, setPhase] = useState(fallback);
  useEffect(() => {
    const tick = () => setPhase(phaseAt());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return phase;
}

export const PHASE_COPY = {
  registration: { label: 'রেজিস্ট্রেশন চলছে', note: `শেষ ${dates.registrationDeadlineLabel}` },
  review: { label: 'রেজিস্ট্রেশন বন্ধ', note: `মূল প্রতিযোগিতা ${dates.competitionStartLabel}` },
  live: { label: 'প্রতিযোগিতা চলছে', note: `জমা দেওয়ার শেষ ${dates.submissionDeadlineLabel}` },
  judging: { label: 'প্রতিযোগিতা শেষ', note: 'বিচার চলছে · ২৮ নভেম্বর সন্ধ্যায় ফলাফল' },
};
