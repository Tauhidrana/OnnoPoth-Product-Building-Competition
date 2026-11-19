'use client';

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { dates } from '@/lib/config';

// `ends` decides when a step counts as done (all times UTC+6).
const ITEMS = [
  { date: dates.registrationWindowLabel, ends: dates.registrationDeadline, title: 'রেজিস্ট্রেশন ও আইডিয়া জমা', text: 'ফর্ম পূরণ করে প্রোডাক্টের নাম ও আইডিয়া জমা দাও। টিম হলে সবার নাম ও টিম লিডার উল্লেখ করো।' },
  { date: '২৪ নভেম্বর', ends: '2026-11-24T23:59:00+06:00', title: 'আইডিয়া যাচাই', text: 'আইডিয়া কতটা স্পষ্ট, আর ১২ ঘণ্টায় বানানো সম্ভব কি না — আয়োজক কমিটি যাচাই করবে।' },
  { date: '২৫ নভেম্বর', ends: '2026-11-25T23:59:00+06:00', title: 'কনফার্মড তালিকা ঘোষণা', text: 'শুধু কনফার্মড প্রতিযোগীরাই মূল প্রতিযোগিতায় অংশ নিতে পারবে।' },
  { date: '২৬ নভেম্বর', ends: '2026-11-26T23:59:00+06:00', title: 'নিয়মাবলি ও ব্রিফিং', text: 'কনফার্মড প্রতিযোগীদের WhatsApp গ্রুপে যুক্ত করে জমা দেওয়ার পদ্ধতি বুঝিয়ে দেওয়া হবে।' },
  { date: '২৭ নভেম্বর, শুক্রবার', ends: dates.competitionEnd, title: 'মূল প্রতিযোগিতা · ১২ ঘণ্টা', text: 'সকাল ১০টায় নতুন GitHub রিপো খুলে কাজ শুরু, রাত ৯টায় ডিপ্লয় শুরু, রাত ১০টার মধ্যে জমা।', main: true },
  { date: '২৮ নভেম্বর', ends: '2026-11-28T23:59:00+06:00', title: 'বিচার ও ফলাফল', text: 'বিচারকমণ্ডলী প্রোডাক্টগুলো যাচাই করবে, সন্ধ্যায় ফলাফল ঘোষণা।' },
];

export default function Timeline() {
  // -1 until mounted so server and client markup match; then the index of the current step.
  const [current, setCurrent] = useState(-1);

  useEffect(() => {
    const now = Date.now();
    const i = ITEMS.findIndex((item) => now < new Date(item.ends).getTime());
    setCurrent(i === -1 ? ITEMS.length : i);
  }, []);

  const progress = current < 0 ? 0 : Math.min(current, ITEMS.length - 1) / (ITEMS.length - 1);

  return (
    <section id="timeline" className="section">
      <div className="page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading eyebrow="সময়সূচি" title="রেজিস্ট্রেশন থেকে ফলাফল" subtitle="সব তারিখ বাংলাদেশ সময় (UTC+6) অনুযায়ী। আজ কোন ধাপে আছি, সেটা হাইলাইট করা আছে।" />
        </div>

        <ol className="relative">
          {/* Track and progress fill */}
          <span aria-hidden className="absolute bottom-6 left-[11px] top-3 w-px bg-line-strong" />
          <span
            aria-hidden
            className="absolute left-[11px] top-3 w-px origin-top bg-brand transition-transform duration-1000 ease-out"
            style={{ height: 'calc(100% - 36px)', transform: `scaleY(${progress})` }}
          />
          {ITEMS.map((item, i) => {
            const done = current > i;
            const now = current === i;
            return (
              <li key={item.title} data-reveal className="relative pb-10 pl-12 last:pb-0">
                <span
                  className={`absolute left-0 top-1 grid h-6 w-6 place-items-center rounded-full border-2 transition-colors duration-500 ${
                    done ? 'border-brand bg-brand text-white' : now ? 'border-brand bg-surface' : 'border-line-strong bg-paper'
                  }`}
                >
                  {done && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  {now && <span className="h-2 w-2 rounded-full bg-brand" />}
                </span>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className={`text-sm font-medium ${now ? 'text-brand' : 'text-ink-3'}`}>{item.date}</p>
                  {now && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-semibold text-brand-ink">এখন চলছে</span>}
                  {item.main && !now && <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-semibold text-ink-2">মূল দিন</span>}
                </div>
                <h3 className={`mt-1.5 text-xl font-semibold ${done ? 'text-ink-3' : ''}`}>{item.title}</h3>
                <p className="mt-1.5 max-w-lg text-[15px] leading-relaxed text-ink-2">{item.text}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
