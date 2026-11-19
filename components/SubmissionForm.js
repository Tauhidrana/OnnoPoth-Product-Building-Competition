'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
 AlertCircle,
 ArrowRight,
 CheckCircle2,
 Clock3,
 ExternalLink,
 GitBranch,
 Loader2,
 Lock,
 Mail,
 Sparkles,
 User,
} from 'lucide-react';
import SectionHeading from './SectionHeading';
import { dates, isSubmissionOpen, event, buildPlatforms } from '@/lib/config';

const EMPTY = {
  name: '',
  email: '',
  productName: '',
  platform: 'github',
  githubUrl: '',
  liveUrl: '',
  demoUrl: '',
  aiTools: '',
  timeSpent: '',
  readme: false,
  agree: false,
  website: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;
const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[^\s/]+\/[^\s/]+/i;

function ErrorText({ message }) {
  if (!message) return null;
  return (
    <p className="field-error" role="alert">
      <AlertCircle className="h-3.5 w-3.5" /> {message}
    </p>
  );
}

export default function SubmissionForm() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState('');
  const [open, setOpen] = useState(null);
  const [access, setAccess] = useState(null); // null = checking approval
  const [token, setToken] = useState('');

  useEffect(() => {
    setOpen(isSubmissionOpen());
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    if (!t) {
      setAccess({ allowed: false });
      return;
    }
    fetch(`/api/submit/access?token=${encodeURIComponent(t)}`)
      .then((res) => res.json().catch(() => ({ allowed: false })))
      .then((data) => setAccess(data.allowed ? data : { allowed: false }))
      .catch(() => setAccess({ allowed: false }));
  }, []);

  const set = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  function validate() {
    const e = {};
    const needsGithub = form.platform === 'github';
    if (!form.name.trim()) e.name = 'নাম বা টিমের নাম লিখুন।';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'সঠিক ইমেইল ঠিকানা দিন।';
    if (!form.productName.trim()) e.productName = 'প্রোডাক্টের নাম লিখুন।';
    if (needsGithub && !GITHUB_RE.test(form.githubUrl.trim())) {
      e.githubUrl = 'সঠিক GitHub repository লিংক দিন।';
    }
    if (!URL_RE.test(form.liveUrl.trim())) e.liveUrl = 'সঠিক লাইভ লিংক দিন (Vercel / Lovable / v0)।';
    if (form.demoUrl.trim() && !URL_RE.test(form.demoUrl.trim())) e.demoUrl = 'সঠিক ডেমো ভিডিও লিংক দিন।';
    if (!form.aiTools.trim()) e.aiTools = 'কোন AI টুল কীভাবে ব্যবহার করেছেন তা লিখুন।';
    if (needsGithub && !form.readme) e.readme = 'README যোগ করার নিশ্চিতকরণ আবশ্যক।';
    if (!form.agree) e.agree = 'নিয়ম মেনে জমা দেওয়ার নিশ্চিতকরণ আবশ্যক।';
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || open === false) return;
    const found = validate();
    setErrors(found);
    if (Object.keys(found).length) {
      document.getElementById('submit-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    setSubmitting(true);
    setStatus(null);
    setMessage('');
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus('success');
        setForm(EMPTY);
      } else {
        setStatus('error');
        setMessage(data.error || 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        if (data.fields) setErrors(data.fields);
      }
    } catch {
      setStatus('error');
      setMessage('ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  }

  const closed = open === false;

  return (
    <section id="submit-form" className="relative py-14 sm:py-20">
      <div className="page relative">
        <SectionHeading
          index="01"
          eyebrow="Final submission"
          title={<>প্রোডাক্ট <span className="">জমা দিন</span></>}
          subtitle={`সব লিংক যাচাই করে ${dates.submissionDeadlineLabel}-এর আগে জমা দিন।`}
        />

        {access === null ? (
          <div className="mt-16 flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : !access.allowed ? (
          <div className="glass mx-auto mt-14 max-w-2xl p-8 text-center sm:p-12">
            <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-800">
              <Lock className="h-7 w-7" />
            </div>
            <h3 className="text-2xl font-bold text-ink">আগে আইডিয়া অ্যাপ্রুভ করুন</h3>
            <p className="mt-4 text-sm leading-relaxed text-ink-3">
              ফাইনাল প্রোডাক্ট জমা দেওয়ার আগে আপনার আইডিয়া আয়োজক কমিটি দ্বারা যাচাই হতে হবে।
              আপনার রেজিস্ট্রেশন ইমেইলে অ্যাপ্রুভাল লিংক পাঠানো হবে — সেই লিংক দিয়েই এই ফর্ম খুলবে।
            </p>
            <p className="mt-4 rounded-2xl border border-line bg-paper px-5 py-4 text-sm font-semibold text-ink-2">
              এখনো অ্যাপ্রুভ হয়নি? পরবর্তী রাউন্ডে আবার চেষ্টা করুন
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <a href="/#register" className="btn-primary">রেজিস্ট্রেশন দেখুন</a>
              <Link href="/rulebook" className="btn-secondary">রুলবুক পড়ুন</Link>
            </div>
          </div>
        ) : (
        <div className="mt-14 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
          <aside className="space-y-4 lg:sticky lg:top-28">
            <div className="glass relative overflow-hidden p-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-brand" />
              <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand">
                <Clock3 className="h-3.5 w-3.5" /> Deadline
              </p>
              <p className="mt-3 text-2xl font-bold text-ink">২৭ নভেম্বর</p>
              <p className="text-sm font-semibold text-brand">রাত ১০টা (UTC+6)</p>
              <div className="my-6 h-px bg-sunken" />
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-3">
                যা যা লাগবে
              </p>
              <ul className="space-y-3 text-sm text-ink-2">
                {[
                  ...(form.platform === 'github' ? ['GitHub repo লিংক (Public)', 'README ফাইল'] : []),
                  'লাইভ লিংক (Vercel / Lovable / v0)',
                  'AI টুল ব্যবহারের বিবরণ',
                  'ডেমো ভিডিও (ঐচ্ছিক)',
                ].map((item, i) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-green-50 text-[10px] font-bold text-green-700">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/rulebook"
              target="_blank"
              className="flex items-center justify-between rounded-2xl border border-line bg-paper px-6 py-4 text-sm font-bold text-ink transition hover:border-brand/40"
            >
              রুলবুক দেখুন <ExternalLink className="h-4 w-4 text-brand" />
            </Link>
          </aside>

          <form onSubmit={handleSubmit} noValidate className="glass p-6 sm:p-9">
            {closed && (
              <div className="mb-7 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <Lock className="h-5 w-5 shrink-0" /> জমা দেওয়ার সময় শেষ হয়ে গেছে।
              </div>
            )}

            <div>
              <p className="field-label">কী দিয়ে বানিয়েছেন? *</p>
              <div className="grid grid-cols-3 gap-2">
                {buildPlatforms.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => set('platform', p.id)}
                    aria-pressed={form.platform === p.id}
                    className={`rounded-xl border px-2 py-3 text-center text-[11px] font-bold transition sm:text-xs ${
                      form.platform === p.id
                        ? 'border-brand bg-brand-soft text-ink'
                        : 'border-line bg-paper text-ink-3 hover:border-ink-4'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-ink-3">
                {buildPlatforms.find((p) => p.id === form.platform)?.hint}
              </p>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="s-name">নাম / টিমের নাম *</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                    <input id="s-name" className="field-input !pl-11" placeholder="যেমন: Team Syntax Error" value={form.name} onChange={(e) => set('name', e.target.value)} />
                  </div>
                  <ErrorText message={errors.name} />
                </div>
                <div>
                  <label className="field-label" htmlFor="s-email">ইমেইল *</label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                    <input id="s-email" type="email" className="field-input !pl-11" placeholder="you@example.com" value={form.email} onChange={(e) => set('email', e.target.value)} />
                  </div>
                  <ErrorText message={errors.email} />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="s-product">প্রোডাক্টের নাম *</label>
                <div className="relative">
                  <Sparkles className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                  <input id="s-product" className="field-input !pl-11" placeholder="প্রোডাক্টের নাম" value={form.productName} onChange={(e) => set('productName', e.target.value)} />
                </div>
                <ErrorText message={errors.productName} />
              </div>

              <div className={`grid gap-6 ${form.platform === 'github' ? 'sm:grid-cols-2' : ''}`}>
                {form.platform === 'github' && (
                  <div>
                    <label className="field-label" htmlFor="s-github">GitHub repository *</label>
                    <div className="relative">
                      <GitBranch className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                      <input id="s-github" className="field-input !pl-11" placeholder="github.com/user/repo" value={form.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} />
                    </div>
                    <ErrorText message={errors.githubUrl} />
                  </div>
                )}
                <div>
                  <label className="field-label" htmlFor="s-live">লাইভ লিংক * (Vercel / Lovable / v0)</label>
                  <div className="relative">
                    <ExternalLink className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                    <input id="s-live" className="field-input !pl-11" placeholder="https://your-app.vercel.app" value={form.liveUrl} onChange={(e) => set('liveUrl', e.target.value)} />
                  </div>
                  <ErrorText message={errors.liveUrl} />
                </div>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="s-demo">ডেমো ভিডিও (ঐচ্ছিক)</label>
                  <input id="s-demo" className="field-input" placeholder="YouTube / Drive link" value={form.demoUrl} onChange={(e) => set('demoUrl', e.target.value)} />
                  <ErrorText message={errors.demoUrl} />
                </div>
                <div>
                  <label className="field-label" htmlFor="s-time">কত সময় লেগেছে? (ঐচ্ছিক)</label>
                  <input id="s-time" className="field-input" placeholder="যেমন: প্রায় ৯ ঘণ্টা" value={form.timeSpent} onChange={(e) => set('timeSpent', e.target.value)} />
                </div>
              </div>

              <div>
                <label className="field-label" htmlFor="s-ai">কোন AI টুল কীভাবে ব্যবহার করেছেন? *</label>
                <textarea
                  id="s-ai"
                  rows={4}
                  className="field-input resize-y"
                  placeholder="যেমন: Cursor দিয়ে কোড, ChatGPT দিয়ে ডিবাগিং, Claude দিয়ে README…"
                  value={form.aiTools}
                  onChange={(e) => set('aiTools', e.target.value)}
                />
                <ErrorText message={errors.aiTools} />
              </div>

              <div className="space-y-3">
                {form.platform === 'github' && (
                  <>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper p-4 text-sm text-ink-2">
                      <input type="checkbox" checked={form.readme} onChange={(e) => set('readme', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
                      আমি GitHub রিপোজিটরিতে README ফাইল যোগ করেছি *
                    </label>
                    <ErrorText message={errors.readme} />
                  </>
                )}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper p-4 text-sm text-ink-2">
                  <input type="checkbox" checked={form.agree} onChange={(e) => set('agree', e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-brand" />
                  আমি সব নিয়ম মেনে প্রোডাক্ট জমা দিচ্ছি *
                </label>
                <ErrorText message={errors.agree} />
              </div>

              {/* honeypot */}
              <div className="honeypot" aria-hidden="true">
                <label htmlFor="s-website">Leave empty</label>
                <input id="s-website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => set('website', e.target.value)} />
              </div>
            </div>

            <div className="mt-9">
              <button type="submit" disabled={submitting || closed} className="btn-primary w-full !py-4 text-base">
                {closed ? (
                  <>Submission Closed</>
                ) : submitting ? (
                  <><Loader2 className="h-5 w-5 animate-spin" /> পাঠানো হচ্ছে…</>
                ) : (
                  <>জমা দিন <ArrowRight className="h-5 w-5" /></>
                )}
              </button>
              <p className="mt-3 text-center text-xs text-ink-3">
                {event.organizer} আয়োজক কমিটি · ২৮ নভেম্বর সন্ধ্যায় ফলাফল
              </p>
            </div>

            {status === 'success' && (
              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-5 text-sm text-green-700" role="status">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-bold">জমা দেওয়া সফল হয়েছে</p>
                  <p className="mt-1 leading-relaxed">আপনার প্রোডাক্ট আমাদের কাছে পৌঁছে গেছে। ২৮ নভেম্বর সন্ধ্যায় ফলাফল ঘোষণা করা হবে। কনফার্মেশন ইমেইল চেক করুন।</p>
                </div>
              </div>
            )}
            {status === 'error' && (
              <div className="mt-7 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700" role="alert">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <p>{message}</p>
              </div>
            )}
          </form>
        </div>
        )}
      </div>
    </section>
  );
}
