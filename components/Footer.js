import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Logo from './Logo';
import { event, navLinks, participantLinks, contacts, giftSponsor } from '@/lib/config';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="no-print border-t border-line bg-surface">
      <div className="page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-3">
            {event.tagline}। {event.organizer} — সবার জন্য উন্মুক্ত একটি লার্নিং কমিউনিটি।
          </p>
        </div>

        <FooterList title="প্রতিযোগিতা" links={navLinks} />
        <FooterList title="প্রতিযোগীদের জন্য" links={participantLinks} />

        <div>
          <h2 className="text-sm font-semibold text-ink">যোগাযোগ</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {contacts.map((person) => (
              <li key={person.name}>
                <a href={person.link} target="_blank" rel="noopener noreferrer" className="group inline-flex flex-col text-ink-2 hover:text-ink">
                  <span className="font-medium">{person.name}</span>
                  <span className="inline-flex items-center gap-1 text-ink-3 group-hover:text-brand">
                    {person.linkLabel} <ArrowUpRight className="h-3.5 w-3.5" />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="page flex flex-col gap-2 py-5 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>
            আয়োজক {event.organizer} · গিফট স্পনসর{' '}
            <a href={giftSponsor.facebook} target="_blank" rel="noopener noreferrer" className="font-medium text-ink-2 hover:text-brand">
              {giftSponsor.name}
            </a>
          </p>
          <p>© {year} {event.organizer}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, links }) {
  return (
    <div>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-ink-3 transition-colors hover:text-ink">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
