'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Loader2,
  Mail,
  MessageCircle,
  Search,
  XCircle,
} from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';

const STATUS = {
  approved: {
    icon: CheckCircle2,
    color: 'border-green-200 bg-green-50 text-green-700',
    title: 'অ্যাপ্রুভ হয়েছে',
    text: 'আপনার আইডিয়া যাচাইয়ে পাস করেছে। অ্যাপ্রুভাল ইমেইলে থাকা লিংক দিয়ে প্রোডাক্ট জমা দিন।',
  },
  pending: {
    icon: Clock3,
    color: 'border-amber-200 bg-amber-50 text-amber-800',
    title: 'পর্যালোচনা চলছে',
    text: 'আয়োজক কমিটি আপনার আইডিয়া যাচাই করছে। ২৫ নভেম্বর ফলাফল জানানো হবে।',
  },
  declined: {
    icon: XCircle,
    color: 'border-red-200 bg-red-50 text-red-700',
    title: 'এইবার নির্বাচিত হয়নি',
    text: 'আপনার আগ্রহের জন্য ধন্যবাদ। পরবর্তী ইভেন্টে আবার অংশ নেওয়ার সুযোগ থাকবে।',
  },
  'not-found': {
    icon: AlertCircle,
    color: 'border-line bg-paper text-ink-2',
    title: 'কোনো রেজিস্ট্রেশন পাওয়া যায়নি',
    text: 'আপনি যে ইমেইল ও WhatsApp নম্বর দিয়েছেন তা আমাদের রেকর্ডে নেই। রেজিস্ট্রেশনের সময় ব্যবহার করা তথ্য দিয়ে আবার চেষ্টা করুন।',
  },
};

export default function StatusPage() {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function check(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, whatsapp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'যাচাই করা যায়নি।');
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const info = result ? STATUS[result.status] : null;
  const Icon = info?.icon;

  return (
    <div className="min-h-screen py-16 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Status check"
          title="আমার আইডিয়া অ্যাপ্রুভ হয়েছে কি?"
          subtitle="রেজিস্ট্রেশনের সময় দেওয়া ইমেইল ও WhatsApp নম্বর দিয়ে নিজের স্ট্যাটাস যাচাই করুন।"
        />

        <form onSubmit={check} className="glass mt-12 space-y-6 p-7 sm:p-10">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="st-email">ইমেইল *</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="st-email"
                  type="email"
                  className="field-input !pl-11"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="st-phone">WhatsApp নম্বর *</label>
              <div className="relative">
                <MessageCircle className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="st-phone"
                  className="field-input !pl-11"
                  placeholder="01XXXXXXXXX"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="field-error">
              <AlertCircle className="h-3.5 w-3.5" /> {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-4 w-4" /> স্ট্যাটাস চেক করুন</>}
          </button>
        </form>

        {result && info && (
          <div className={`mt-6 rounded-3xl border p-7 text-center sm:p-9 ${info.color}`}>
            <Icon className="mx-auto h-10 w-10" />
            <h3 className="mt-4 text-2xl font-bold">{info.title}</h3>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed opacity-90">{info.text}</p>
            {result.name && (
              <p className="mt-5 text-sm font-semibold">
                {result.name} {result.teamName ? `· ${result.teamName}` : ''} — {result.productName}
              </p>
            )}
            {result.status === 'approved' && (
              <Link href="/submit" className="btn-primary mt-6">
                প্রোডাক্ট জমা দিন →
              </Link>
            )}
          </div>
        )}

        <p className="mt-8 text-center text-xs text-ink-3">
          <Link href="/confirmed" className="text-brand hover:text-brand-ink">
            কনফার্মড প্রতিযোগীদের তালিকা দেখুন →
          </Link>
        </p>
      </div>
    </div>
  );
}
