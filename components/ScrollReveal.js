'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fades [data-reveal] elements (and children of [data-stagger], one by one) in
 * as they scroll into view. Content is only hidden once this has mounted, so
 * the page reads fine without JavaScript or with reduced motion.
 */
export default function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const items = Array.from(document.querySelectorAll('[data-reveal], [data-stagger]'));
    items.forEach((el) => {
      if (el.hasAttribute('data-stagger')) Array.from(el.children).forEach((c, i) => c.style.setProperty('--i', i));
    });
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      items.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    document.documentElement.classList.add('reveal-ready');
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    items.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
