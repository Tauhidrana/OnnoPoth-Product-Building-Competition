'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, X } from 'lucide-react';
import { useActiveId } from './useActiveId';

/** Search box + grouped section list, shared by the desktop sidebar and the phone drawer. */
function NavList({ nav, active, onNavigate, autoFocus }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const q = query.trim().toLowerCase();

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  // "/" focuses search, like most docs sites.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const groups = useMemo(
    () => nav.groups.map((g) => ({ ...g, ids: g.ids.filter((id) => !q || nav.items[id].search.includes(q)) })).filter((g) => g.ids.length),
    [nav, q]
  );
  const firstMatch = groups[0]?.ids[0];

  const go = (id) => {
    onNavigate?.();
    history.replaceState(null, '', `#${id}`);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav aria-label="রুলবুকের সূচিপত্র">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          if (firstMatch) go(firstMatch);
        }}
        className="relative"
      >
        <label htmlFor="rulebook-search" className="sr-only">রুলবুকে খুঁজুন</label>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
        <input
          ref={inputRef}
          id="rulebook-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="রুলবুকে খুঁজুন…"
          className="w-full rounded-lg border border-line-strong bg-surface py-2 pl-9 pr-9 text-sm text-ink outline-none transition placeholder:text-ink-4 focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
        <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 font-mono text-[11px] text-ink-4 lg:block">/</kbd>
      </form>

      {groups.length === 0 ? (
        <p className="mt-6 px-2 text-sm text-ink-3">“{query}” কোথাও পাওয়া যায়নি।</p>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((g) => (
            <div key={g.title}>
              <p className="px-2 text-xs font-semibold text-ink">{g.title}</p>
              <ul className="mt-2 space-y-px border-l border-line">
                {g.ids.map((id) => {
                  const on = active === id;
                  return (
                    <li key={id}>
                      <a
                        href={`#${id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          go(id);
                        }}
                        aria-current={on ? 'location' : undefined}
                        className={`-ml-px block border-l py-1.5 pl-4 pr-2 text-[14px] leading-snug transition-colors ${
                          on ? 'border-brand font-medium text-brand' : 'border-transparent text-ink-3 hover:border-ink-4 hover:text-ink'
                        }`}
                      >
                        {nav.items[id].title}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </nav>
  );
}

/** Desktop: sticky left column. */
export function DocsSidebar({ nav }) {
  const active = useActiveId(nav.order);
  return (
    <aside className="no-print sticky top-16 hidden h-[calc(100vh-4rem)] overflow-y-auto border-r border-line py-8 pr-6 lg:block">
      <NavList nav={nav} active={active} />
    </aside>
  );
}

/** Phones and tablets: a sticky bar with the current section, progress, and a drawer. */
export function MobileDocsBar({ nav }) {
  const active = useActiveId(nav.order);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="no-print sticky top-16 z-30 -mx-4 border-b border-line bg-paper/90 backdrop-blur-md sm:-mx-6 lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="rulebook-drawer"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-6"
      >
        <span className="min-w-0">
          <span className="block text-xs text-ink-3">সূচিপত্র</span>
          <span className="block truncate text-sm font-semibold text-ink">{nav.items[active]?.title}</span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-3" />
      </button>
      <span aria-hidden className="absolute bottom-0 left-0 h-0.5 origin-left bg-brand transition-transform duration-150" style={{ width: '100%', transform: `scaleX(${progress})` }} />

      {open && createPortal(
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="সূচিপত্র" id="rulebook-drawer">
          <button type="button" aria-label="বন্ধ করুন" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/30" />
          <div className="drawer-in absolute inset-y-0 left-0 w-[min(86vw,340px)] overflow-y-auto bg-paper p-5 shadow-lift">
            <div className="mb-5 flex items-center justify-between">
              <p className="font-display text-lg font-semibold">রুলবুক</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="বন্ধ করুন" className="rounded-lg p-1.5 text-ink-3 hover:bg-sunken hover:text-ink">
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList nav={nav} active={active} onNavigate={() => setOpen(false)} autoFocus={false} />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
