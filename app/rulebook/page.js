import Link from 'next/link';
import { ArrowRight, ChevronRight, Clock3 } from 'lucide-react';
import PrintButton from '@/components/PrintButton';
import RulebookRenderer from '@/components/RulebookRenderer';
import CompetitorIdCard from '@/components/CompetitorIdCard';
import { DocsSidebar, MobileDocsBar } from '@/components/rulebook/DocsNav';
import DocsToc from '@/components/rulebook/DocsToc';
import { buildNav } from '@/components/rulebook/nav';
import { rulebookIntro, rulebookSections } from '@/lib/rulebook';
import { event, dates, contacts } from '@/lib/config';

export const metadata = {
  title: 'রুলবুক',
  description: `${event.name} – সম্পূর্ণ রুলবুক। আয়োজক: ${event.organizer}।`,
  openGraph: {
    title: `রুলবুক | ${event.name}`,
    description: `${event.name} – আয়োজক: ${event.organizer}`,
  },
};

const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);

export default function RulebookPage() {
  const nav = buildNav();
  const words = Object.values(nav.items).reduce((sum, it) => sum + it.search.split(/\s+/).length, 0);
  const minutes = Math.max(1, Math.round(words / 160));
  const facts = [
    { label: 'রেজিস্ট্রেশনের শেষ সময়', value: dates.registrationDeadlineLabel },
    { label: 'মূল প্রতিযোগিতা শুরু', value: dates.competitionStartLabel },
    { label: 'জমা দেওয়ার শেষ সময়', value: dates.submissionDeadlineLabel },
  ];

  return (
    <div className="page">
      <div className="grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[240px_minmax(0,1fr)_220px] print:block">
        <DocsSidebar nav={nav} />

        <div className="min-w-0 pb-24">
          <MobileDocsBar nav={nav} />

          <article className="print-document mx-auto max-w-[46rem] pt-8 lg:pt-10">
            {/* Header */}
            <header className="border-b border-line pb-8">
              <ol className="no-print flex items-center gap-1.5 text-sm text-ink-3">
                <li><Link href="/" className="hover:text-ink">হোম</Link></li>
                <li aria-hidden><ChevronRight className="h-3.5 w-3.5" /></li>
                <li aria-current="page" className="text-ink">রুলবুক</li>
              </ol>
              <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">রুলবুক</h1>
              <p className="mt-3 text-lg leading-relaxed text-ink-2">
                {event.name}-এর অফিশিয়াল নিয়মাবলি — কারা অংশ নিতে পারবে, কীভাবে বানাবে ও জমা দেবে, আর কীভাবে বিচার হবে।
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-ink-3">
                <span>{rulebookIntro.organizer}</span>
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> প্রায় {bn(minutes)} মিনিটে পড়া যায়</span>
                <span className="no-print xl:hidden"><PrintButton compact /></span>
              </div>
            </header>

            <div className="mt-10">
              <RulebookRenderer sections={rulebookSections} />
            </div>

            <section id="id-card" className="mt-14 scroll-mt-36 border-t border-line pt-12 lg:scroll-mt-20">
              <h2 className="text-[1.65rem] font-bold leading-tight sm:text-3xl">প্রতিযোগীর আইডি কার্ড</h2>
              <p className="mt-4 text-[16px] leading-[1.85] text-ink-2">রেজিস্ট্রেশনের তথ্য দিয়ে প্রত্যেক প্রতিযোগীর এমন একটি কার্ড থাকবে।</p>
              <div className="mt-6">
                <CompetitorIdCard />
              </div>
            </section>

            {/* What next */}
            <div className="no-print mt-16 grid gap-3 sm:grid-cols-2">
              <Link href="/#register" className="group rounded-xl border border-line bg-surface p-5 transition hover:border-ink-4 hover:shadow-lift">
                <p className="text-sm text-ink-3">পড়া শেষ?</p>
                <p className="mt-1 flex items-center justify-between font-semibold text-ink">
                  রেজিস্টার করো <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
              <a href={contacts[0]?.link} target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-line bg-surface p-5 transition hover:border-ink-4 hover:shadow-lift">
                <p className="text-sm text-ink-3">কিছু বুঝতে পারোনি?</p>
                <p className="mt-1 flex items-center justify-between font-semibold text-ink">
                  আয়োজকদের জিজ্ঞেস করো <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </p>
              </a>
            </div>
          </article>
        </div>

        <DocsToc nav={nav} facts={facts} />
      </div>
    </div>
  );
}
