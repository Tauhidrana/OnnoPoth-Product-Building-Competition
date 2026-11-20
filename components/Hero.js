import Image from 'next/image';
import Link from 'next/link';
import BuildDayDemo from './demo/BuildDayDemo';
import Countdown from './Countdown';
import PhaseBadge from './PhaseBadge';
import PhaseCta from './PhaseCta';
import { event, socialLinks } from '@/lib/config';

const FACTS = [
  { label: 'তারিখ', value: '২৭ নভেম্বর, শুক্রবার' },
  { label: 'সময়', value: 'সকাল ১০টা – রাত ১০টা' },
  { label: 'টিম', value: 'একা অথবা ৩ জন' },
  { label: 'পুরস্কার', value: 'সেরা ৩ জনকে বই' },
];

export default function Hero() {
  return (
    <section id="home" className="overflow-hidden pb-16 pt-8 sm:pt-12 lg:pb-20">
      <div className="page grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,600px)] lg:gap-14">
        <div>
          <div className="rise" style={{ '--d': 0 }}>
            <PhaseBadge />
          </div>

          {/* The official competition lockup is the title; its alt text is the heading's name. */}
          <h1 className="rise mt-6 max-w-[30rem]" style={{ '--d': 1 }}>
            <Image
              src="/onnopoth-pbc-2026-logo.webp"
              alt={`${event.name} 2026 — ${event.organizer}`}
              width={3918}
              height={2725}
              priority
              sizes="(min-width: 1024px) 480px, calc(100vw - 32px)"
              className="h-auto w-full"
            />
          </h1>
          <p className="rise mt-6 font-display text-[1.75rem] font-semibold leading-snug text-ink sm:text-[2rem]" style={{ '--d': 2 }}>
            ১২ ঘণ্টায় আইডিয়া থেকে{' '}
            <span className="bg-[linear-gradient(transparent_66%,rgb(245_184_46/0.4)_66%)] px-0.5">লাইভ প্রোডাক্ট</span>
          </p>
          <p className="rise mt-3 max-w-xl text-lg leading-relaxed text-ink-2" style={{ '--d': 3 }}>
            একটা বাস্তব সমস্যা বেছে নাও, AI-এর সাহায্যে তার সমাধান বানাও, ইন্টারনেটে লাইভ করে জমা দাও। সম্পূর্ণ অনলাইন,
            সব প্রতিষ্ঠানের শিক্ষার্থীদের জন্য, কোনো ফি নেই।
          </p>

          <div className="rise mt-8 flex flex-wrap gap-3" style={{ '--d': 4 }}>
            <PhaseCta />
            <Link href={socialLinks.rulebook} className="btn-secondary">
              রুলবুক পড়ো
            </Link>
          </div>

          <dl className="rise mt-10 grid max-w-lg grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-6" style={{ '--d': 5 }}>
            {FACTS.map((f) => (
              <div key={f.label}>
                <dt className="text-xs text-ink-3">{f.label}</dt>
                <dd className="mt-1 text-[15px] font-semibold text-ink">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="fade-in" style={{ '--d': 3 }}>
          <BuildDayDemo />
          <div className="mt-5">
            <Countdown />
          </div>
        </div>
      </div>
    </section>
  );
}
