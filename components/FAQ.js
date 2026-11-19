import { Plus } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { faqItems, extraFaqItems } from '@/lib/rulebook';

export default function FAQ() {
  const items = [...faqItems, ...extraFaqItems];

  return (
    <section id="faq" className="section border-t border-line bg-surface">
      <div className="page grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeading eyebrow="প্রশ্নোত্তর" title="সাধারণ প্রশ্ন" subtitle="উত্তরগুলো রুলবুক থেকে নেওয়া। এখানে না পেলে নিচে যোগাযোগ করো।" />
        </div>

        <div data-reveal className="divide-y divide-line border-y border-line">
          {items.map((item) => (
            <details key={item.q} className="group">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-left text-[17px] font-semibold text-ink transition-colors hover:text-brand [&::-webkit-details-marker]:hidden">
                {item.q}
                <Plus className="mt-1 h-5 w-5 shrink-0 text-ink-3 transition-transform duration-300 group-open:rotate-45" />
              </summary>
              <p className="faq-answer max-w-2xl pb-6 pr-10 text-[15px] leading-relaxed text-ink-2">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
