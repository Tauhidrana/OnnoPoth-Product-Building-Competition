import Link from 'next/link';
import { ArrowLeft, Clock3 } from 'lucide-react';
import SubmissionForm from '@/components/SubmissionForm';
import { event, dates } from '@/lib/config';

export const metadata = {
  title: 'প্রোডাক্ট জমা দিন',
  description: `${event.name} — ফাইনাল সাবমিশন। ${dates.submissionDeadlineLabel}।`,
  openGraph: {
    title: `প্রোডাক্ট জমা দিন | ${event.name}`,
    description: `${event.name} — ফাইনাল সাবমিশন ফর্ম।`,
  },
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen">
      <div className="page flex flex-wrap items-center justify-between gap-3 pt-8">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-ink-3 transition-colors hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> হোমে ফিরে যাও
        </Link>
        <span className="chip">
          <Clock3 className="h-3.5 w-3.5" /> শেষ সময় {dates.submissionDeadlineLabel}
        </span>
      </div>
      <SubmissionForm />
    </div>
  );
}
