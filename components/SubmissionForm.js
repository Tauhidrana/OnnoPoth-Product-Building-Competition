'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, ExternalLink, Info, Loader2, Lock, Pencil } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { dates, isSubmissionOpen, contacts } from '@/lib/config';
import { validateSubmission, normaliseUrl, isVercelUrl, SUBMISSION_LIMITS } from '@/lib/validation';

const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);
const when = (v) =>
  new Date(v).toLocaleString('bn-BD', { timeZone: 'Asia/Dhaka', day: 'numeric', month: 'long', hour: 'numeric', minute: '2-digit' });

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      <AlertCircle className="h-4 w-4 shrink-0" /> {message}
    </p>
  );
}

/**
 * Final submission, opened from the personal link in the approval email:
 * the live project URL (required) and a short description (optional).
 */
export default function SubmissionForm() {
  const [access, setAccess] = useState(null); // null = checking the link
  const [token, setToken] = useState('');
  const [open, setOpen] = useState(true);
  const [form, setForm] = useState({ liveUrl: '', description: '' });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);
  const doneRef = useRef(null);
  const urlRef = useRef(null);

  useEffect(() => {
    setOpen(isSubmissionOpen());
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    if (!t) return setAccess({ allowed: false });
    fetch(`/api/submit/access?token=${encodeURIComponent(t)}`)
      .then((res) => res.json().catch(() => ({ allowed: false })))
      .then((data) => {
        if (!data.allowed) return setAccess({ allowed: false, reason: data.error ? 'error' : 'invalid' });
        setAccess(data);
        if (data.submitted) setForm({ liveUrl: data.submitted.liveUrl || '', description: data.submitted.description || '' });
      })
      .catch(() => setAccess({ allowed: false, reason: 'error' }));
  }, []);

  const { errors: liveErrors, data: clean } = validateSubmission(form);
  const errorFor = (k) => serverErrors[k] || ((submitted || touched[k]) && liveErrors[k]) || '';
  const update = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setServerErrors((e) => ({ ...e, [k]: undefined }));
    setNotice('');
  };
  const urlLooksOk = !liveErrors.liveUrl && form.liveUrl.trim();
  const descLength = [...form.description.trim()].length;

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || !open) return;
    setSubmitted(true);
    setNotice('');
    if (Object.keys(liveErrors).length) return urlRef.current?.focus();

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setDone({ ...clean, updated: data.updated, emailed: data.emailed });
        setAccess((a) => ({ ...a, submitted: { at: new Date().toISOString(), ...clean } }));
        requestAnimationFrame(() => {
          doneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          doneRef.current?.focus({ preventScroll: true });
        });
        return;
      }
      if (data.fields) setServerErrors(data.fields);
      if (res.status === 403 && /সময় শেষ/.test(data.error || '')) setOpen(false);
      else if (res.status === 403) setAccess({ allowed: false, reason: 'invalid' });
      else if (res.status === 429) setNotice('অল্প সময়ে অনেকবার চেষ্টা হয়েছে। কয়েক মিনিট পর আবার জমা দাও।');
      else if (!data.fields) setNotice('জমা দেওয়া যায়নি — আমাদের দিক থেকে একটা সমস্যা হয়েছে। একটু পর আবার চেষ্টা করো; ডেডলাইন কাছে হলে এখনই আয়োজকদের জানাও।');
    } catch {
      setNotice('ইন্টারনেট সংযোগ নেই। সংযোগ ঠিক করে আবার “জমা দাও” চাপো — লেখা মুছে যায়নি।');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="submit-form" className="py-12 sm:py-16">
      <div className="page">
        <SectionHeading
          eyebrow="ফাইনাল সাবমিশন"
          title="লাইভ প্রোজেক্ট জমা দাও"
          subtitle={`ডিপ্লয় করা প্রোজেক্টের লিংক আর চাইলে ছোট একটা বিবরণ — ${dates.submissionDeadlineLabel}-এর আগে।`}
        />

        <div className="mt-10 max-w-2xl">
          {access === null ? (
            <div className="card flex items-center justify-center gap-3 p-12 text-ink-3">
              <Loader2 className="h-5 w-5 animate-spin" /> লিংক যাচাই করা হচ্ছে…
            </div>
          ) : !access.allowed ? (
            <Locked reason={access.reason} hasToken={Boolean(token)} />
          ) : done ? (
            <div ref={doneRef} tabIndex={-1} role="status" className="card rise scroll-mt-24 p-6 outline-none sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-700"><CheckCircle2 className="h-6 w-6" /></span>
              <h3 className="mt-4 text-2xl font-semibold">{done.updated ? 'জমা আপডেট হয়েছে' : 'জমা হয়েছে!'}</h3>
              <p className="mt-2 text-[15px] text-ink-2">
                {done.emailed ? <>কনফার্মেশন ইমেইল গেছে <strong className="break-all text-ink">{access.email}</strong>-এ।</> : <>তোমার জমা আমরা পেয়েছি। কনফার্মেশন ইমেইল একটু দেরিতে আসতে পারে।</>}
              </p>
              <dl className="mt-6 space-y-3 rounded-xl bg-paper p-4 text-sm">
                <div><dt className="text-ink-3">লাইভ লিংক</dt><dd><a href={done.liveUrl} target="_blank" rel="noopener noreferrer" className="link break-all">{done.liveUrl}</a></dd></div>
                {done.description && <div><dt className="text-ink-3">বিবরণ</dt><dd className="whitespace-pre-wrap text-ink">{done.description}</dd></div>}
              </dl>
              <p className="mt-5 text-sm text-ink-3">ডেডলাইনের আগে এই পেজ থেকে যতবার খুশি আপডেট করতে পারবে। ফলাফল ২৮ নভেম্বর সন্ধ্যায়।</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {open && (
                  <button type="button" onClick={() => setDone(null)} className="btn-secondary"><Pencil className="h-4 w-4" /> আপডেট করো</button>
                )}
                <Link href="/results" className="btn-secondary">ফলাফল পেজ</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate aria-label="লাইভ প্রোজেক্ট জমার ফর্ম" className="card overflow-hidden">
              <div className="border-b border-line bg-paper px-6 py-4 sm:px-8">
                <p className="text-xs text-ink-3">জমা দিচ্ছ</p>
                <p className="mt-0.5 text-lg font-semibold text-ink">{access.productName}</p>
                <p className="text-sm text-ink-3">{access.name}{access.leader && access.leader !== access.name ? ` · লিডার ${access.leader}` : ''} · {access.email}</p>
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                {!open && (
                  <div className="flex gap-3 rounded-xl border border-line bg-paper p-4 text-[15px] text-ink-2">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0" />
                    <span>জমা দেওয়ার সময় শেষ ({dates.submissionDeadlineLabel})। {access.submitted ? 'নিচে তোমার শেষ জমা দেখা যাচ্ছে।' : 'এই প্রোজেক্টের কোনো জমা পাওয়া যায়নি।'}</span>
                  </div>
                )}
                {open && access.submitted && (
                  <div className="flex gap-3 rounded-xl bg-brand-soft/60 p-4 text-[15px] text-ink-2">
                    <Info className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                    <span>{when(access.submitted.at)}-এ জমা দিয়েছ। নতুন লিংক বা বিবরণ দিয়ে জমা দিলে আগেরটি বদলে যাবে।</span>
                  </div>
                )}
                {notice && (
                  <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[15px] text-red-800">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> {notice}
                  </div>
                )}

                <div>
                  <label htmlFor="liveUrl" className="field-label">লাইভ প্রোজেক্টের লিংক</label>
                  <input
                    ref={urlRef}
                    id="liveUrl"
                    name="liveUrl"
                    type="url"
                    inputMode="url"
                    autoComplete="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="https://your-app.vercel.app"
                    className="field-input"
                    disabled={!open}
                    value={form.liveUrl}
                    onChange={(e) => update('liveUrl', e.target.value)}
                    onBlur={() => {
                      setTouched((t) => ({ ...t, liveUrl: true }));
                      const n = normaliseUrl(form.liveUrl);
                      if (n !== form.liveUrl) update('liveUrl', n);
                    }}
                    aria-invalid={errorFor('liveUrl') ? true : undefined}
                    aria-describedby={errorFor('liveUrl') ? 'liveUrl-error' : 'liveUrl-hint'}
                  />
                  {errorFor('liveUrl') ? (
                    <FieldError id="liveUrl-error" message={errorFor('liveUrl')} />
                  ) : (
                    <div id="liveUrl-hint" className="field-hint flex flex-wrap items-center gap-x-3 gap-y-1">
                      {urlLooksOk && !isVercelUrl(clean.liveUrl) ? (
                        <span className="text-amber-800">Vercel-এর লিংক নয় — অন্য কোথাও হোস্ট করা হলেও চলবে, শুধু নিশ্চিত হও সবাই খুলতে পারে।</span>
                      ) : (
                        <span>Vercel-এ প্রোজেক্টের “Visit” চাপলে যে লিংক খোলে, সেটিই।</span>
                      )}
                      {urlLooksOk && (
                        <a href={clean.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand hover:text-brand-ink">
                          খুলে দেখো <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="description" className="field-label">ছোট বিবরণ <span className="font-normal text-ink-3">(ঐচ্ছিক)</span></label>
                    <span className={`text-xs tabular-nums ${descLength > SUBMISSION_LIMITS.description ? 'font-semibold text-red-600' : 'text-ink-3'}`}>
                      {bn(descLength)}/{bn(SUBMISSION_LIMITS.description)}
                    </span>
                  </div>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="field-input resize-y"
                    disabled={!open}
                    placeholder="এক-দুই লাইনে: প্রোডাক্টটি কী করে, কীভাবে ব্যবহার করতে হয়। লগইন লাগলে একটা টেস্ট অ্যাকাউন্ট দিয়ে দাও।"
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, description: true }))}
                    aria-invalid={errorFor('description') ? true : undefined}
                    aria-describedby={errorFor('description') ? 'description-error' : undefined}
                  />
                  <FieldError id="description-error" message={errorFor('description')} />
                </div>

                {open && (
                  <button type="submit" disabled={submitting} className="btn-brand w-full !py-4 !text-base">
                    {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> জমা হচ্ছে…</> : <>{access.submitted ? 'আপডেট করো' : 'জমা দাও'} <ArrowRight className="h-5 w-5" /></>}
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Locked({ reason, hasToken }) {
  const contact = contacts[0];
  return (
    <div className="card p-8 text-center sm:p-10">
      <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sunken text-ink-2"><Lock className="h-5 w-5" /></span>
      <h3 className="mt-4 text-xl font-semibold">
        {reason === 'error' ? 'লিংক যাচাই করা যায়নি' : hasToken ? 'এই লিংকটি কাজ করছে না' : 'অ্যাপ্রুভাল ইমেইলের লিংক লাগবে'}
      </h3>
      <p className="mx-auto mt-2 max-w-md text-[15px] leading-relaxed text-ink-2">
        {reason === 'error'
          ? 'ইন্টারনেট সংযোগ দেখে পেজটি আবার খোলো।'
          : hasToken
            ? 'লিংকটি অসম্পূর্ণ, মেয়াদ শেষ, অথবা তোমার অ্যাপ্রুভাল বাতিল হয়েছে। ইমেইল থেকে পুরো লিংকটি আবার খোলো, না হলে আয়োজকদের জানাও।'
            : 'আইডিয়া অ্যাপ্রুভ হলে তোমার ইমেইলে একটি ব্যক্তিগত লিংক যাবে — সেটি খুললেই এখানে লাইভ প্রোজেক্ট জমা দিতে পারবে।'}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/status" className="btn-primary">স্ট্যাটাস দেখো <ArrowRight className="h-4 w-4" /></Link>
        {contact && <a href={contact.link} target="_blank" rel="noopener noreferrer" className="btn-secondary">আয়োজকদের জানাও</a>}
      </div>
    </div>
  );
}
