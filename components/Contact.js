import { ArrowUpRight, Phone } from 'lucide-react';
import SectionHeading from './SectionHeading';
import ShareButtons, { CommunityCard } from './ShareButtons';
import { contacts, judges } from '@/lib/config';

export default function Contact() {
  return (
    <section id="contact" className="section">
      <div className="page">
        <SectionHeading eyebrow="যোগাযোগ" title="কোনো প্রশ্ন আছে?" subtitle="রেজিস্ট্রেশন বা নিয়ম নিয়ে যেকোনো সাহায্য লাগলে সরাসরি আয়োজক কমিটির সাথে কথা বলো।" />

        <div data-stagger className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contacts.map((person) => (
            <div key={person.name} className="card flex flex-col p-6 sm:p-7">
              <p className="text-xs font-medium text-ink-3">{person.facebook ? 'অফিশিয়াল পেজ' : 'আয়োজক কমিটি'}</p>
              <h3 className="mt-1.5 text-xl font-semibold">{person.name}</h3>
              <p className="mt-1 text-[15px] text-ink-2">{person.detail}</p>
              <div className="mt-6 flex flex-wrap gap-2 pt-1">
                <a href={person.link} target="_blank" rel="noopener noreferrer" className="btn-primary !py-2.5 !text-sm">
                  {person.linkLabel} <ArrowUpRight className="h-4 w-4" />
                </a>
                {person.tel && (
                  <a href={person.tel} className="btn-secondary !py-2.5 !text-sm">
                    <Phone className="h-4 w-4" /> কল করো
                  </a>
                )}
              </div>
            </div>
          ))}

          <div className="card flex flex-col p-6 sm:p-7 md:col-span-2 lg:col-span-1">
            <p className="text-xs font-medium text-ink-3">বিচারকমণ্ডলী</p>
            {judges.length ? (
              <ul className="mt-3 space-y-2">
                {judges.map((j) => (
                  <li key={j.name}>
                    <p className="font-semibold text-ink">{j.name}</p>
                    <p className="text-sm text-ink-3">{j.role || j.detail}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">
                বিচারকদের নাম ২৬ নভেম্বর ব্রিফিংয়ের সাথে ঘোষণা করা হবে। তাদের সিদ্ধান্তই চূড়ান্ত।
              </p>
            )}
            <div className="mt-auto border-t border-line pt-5">
              <CommunityCard />
            </div>
          </div>
        </div>

        <div data-reveal className="mt-10 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[15px] font-medium text-ink">বন্ধুদের জানাও — একসাথে টিম করো।</p>
          <ShareButtons />
        </div>
      </div>
    </section>
  );
}
