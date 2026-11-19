import Link from 'next/link';
import { Crown, Medal, Award, Clock3, Trophy, BarChart3 } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { results as configResults, judgingCriteria, prizes, dates } from '@/lib/config';
import { getRecords } from '@/lib/gmail-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ফলাফল',
  description: 'Product Building Competition (Using AI) — চূড়ান্ত ফলাফল ও বিচারের মানদণ্ড।',
};

const ICONS = { gold: Crown, silver: Medal, bronze: Award };

export default async function ResultsPage() {
  let results = configResults || [];
  try {
    const stored = await getRecords();
    if (stored.results?.length) results = stored.results[0].winners || [];
  } catch {
    // Fall back to config values if Gmail is unreachable.
  }

  return (
    <div className="min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Results"
          title="চূড়ান্ত ফলাফল"
          subtitle="২৮ নভেম্বর সন্ধ্যায় বিচারের পর ফলাফল ঘোষণা করা হবে।"
        />

        {results.length === 0 ? (
          <div className="glass mx-auto mt-14 max-w-2xl p-10 text-center sm:p-14">
            <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-amber-50 text-amber-800">
              <Clock3 className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-bold text-ink">ফলাফলের অপেক্ষায় আছি</h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-3">
              বিচারকমণ্ডলী জমা দেওয়া প্রোডাক্টগুলো যাচাই করছেন। ২৮ নভেম্বর সন্ধ্যায় সেরা তিনটি প্রোডাক্টের নাম ঘোষণা করা হবে।
            </p>
          </div>
        ) : (
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {results.map((winner, i) => {
              const theme = prizes[i]?.theme || 'gold';
              const Icon = ICONS[theme];
              return (
                <div key={winner.place} className="glass p-8 text-center">
                  <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-brand">
                    <Icon className="h-7 w-7 text-ink" />
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                    {winner.place} Place
                  </p>
                  <h3 className="mt-2 text-xl font-bold text-ink">{winner.name}</h3>
                  <p className="mt-1 text-sm text-brand">{winner.product}</p>
                  <p className="mt-1 text-xs text-ink-3">{winner.institution}</p>
                  {winner.marks != null && (
                    <p className="mt-5 inline-block rounded-full bg-sunken px-4 py-1.5 text-sm font-bold text-ink">
                      {winner.marks} / 100
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="glass mt-12 p-7 sm:p-10">
          <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
            <BarChart3 className="h-5 w-5 text-brand" /> বিচারের মানদণ্ড (১০০ নম্বর)
          </h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {judgingCriteria.map((c) => (
              <div key={c.label} className="flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-3 text-sm">
                <span className="text-ink-2">{c.label}</span>
                <span className="font-bold text-ink">{c.marks}</span>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-ink-3">{dates.competitionStartLabel} · Organized by OnnoPoth</p>
        </div>

        <div className="mt-10 text-center">
          <Link href="/status" className="btn-secondary">
            নিজের স্ট্যাটাস চেক করুন <Trophy className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
