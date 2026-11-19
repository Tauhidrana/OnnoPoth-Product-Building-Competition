import { ArrowUpRight, BookOpen } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { prizes, giftSponsor } from '@/lib/config';

const RANK = ['১', '২', '৩'];

export default function Prizes() {
  return (
    <section id="prizes" className="section">
      <div className="page">
        <SectionHeading
          eyebrow="পুরস্কার"
          title="সেরা তিনটি প্রোডাক্টের জন্য উপহার"
          subtitle="প্রথম, দ্বিতীয় ও তৃতীয় স্থান অর্জনকারী প্রত্যেককে বই উপহার দেওয়া হবে।"
        />

        <ol data-stagger className="mt-14 grid gap-4 md:grid-cols-3">
          {prizes.map((p, i) => (
            <li
              key={p.place}
              className={`card group relative overflow-hidden p-7 transition duration-300 hover:-translate-y-1 hover:shadow-lift ${
                i === 0 ? 'md:border-ink' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <span className={`font-display text-[64px] font-bold leading-none ${i === 0 ? 'text-brand' : 'text-ink'}`}>{RANK[i]}</span>
                <span className="text-xs font-medium text-ink-3">{p.place} place</span>
              </div>
              <h3 className="mt-8 text-xl font-semibold">{p.bangla}</h3>
              <p className="mt-2 inline-flex items-center gap-2 text-[15px] text-ink-2">
                <BookOpen className="h-4 w-4 text-ink-3" /> {p.prize === 'Book' ? 'বই' : p.prize}
              </p>
            </li>
          ))}
        </ol>

        <div data-reveal className="mt-4 flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-5">
            <div className="grid h-16 w-24 shrink-0 place-items-center rounded-xl border border-line bg-white px-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={giftSponsor.logo} alt={`${giftSponsor.name} logo`} className="max-h-11 w-auto" />
            </div>
            <div>
              <p className="text-xs font-medium text-ink-3">গিফট স্পনসর</p>
              <p className="mt-0.5 text-lg font-semibold text-ink">{giftSponsor.name}</p>
              <p className="text-sm text-ink-3">{giftSponsor.tagline}</p>
            </div>
          </div>
          <a href={giftSponsor.facebook} target="_blank" rel="noopener noreferrer" className="btn-secondary !py-2.5 !text-sm">
            Facebook পেজ <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
