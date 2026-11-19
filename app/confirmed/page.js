import Link from 'next/link';
import { BadgeCheck, Users, ArrowRight } from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';
import { getRecords, decisionFor } from '@/lib/gmail-store';
import { dates } from '@/lib/config';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'কনফার্মড প্রতিযোগী',
  description: 'Product Building Competition (Using AI) — কনফার্মড প্রতিযোগীদের তালিকা।',
};

export default async function ConfirmedPage() {
  let approved = [];
  let error = '';

  try {
    const { registrations, approvals } = await getRecords();
    approved = registrations
      .map((r) => ({ ...r, decision: decisionFor(approvals, r.email)?.decision || null }))
      .filter((r) => r.decision === 'approve');
  } catch {
    error = 'তালিকা লোড করা যায়নি। কিছুক্ষণ পর আবার দেখুন।';
  }

  return (
    <div className="min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Confirmed participants"
          title="কনফার্মড প্রতিযোগীদের তালিকা"
          subtitle={`${dates.competitionStartLabel} শুরু হওয়া মূল প্রতিযোগিতায় নিম্নলিখিতরা অংশ নেবেন।`}
        />

        <div className="mt-12">
          {error ? (
            <div className="glass p-10 text-center text-sm text-red-700">{error}</div>
          ) : approved.length === 0 ? (
            <div className="glass p-12 text-center">
              <Users className="mx-auto h-10 w-10 text-brand" />
              <p className="mt-4 text-lg font-bold text-ink">তালিকা এখনো প্রকাশিত হয়নি।</p>
              <p className="mt-2 text-sm text-ink-3">২৫ নভেম্বর কনফার্মড তালিকা ঘোষণা করা হবে।</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {approved.map((person) => (
                <div key={person.uid} className="glass flex items-start gap-4 p-6">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-green-50 text-green-700">
                    <BadgeCheck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-ink">{person.name}</h3>
                    <p className="mt-0.5 text-sm text-brand">
                      {person.productName}
                      {person.teamName ? ` · ${person.teamName}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-ink-3">{person.institution}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 text-center">
          <Link href="/status" className="btn-secondary">
            নিজের স্ট্যাটাস চেক করুন <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
