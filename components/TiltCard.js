'use client';

import { useRef } from 'react';

/** Tilts its child a few degrees toward the pointer, with a soft light that follows it. */
export default function TiltCard({ children, max = 5 }) {
  const ref = useRef(null);

  function move(e) {
    if (e.pointerType !== 'mouse') return;
    const el = ref.current;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--rx', `${(0.5 - y) * max}deg`);
    el.style.setProperty('--ry', `${(x - 0.5) * max}deg`);
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    el.dataset.active = '';
  }

  function leave() {
    const el = ref.current;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
    delete el.dataset.active;
  }

  return (
    <div className="tilt" style={{ perspective: '1200px' }}>
      <div ref={ref} onPointerMove={move} onPointerLeave={leave} className="tilt-inner">
        {children}
      </div>
    </div>
  );
}
