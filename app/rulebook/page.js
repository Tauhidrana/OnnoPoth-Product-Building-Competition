import Link from 'next/link';
import { ArrowLeft, BookOpen, List } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import RulebookRenderer from '@/components/RulebookRenderer';
import CompetitorIdCard from '@/components/CompetitorIdCard';
import { rulebookIntro, rulebookSections } from '@/lib/rulebook';
import { event } from '@/lib/config';

export const metadata = {
  title: 'রুলবুক',
  description: `${event.name} – সম্পূর্ণ রুলবুক। আয়োজক: ${event.organizer}।`,
  openGraph: {
    title: `রুলবুক | ${event.name}`,
    description: `${event.name} – আয়োজক: ${event.organizer}`,
  },
};

export default function RulebookPage() {
  return (
    <div className="min-h-screen pb-20 pt-10 sm:pt-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="no-print mb-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-ink-3 transition hover:text-brand-ink"
          >
            <ArrowLeft className="h-4 w-4" /> হোমে ফিরে যান
          </Link>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1.5 text-xs font-bold text-brand">
                <BookOpen className="h-3.5 w-3.5" /> Official Rulebook
              </span>
              <h1 className="text-3xl font-bold leading-tight text-ink sm:text-4xl">
                {rulebookIntro.title.replace(' – রুলবুক', '')} –{' '}
                <span className="">রুলবুক</span>
              </h1>
              <p className="mt-2 text-sm text-ink-3">{rulebookIntro.organizer}</p>
            </div>
            <PrintButton />
          </div>
        </header>

        {/* Print header (hidden on screen, shown in the PDF) */}
        <div className="hidden print:block print:mb-8">
          <h1 className="text-2xl font-bold">{rulebookIntro.title}</h1>
          <p className="text-sm">{rulebookIntro.organizer}</p>
        </div>

        {/* Content + sticky table of contents */}
        <div className="grid items-start gap-10 lg:grid-cols-[240px_minmax(0,1fr)] print:block">
          <aside className="no-print hidden lg:block">
            <nav className="glass sticky top-24 p-5">
              <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-ink">
                <List className="h-3.5 w-3.5" /> সূচিপত্র
              </p>
              <ol className="space-y-1.5">
                {rulebookSections.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="block rounded-lg px-2 py-1.5 text-[13px] leading-snug text-ink-3 transition hover:bg-paper hover:text-ink"
                    >
                      {section.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </aside>

          <article className="print-document glass p-6 sm:p-10">
            <RulebookRenderer sections={rulebookSections} />

            {/* Competitor identity card — included in the printed/PDF rulebook */}
            <section className="mt-14 border-t border-line pt-10">
              <h2 className="mb-6 text-xl font-bold text-ink sm:text-2xl">
                Competitor ID Card
              </h2>
              <CompetitorIdCard />
            </section>

            <div className="no-print mt-12 flex flex-col items-center justify-center gap-3 border-t border-line pt-6 sm:flex-row">
              <Link href="/#register" className="btn-primary">
                রেজিস্ট্রেশন করুন
              </Link>
              <Link href="/submit" className="btn-secondary">
                প্রোডাক্ট জমা দিন
              </Link>
            </div>
          </article>
        </div>
      </div>
    </div>
  );
}
