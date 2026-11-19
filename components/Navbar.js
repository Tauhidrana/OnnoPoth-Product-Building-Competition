'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu, X } from 'lucide-react';
import Logo from './Logo';
import { navLinks, participantLinks } from '@/lib/config';
import { usePhase } from '@/lib/phase';

/** The one action that matters most right now. */
export const PHASE_CTA = {
  registration: { label: 'রেজিস্টার করো', href: '/#register' },
  review: { label: 'স্ট্যাটাস দেখো', href: '/status' },
  live: { label: 'প্রোডাক্ট জমা দাও', href: '/submit' },
  judging: { label: 'ফলাফল দেখো', href: '/results' },
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState('');
  const pathname = usePathname();
  const cta = PHASE_CTA[usePhase()];

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

  return (
    <header
      className={`no-print sticky top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? 'border-b border-line bg-paper/85 backdrop-blur-md' : 'border-b border-transparent bg-paper'
      }`}
    >
      <nav className="page flex h-16 items-center justify-between gap-6">
        <Link href="/" aria-label="OnnoPoth — হোম">
          <Logo />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const id = link.href.split('#')[1];
            const isActive = (id && active === id) || pathname === link.href;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive ? 'true' : undefined}
                  className={`relative rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors ${
                    isActive ? 'bg-sunken text-ink' : 'text-ink-2 hover:text-ink'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
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
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'মেনু বন্ধ করুন' : 'মেনু খুলুন'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-surface text-ink lg:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu: height animates via grid rows */}
      <div
        id="mobile-menu"
        className={`grid transition-[grid-template-rows] duration-300 ease-out lg:hidden ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="page pb-6 pt-2">
            <ul className="divide-y divide-line border-y border-line">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setOpen(false)} className="flex py-3.5 text-[17px] font-medium text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs font-semibold text-ink-3">প্রতিযোগীদের জন্য</p>
            <ul className="mt-2 grid grid-cols-2 gap-2">
              {participantLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} onClick={() => setOpen(false)} className="block rounded-xl border border-line bg-surface px-3.5 py-3 text-sm font-medium text-ink-2">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href={cta.href} onClick={() => setOpen(false)} className="btn-primary mt-5 w-full">
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
