import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { judgingCriteria } from '@/lib/config';

const ELIGIBILITY = [
  { title: 'যেকোনো শিক্ষার্থী', text: 'স্কুল, কলেজ বা বিশ্ববিদ্যালয় — যেকোনো প্রতিষ্ঠানের শিক্ষার্থী বা শিক্ষানবিস।' },
  { title: 'একা বা টিমে', text: 'একা অথবা সর্বোচ্চ ৩ জনের টিম করে অংশ নেওয়া যাবে।' },
  { title: 'একজন, একটি টিম', text: 'একজন ব্যক্তি একটির বেশি টিমে থাকতে পারবে না।' },
  { title: 'অভিজ্ঞতা লাগবে না', text: 'প্রোগ্রামিংয়ে নতুন হলেও চলবে — AI তোমার পাশে আছে।' },
];

const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);

export default function Rules() {
  const total = judgingCriteria.reduce((sum, c) => sum + c.marks, 0);

  return (
    <section id="rules" className="section border-t border-line bg-surface">
      <div className="page">
        <SectionHeading
          eyebrow="নিয়ম ও বিচার"
          title="কারা অংশ নিতে পারবে, কীভাবে বিচার হবে"
          subtitle="শর্ত খুবই সহজ। বিস্তারিত নিয়ম, জমার পদ্ধতি আর অযোগ্যতার কারণগুলো রুলবুকে আছে।"
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h3 className="text-lg font-semibold">অংশগ্রহণের যোগ্যতা</h3>
            <ul data-stagger className="mt-5 divide-y divide-line border-y border-line">
              {ELIGIBILITY.map((item) => (
                <li key={item.title} className="flex gap-4 py-5">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{item.text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/rulebook" className="link mt-6 inline-flex items-center gap-1.5">
              সম্পূর্ণ রুলবুক পড়ো <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div data-reveal>
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold">বিচারের মানদণ্ড</h3>
              <p className="text-sm text-ink-3">মোট {bn(total)} নম্বর</p>
            </div>
            <ul className="mt-5 space-y-5">
              {judgingCriteria.map((c, i) => (
                <li key={c.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-[15px] text-ink">{c.label}</span>
                    <span className="font-display text-lg font-semibold tabular-nums text-ink">{bn(c.marks)}</span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken">
                    <div
                      className={`grow-x h-full rounded-full ${i < 2 ? 'bg-brand' : 'bg-ink-3'}`}
                      style={{ width: `${(c.marks / 25) * 100}%`, '--i': i }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-3">সবচেয়ে বেশি নম্বর মৌলিকতায় আর প্রোডাক্ট ঠিকমতো কাজ করছে কি না, তাতে।</p>
          </div>
        </div>
      </div>
    </section>
  );
}
