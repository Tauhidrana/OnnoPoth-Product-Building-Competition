'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { usePhase } from '@/lib/phase';
import { PHASE_CTA } from './Navbar';

/** The primary button for the current phase (register → status → submit → results). */
export default function PhaseCta({ className = 'btn-primary' }) {
  const cta = PHASE_CTA[usePhase()];
  return (
    <Link href={cta.href} className={`group ${className}`}>
      {cta.label}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
