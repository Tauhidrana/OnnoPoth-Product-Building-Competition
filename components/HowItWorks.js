import SectionHeading from './SectionHeading';
import { dates } from '@/lib/config';

const STEPS = [
  {
    when: dates.registrationWindowLabel,
    title: 'রেজিস্টার করো',
    text: 'ফর্মে প্রোডাক্টের নাম আর আইডিয়া লিখে জমা দাও। একা বা সর্বোচ্চ ৩ জনের টিম।',
  },
  {
    when: '২৪–২৫ নভেম্বর',
    title: 'কনফার্মেশন পাও',
    text: 'আয়োজক কমিটি আইডিয়া যাচাই করবে। ২৫ নভেম্বর কনফার্মড তালিকা, ইমেইলেও জানানো হবে।',
  },
  {
    when: '২৭ নভেম্বর, সকাল ১০টা',
    title: '১২ ঘণ্টায় বানাও',
    text: 'নতুন রিপো খুলে কাজ শুরু। ChatGPT, Claude, Cursor — যেকোনো AI টুল ব্যবহার করা যাবে।',
  },
  {
    when: '২৭ নভেম্বর, রাত ১০টা',
    title: 'লাইভ করে জমা দাও',
    text: 'Vercel, Lovable বা v0-তে প্রোডাক্ট লাইভ করে লিংক জমা দাও। ২৮ নভেম্বর ফলাফল।',
  },
];

const DAY = [
  { time: '১০:০০', label: 'কাজ শুরু' },
  { time: '২১:০০', label: 'ডিপ্লয় শুরু করো' },
  { time: '২২:০০', label: 'জমার শেষ সময়' },
];

export default function HowItWorks() {
  return (
    <section id="about" className="section border-t border-line bg-surface">
      <div className="page">
        <SectionHeading
          eyebrow="কীভাবে কাজ করে"
          title="চারটি ধাপ, একটি লাইভ প্রোডাক্ট"
          subtitle="এটা কোনো পরীক্ষা নয়। আসল কাজ হলো হাতে-কলমে কিছু বানানো — কোড, ডিজাইন আর ডিবাগিংয়ে AI তোমার সহকারী।"
        />

        <ol data-stagger className="mt-14 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="group relative bg-surface p-6 transition-colors hover:bg-paper sm:p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-sm font-semibold text-white transition-colors group-hover:bg-brand">
                  {['১', '২', '৩', '৪'][i]}
                </span>
                <span className="text-[13px] font-medium text-ink-3">{step.when}</span>
              </div>
              <h3 className="mt-6 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{step.text}</p>
            </li>
          ))}
        </ol>

        <div data-reveal className="mt-6 grid gap-6 rounded-2xl border border-line bg-paper p-6 sm:p-7 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <h3 className="text-lg font-semibold">বিল্ড ডে, ২৭ নভেম্বর</h3>
            <p className="mt-1.5 text-[15px] text-ink-2">
              আগেই GitHub ও Vercel অ্যাকাউন্ট খুলে রাখো (অথবা Lovable / v0)। ফ্রি প্ল্যানই যথেষ্ট।
            </p>
          </div>
          <ol className="relative grid grid-cols-3">
            <span aria-hidden className="absolute left-[6px] right-[6px] top-[5px] h-px bg-line-strong" />
            {DAY.map((d, i) => (
              <li key={d.time} className={`relative ${i === 1 ? 'text-center' : i === 2 ? 'text-right' : ''}`}>
                <span
                  aria-hidden
                  className={`relative inline-block h-[11px] w-[11px] rounded-full border-2 ${
                    i === 2 ? 'border-brand bg-brand' : 'border-ink-3 bg-paper'
                  }`}
                />
                <p className="mt-3 font-display text-xl font-semibold tabular-nums">{d.time}</p>
                <p className="text-[13px] text-ink-3">{d.label}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
