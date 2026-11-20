'use client';

import { useEffect, useState } from 'react';

/**
 * Scroll-spy: the id of the last element whose top has passed a line just
 * below the sticky header. Recomputed on scroll (cheap: a few rects).
 */
export function useActiveId(ids, offset = 140) {
  const [active, setActive] = useState(ids[0] || '');
  const key = ids.join('|');

  useEffect(() => {
    const list = key ? key.split('|') : [];
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = list[0] || '';
      for (const id of list) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top - offset <= 0) current = id;
      }
      // At the very bottom, the last section is the one being read.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = list.at(-1) || current;
      setActive(current);
    };
    const onScroll = () => (frame ||= requestAnimationFrame(update));
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [key, offset]);

  return active;
}
