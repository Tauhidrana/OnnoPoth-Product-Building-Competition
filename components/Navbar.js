'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight, BadgeCheck, BookOpen, CalendarDays, ChevronRight, Gift, HelpCircle,
  ListChecks, MessageCircle, Scale, Search, Send, Trophy,
} from 'lucide-react';
import Logo from './Logo';
import { navLinks, participantLinks, contacts } from '@/lib/config';
import { usePhase, PHASE_COPY } from '@/lib/phase';

/** The one action that matters most right now. */
export const PHASE_CTA = {
  registration: { label: 'রেজিস্টার করো', href: '/#register' },
  review: { label: 'স্ট্যাটাস দেখো', href: '/status' },
  live: { label: 'প্রোডাক্ট জমা দাও', href: '/submit' },
  judging: { label: 'ফলাফল দেখো', href: '/results' },
};

const NAV_ICONS = {
  '/#about': ListChecks,
  '/#timeline': CalendarDays,
  '/#rules': Scale,
  '/#prizes': Gift,
  '/#faq': HelpCircle,
  '/rulebook': BookOpen,
};
const PARTICIPANT_ICONS = { '/status': Search, '/confirmed': BadgeCheck, '/submit': Send, '/results': Trophy };

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const pathname = usePathname();
  const phase = usePhase();
  const cta = PHASE_CTA[phase];
  const toggleRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently on screen (home page only).
  useEffect(() => {
    if (pathname !== '/') return setActive('');
    const ids = navLinks.map((l) => l.href.split('#')[1]).filter(Boolean);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  // While the menu is open: lock page scroll, close on Escape or when the
  // screen becomes desktop-wide, and keep focus inside the menu.
  useEffect(() => {
    if (!open) return;
    const toggle = toggleRef.current;
    document.body.style.overflow = 'hidden';
    sheetRef.current?.querySelector('a')?.focus({ preventScroll: true });
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    const onResize = () => window.innerWidth >= 1024 && setOpen(false);
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      toggle?.focus({ preventScroll: true });
    };
  }, [open]);

  const isActive = (href) => {
    const id = href.split('#')[1];
    return (id && active === id) || pathname === href;
  };
  const close = () => setOpen(false);

  return (
    <header
      className={`no-print sticky top-0 z-50 transition-colors duration-300 ${
        open ? 'border-b border-line bg-paper' : scrolled ? 'border-b border-line bg-paper/85 backdrop-blur-md' : 'border-b border-transparent bg-paper'
      }`}
    >
      <nav className="page flex h-16 items-center justify-between gap-6" aria-label="প্রধান">
        <Link href="/" aria-label="OnnoPoth — হোম" onClick={close}>
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? 'true' : undefined}
                className={`relative rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors ${
                  isActive(link.href) ? 'bg-sunken text-ink' : 'text-ink-2 hover:text-ink'
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/status" className="px-3 py-2 text-[15px] font-medium text-ink-2 transition-colors hover:text-ink">
            স্ট্যাটাস
          </Link>
          <Link href={cta.href} className="btn-primary !py-2.5 !text-sm">
            {cta.label} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="relative grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface text-ink transition-colors hover:border-ink-4 lg:hidden"
        >
          {/* Two lines that turn into an X */}
          <span aria-hidden className={`absolute h-[1.5px] w-[18px] rounded-full bg-current transition-transform duration-300 ${open ? 'rotate-45' : '-translate-y-[4px]'}`} />
          <span aria-hidden className={`absolute h-[1.5px] w-[18px] rounded-full bg-current transition-transform duration-300 ${open ? '-rotate-45' : 'translate-y-[4px]'}`} />
        </button>
      </nav>

      {/* Mobile menu: an opaque sheet from under the header to the bottom of the screen */}
      <div
        id="mobile-menu"
        ref={sheetRef}
        inert={!open}
        aria-hidden={!open}
        className={`fixed inset-x-0 bottom-0 top-16 flex flex-col bg-paper transition-[opacity,transform] duration-300 ease-out lg:hidden ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="page py-4">
            <PhaseLine phase={phase} />

            <ul className="mt-3 space-y-0.5">
              {navLinks.map((link, i) => {
                const Icon = NAV_ICONS[link.href] || ChevronRight;
                const on = isActive(link.href);
                return (
                  <li key={link.href} className={open ? 'menu-in' : ''} style={{ '--i': i }}>
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={on ? 'true' : undefined}
                      className={`group flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors ${on ? 'bg-surface shadow-card' : 'active:bg-sunken'}`}
                    >
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${on ? 'bg-brand text-white' : 'bg-sunken text-ink-2'}`}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug text-ink">{link.label}</span>
                        <span className="block truncate text-[12.5px] leading-snug text-ink-3 [@media(max-height:700px)]:hidden">{link.hint}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-ink-4" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <p className="mt-5 px-1 text-xs font-semibold text-ink-3">প্রতিযোগীদের জন্য</p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {participantLinks.map((link, i) => {
                const Icon = PARTICIPANT_ICONS[link.href] || ChevronRight;
                const on = pathname === link.href;
                return (
                  <li key={link.href} className={open ? 'menu-in' : ''} style={{ '--i': navLinks.length + i }}>
                    <Link
                      href={link.href}
                      onClick={close}
                      aria-current={on ? 'page' : undefined}
                      className={`flex h-full items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-colors ${
                        on ? 'border-brand bg-brand-soft/60' : 'border-line bg-surface active:bg-sunken'
                      }`}
                    >
                      <Icon className={`h-4 w-4 shrink-0 ${on ? 'text-brand' : 'text-ink-3'}`} />
                      <span className="text-[14px] font-medium leading-snug text-ink">{link.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Pinned footer: the main action and a way to reach a person */}
        <div className="border-t border-line bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
          <div className="page space-y-3">
            <Link href={cta.href} onClick={close} className="btn-primary w-full">
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
            <div className="flex items-center justify-center gap-5 text-sm text-ink-3">
              <span>প্রশ্ন আছে?</span>
              {contacts.map((c) => (
                <a key={c.name} href={c.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium text-ink-2 hover:text-ink">
                  <MessageCircle className="h-4 w-4" /> {c.linkLabel}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

function PhaseLine({ phase }) {
  const copy = PHASE_COPY[phase];
  const live = phase === 'registration' || phase === 'live';
  return (
    <div className="flex items-start gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5">
      {live ? <span className="live-dot mt-1.5" /> : <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-ink-4" />}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{copy.label}</p>
        <p className="text-[13px] leading-snug text-ink-3">{copy.note}</p>
      </div>
    </div>
  );
}
