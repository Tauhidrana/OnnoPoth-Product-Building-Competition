'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle, ArrowRight, CalendarDays, CalendarPlus, Check, CheckCircle2, Clock3, Loader2, Lock,
  Plus, RotateCcw, Search, ShieldCheck, User, Users, X,
} from 'lucide-react';
import SectionHeading from './SectionHeading';
import { dates, isRegistrationOpen, event } from '@/lib/config';
import { validateRegistration, normalisePhone, normaliseGithub, suggestEmail, parseFeatures, LIMITS } from '@/lib/validation';
import { eventIcs } from '@/lib/calendar';

const EMPTY_FORM = {
  registrationType: 'solo',
  fullName: '',
  teamName: '',
  members: ['', '', ''],
  teamLeader: 0,
  institution: '',
  className: '',
  whatsapp: '',
  email: '',
  github: '',
  productName: '',
  problem: '',
  users: '',
  features: ['', '', ''],
  agree: false,
  website: '', // hidden honeypot
};

// Order the error summary follows (top of the form to the bottom).
const FIELD_ORDER = ['registrationType', 'fullName', 'teamName', 'members', 'institution', 'className', 'whatsapp', 'email', 'github', 'productName', 'problem', 'users', 'features', 'agree'];
const LABELS = {
  registrationType: 'রেজিস্ট্রেশনের ধরন', fullName: 'পুরো নাম', teamName: 'টিমের নাম', members: 'টিমের সদস্য',
  institution: 'প্রতিষ্ঠান', className: 'শ্রেণি / সেমিস্টার', whatsapp: 'WhatsApp নম্বর', email: 'ইমেইল', github: 'GitHub ইউজারনেম',
  productName: 'প্রোডাক্টের নাম', problem: 'সমস্যা', users: 'ব্যবহারকারী', features: 'ফিচার', agree: 'রুলবুক নিশ্চিতকরণ',
};
const DRAFT_KEY = 'onnopoth-registration-draft-v1';
const BN = '০১২৩৪৫৬৭৮৯';
const bn = (n) => String(n).replace(/\d/g, (d) => BN[d]);
const fieldId = (key) => (key === 'members' ? 'member-0' : key === 'registrationType' ? 'reg-type-solo' : key === 'features' ? 'feature-0' : key);
const FEATURE_EXAMPLES = ['যেমন: আজকের বাজারদর দেখা', 'যেমন: দামের ট্রেন্ড গ্রাফ', 'যেমন: এলাকা অনুযায়ী তুলনা'];

function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object') return null;
    const members = Array.isArray(d.members) ? [...d.members.map(String), '', '', ''].slice(0, 3) : EMPTY_FORM.members;
    // Drafts saved before features became a list hold one block of text.
    const list = Array.isArray(d.features) ? d.features.map(String).slice(0, LIMITS.featuresMax) : parseFeatures(d.features).slice(0, LIMITS.featuresMax);
    const features = [...list, '', '', ''].slice(0, Math.max(LIMITS.featuresRequired, list.length));
    return { ...EMPTY_FORM, ...d, members, features, website: '' };
  } catch {
    return null;
  }
}

function FieldError({ id, message }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      <AlertCircle className="h-4 w-4 shrink-0" /> {message}
    </p>
  );
}

/** Label + control + hint/error, wired together for screen readers via aria-describedby. */
function Field({ id, label, hint, error, aside, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="field-label" htmlFor={id}>{label}</label>
        {aside}
      </div>
      {children}
      {hint && !error && (typeof hint === 'string' ? <p id={`${id}-hint`} className="field-hint">{hint}</p> : hint)}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

/** Numbered group; the number turns into a tick once its fields are valid. */
function FormGroup({ index, title, subtitle, complete, children }) {
  return (
    <fieldset className="border-t border-line pt-8 first:border-0 first:pt-0">
      <legend className="sr-only">{title}</legend>
      <div className="mb-6 flex items-center gap-3">
        <span
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-colors duration-300 ${
            complete ? 'bg-brand text-white' : 'border border-line-strong text-ink-2'
          }`}
          aria-hidden
        >
          {complete ? <Check className="h-4 w-4" strokeWidth={3} /> : index}
        </span>
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-ink-3">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

/** Characters still needed, or remaining when close to the limit. */
function Counter({ value, max, min }) {
  const n = [...value.trim()].length;
  if (min && n > 0 && n < min) return <span className="text-xs text-ink-3">আরও {bn(min - n)} অক্ষর</span>;
  if (n < max * 0.8) return null;
  return <span className={`text-xs tabular-nums ${n > max ? 'font-semibold text-red-600' : 'text-ink-3'}`}>{bn(n)}/{bn(max)}</span>;
}

export default function RegistrationForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState(null); // { tone, title, text, action }
  const [done, setDone] = useState(null); // successful registration summary
  const [registrationOpen, setRegistrationOpen] = useState(null);
  const [restored, setRestored] = useState(false);
  const [normalised, setNormalised] = useState({});
  const summaryRef = useRef(null);
  const successRef = useRef(null);

  // Client-only: registration window and any saved draft (after mount → no hydration mismatch).
  useEffect(() => {
    setRegistrationOpen(isRegistrationOpen());
    const draft = readDraft();
    if (draft && JSON.stringify(draft) !== JSON.stringify(EMPTY_FORM)) {
      setForm(draft);
      setRestored(true);
    }
  }, []);

  // Save a draft while typing (a per-browser convenience; never required).
  useEffect(() => {
    if (done) return;
    const id = setTimeout(() => {
      try {
        if (JSON.stringify(form) === JSON.stringify(EMPTY_FORM)) localStorage.removeItem(DRAFT_KEY);
        else localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...form, website: '' }));
      } catch {}
    }, 400);
    return () => clearTimeout(id);
  }, [form, done]);

  const isTeam = form.registrationType === 'team';
  const { errors: liveErrors } = validateRegistration(form);
  // A field's error shows once it has been left (or after a submit attempt); server errors win.
  const errorFor = (key) => serverErrors[key] || ((submitted || touched[key]) && liveErrors[key]) || '';
  const shownErrors = FIELD_ORDER.filter((k) => errorFor(k));

  const update = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setServerErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[k === 'teamLeader' ? 'members' : k]);
      return next;
    });
    setNotice((n) => (n?.tone === 'error' ? n : null));
  };
  const touch = (key) => setTouched((t) => (t[key] ? t : { ...t, [key]: true }));

  function setType(type) {
    if (type === form.registrationType) return;
    if (type === 'team') {
      // Carry the solo name into the first member slot.
      const members = [...form.members];
      if (form.fullName.trim() && !members.some((m) => m.trim())) members[0] = form.fullName;
      update({ registrationType: 'team', members, teamLeader: 0 });
    } else {
      const leader = form.members[form.teamLeader]?.trim() || form.members.find((m) => m.trim()) || '';
      update({ registrationType: 'solo', fullName: form.fullName || leader });
    }
  }

  function setMember(i, value) {
    const members = [...form.members];
    members[i] = value;
    let teamLeader = form.teamLeader;
    // If the leader's name is cleared, hand the role to the first named member.
    if (!members[teamLeader]?.trim()) {
      const first = members.findIndex((m) => m.trim());
      teamLeader = first === -1 ? 0 : first;
    }
    update({ members, teamLeader });
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
    setForm(EMPTY_FORM);
    setTouched({});
    setSubmitted(false);
    setServerErrors({});
    setRestored(false);
    setNormalised({});
    setNotice(null);
  }

  // Tidy pasted values when leaving the field, and say what changed.
  function normaliseOnBlur(key) {
    touch(key);
    const fn = key === 'whatsapp' ? normalisePhone : normaliseGithub;
    const raw = form[key].trim();
    if (!raw) return;
    const next = fn(raw);
    if (next && next !== raw && (key === 'github' || next.length === 11)) {
      update({ [key]: next });
      setNormalised((n) => ({ ...n, [key]: raw }));
    }
  }

  const focusSummary = () =>
    requestAnimationFrame(() => {
      summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      summaryRef.current?.focus({ preventScroll: true });
    });

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || registrationOpen === false) return;
    setSubmitted(true);
    setNotice(null);

    const { errors, data: clean } = validateRegistration(form);
    if (Object.keys(errors).length) return focusSummary();

    setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setDone({ ...clean, emailed: data.emailed !== false });
        try {
          localStorage.removeItem(DRAFT_KEY);
        } catch {}
        requestAnimationFrame(() => {
          successRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          successRef.current?.focus({ preventScroll: true });
        });
        return;
      }

      if (data.fields) setServerErrors(data.fields);
      if (res.status === 409) {
        setNotice({ tone: 'warn', title: 'এই ইমেইল দিয়ে আগেই রেজিস্ট্রেশন হয়েছে', text: 'একজন একবারই রেজিস্টার করতে পারে। আগের রেজিস্ট্রেশনের অবস্থা স্ট্যাটাস পেজে দেখো, অথবা অন্য ইমেইল দাও।', action: { href: '/status', label: 'স্ট্যাটাস দেখো' } });
      } else if (res.status === 429) {
        setNotice({ tone: 'warn', title: 'একটু অপেক্ষা করো', text: 'অল্প সময়ে অনেকবার চেষ্টা হয়েছে। ১০ মিনিট পর আবার জমা দাও — তোমার লেখা এই ব্রাউজারে সেভ থাকবে।' });
      } else if (res.status === 403) {
        setRegistrationOpen(false);
        return;
      } else if (!data.fields) {
        setNotice({ tone: 'error', title: 'জমা দেওয়া যায়নি', text: 'আমাদের দিক থেকে একটা সমস্যা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করো; সমস্যা থাকলে আয়োজকদের জানাও।' });
      }
      focusSummary();
    } catch {
      setNotice({ tone: 'error', title: 'ইন্টারনেট সংযোগ নেই', text: 'সংযোগ ঠিক আছে কিনা দেখে আবার “জমা দাও” চাপো। তোমার লেখা মুছে যায়নি।' });
      focusSummary();
    } finally {
      setSubmitting(false);
    }
  }

  function downloadCalendar() {
    const url = URL.createObjectURL(new Blob([eventIcs()], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'onnopoth-competition.ics' });
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const closed = registrationOpen === false;
  const groupValid = (keys) => keys.every((k) => !liveErrors[k]);
  const identityDone = groupValid(['registrationType', 'fullName', 'teamName', 'members', 'institution', 'className', 'whatsapp', 'email', 'github', 'productName']);
  const ideaDone = groupValid(['problem', 'users', 'features']);
  const emailSuggestion = touched.email && !errorFor('email') ? suggestEmail(form.email.trim()) : null;

  const describedBy = (key) => (errorFor(key) ? `${key}-error` : `${key}-hint`);
  const inputProps = (key, extra = {}) => ({
    id: key,
    name: key,
    className: 'field-input',
    value: form[key],
    onChange: (e) => update({ [key]: e.target.value }),
    onBlur: () => touch(key),
    'aria-invalid': errorFor(key) ? true : undefined,
    'aria-describedby': describedBy(key),
    ...extra,
  });

  return (
    <section id="register" className="section border-t border-line bg-surface">
      <div className="page">
        <SectionHeading
          eyebrow="রেজিস্ট্রেশন"
          title="এখনই রেজিস্টার করো"
          subtitle={`রেজিস্ট্রেশন শেষ ${dates.registrationDeadlineLabel}। ফর্ম পূরণ করে আইডিয়া জমা দাও — ইমেইলে কনফার্মেশন পাঠানো হবে।`}
        />

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:items-start lg:gap-14">
          <aside className="space-y-6 lg:sticky lg:top-24">
            <div className="rounded-2xl bg-navy p-7 text-white">
              <p className="flex items-center gap-2 text-sm text-white/70">
                <CalendarDays className="h-4 w-4" /> শেষ সময়
              </p>
              <p className="mt-2 font-display text-3xl font-semibold text-white">২৩ নভেম্বর</p>
              <p className="text-white/80">রাত ১১:৫৯ (UTC+6)</p>
              <ul className="mt-6 space-y-3 border-t border-white/15 pt-6 text-[15px] text-white/85">
                {['২৫ নভেম্বর কনফার্মড তালিকা ঘোষণা', 'ইমেইলে কনফার্মেশন পাবে', 'একজন শুধু একটি টিমে অংশ নিতে পারবে', 'কোনো অভিজ্ঞতা লাগবে না, কোনো ফি নেই'].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-signal" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3 px-1 text-sm text-ink-3">
              <p className="flex gap-3"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> তথ্য শুধু {event.organizer} আয়োজক কমিটি দেখবে।</p>
              <p className="flex gap-3"><Clock3 className="mt-0.5 h-4 w-4 shrink-0" /> প্রায় ৩ মিনিট লাগবে। লেখা এই ব্রাউজারে আপনা-আপনি সেভ হয়।</p>
              <p className="flex gap-3"><Search className="mt-0.5 h-4 w-4 shrink-0" /> <span>আগে রেজিস্টার করেছ? <Link href="/status" className="link">স্ট্যাটাস দেখো</Link></span></p>
            </div>
          </aside>

          {done ? (
            <Success successRef={successRef} done={done} onCalendar={downloadCalendar} />
          ) : closed ? (
            <div className="card p-8 text-center sm:p-10">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sunken text-ink-2"><Lock className="h-5 w-5" /></span>
              <h3 className="mt-4 text-xl font-semibold">রেজিস্ট্রেশন বন্ধ হয়ে গেছে</h3>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-ink-2">{dates.registrationDeadlineLabel}-এ রেজিস্ট্রেশন শেষ হয়েছে। আগে রেজিস্টার করে থাকলে তোমার আইডিয়ার অবস্থা দেখে নাও।</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/status" className="btn-primary">স্ট্যাটাস দেখো <ArrowRight className="h-4 w-4" /></Link>
                <Link href="/confirmed" className="btn-secondary">কনফার্মড তালিকা</Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="card p-6 sm:p-9" aria-label="রেজিস্ট্রেশন ফর্ম">
              {restored && (
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-soft/60 px-4 py-3 text-sm text-ink-2">
                  <span>আগের অসম্পূর্ণ লেখা ফিরিয়ে আনা হয়েছে।</span>
                  <button type="button" onClick={clearDraft} className="inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-ink">
                    <RotateCcw className="h-3.5 w-3.5" /> নতুন করে শুরু করো
                  </button>
                </div>
              )}

              {/* Summary after a failed submit: what to fix, each item a link to its field */}
              <div ref={summaryRef} tabIndex={-1} className="scroll-mt-24 outline-none">
                {(notice || (submitted && shownErrors.length > 0)) && (
                  <div role="alert" className={`mb-8 rounded-xl border p-4 sm:p-5 ${notice?.tone === 'warn' && !shownErrors.length ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}>
                    {notice && (
                      <>
                        <p className="font-semibold text-ink">{notice.title}</p>
                        <p className="mt-1 text-[15px] text-ink-2">{notice.text}</p>
                        {notice.action && <Link href={notice.action.href} className="link mt-2 inline-block text-sm">{notice.action.label} →</Link>}
                      </>
                    )}
                    {shownErrors.length > 0 && (
                      <>
                        <p className={`font-semibold text-red-800 ${notice ? 'mt-4' : ''}`}>{bn(shownErrors.length)}টি ঘর ঠিক করতে হবে</p>
                        <ul className="mt-2 space-y-1.5 text-[15px]">
                          {shownErrors.map((k) => (
                            <li key={k}>
                              <a
                                href={`#${fieldId(k)}`}
                                onClick={(ev) => {
                                  ev.preventDefault();
                                  // For features, go to the first required box that's still empty.
                                  const firstEmpty = form.features.findIndex((f, i) => i < LIMITS.featuresRequired && !f.trim());
                                  const el = document.getElementById(k === 'features' && firstEmpty > 0 ? `feature-${firstEmpty}` : fieldId(k));
                                  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                  el?.focus({ preventScroll: true });
                                }}
                                className="text-red-800 underline decoration-red-300 underline-offset-2 hover:decoration-red-700"
                              >
                                <strong className="font-semibold">{LABELS[k]}:</strong> {errorFor(k)}
                              </a>
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-8">
                <FormGroup index="১" title="তোমার পরিচয়" subtitle="কে অংশ নিচ্ছে?" complete={identityDone}>
                  <div>
                    <p className="field-label" id="reg-type-label">একা না টিমে?</p>
                    <div role="radiogroup" aria-labelledby="reg-type-label" className="grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1">
                      {[
                        { value: 'solo', label: 'একা', icon: User },
                        { value: 'team', label: 'টিম (২–৩ জন)', icon: Users },
                      ].map(({ value, label, icon: Icon }) => (
                        <button
                          key={value}
                          id={`reg-type-${value}`}
                          type="button"
                          role="radio"
                          aria-checked={form.registrationType === value}
                          onClick={() => setType(value)}
                          className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                            form.registrationType === value ? 'bg-surface text-ink shadow-card' : 'text-ink-3 hover:text-ink'
                          }`}
                        >
                          <Icon className="h-4 w-4" /> {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {isTeam ? (
                    <div className="space-y-5 rounded-xl border border-line bg-paper p-4 sm:p-5">
                      <Field id="teamName" label="টিমের নাম" error={errorFor('teamName')}>
                        <input {...inputProps('teamName', { maxLength: LIMITS.teamName + 20, autoComplete: 'off' })} placeholder="যেমন: Team Syntax Error" />
                      </Field>

                      <fieldset aria-describedby={errorFor('members') ? 'members-error' : 'members-hint'}>
                        <legend className="field-label">সদস্যদের নাম <span className="font-normal text-ink-3">· লিডার বেছে নাও</span></legend>
                        <div className="space-y-2.5">
                          {form.members.map((member, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <input
                                id={`member-${i}`}
                                className="field-input"
                                aria-label={`সদস্য ${bn(i + 1)}${i > 1 ? ' (ঐচ্ছিক)' : ''}`}
                                aria-invalid={errorFor('members') ? true : undefined}
                                placeholder={`সদস্য ${bn(i + 1)} এর পুরো নাম${i > 1 ? ' (ঐচ্ছিক)' : ''}`}
                                autoComplete="off"
                                maxLength={LIMITS.member + 20}
                                value={member}
                                onChange={(e) => setMember(i, e.target.value)}
                                onBlur={() => i >= 1 && touch('members')}
                              />
                              <label
                                className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-2.5 text-xs font-semibold transition ${
                                  form.teamLeader === i && member.trim() ? 'border-brand bg-brand-soft text-brand-ink' : 'border-line-strong text-ink-3'
                                } ${member.trim() ? '' : 'pointer-events-none opacity-40'}`}
                              >
                                <input
                                  type="radio"
                                  name="teamLeader"
                                  aria-label={`সদস্য ${bn(i + 1)} লিডার`}
                                  className="h-3.5 w-3.5 accent-brand"
                                  checked={form.teamLeader === i}
                                  disabled={!member.trim()}
                                  onChange={() => update({ teamLeader: i })}
                                />
                                লিডার
                              </label>
                            </div>
                          ))}
                        </div>
                        {!errorFor('members') && <p id="members-hint" className="field-hint">২ বা ৩ জন। লিডারের নামেই রেজিস্ট্রেশন হবে, যোগাযোগ তার সাথেই।</p>}
                        <FieldError id="members-error" message={errorFor('members')} />
                      </fieldset>
                    </div>
                  ) : (
                    <Field id="fullName" label="পুরো নাম" error={errorFor('fullName')}>
                      <input {...inputProps('fullName', { autoComplete: 'name', maxLength: LIMITS.fullName + 20 })} placeholder="যেমন: রহিম উদ্দিন" />
                    </Field>
                  )}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Field id="institution" label="প্রতিষ্ঠানের নাম" error={errorFor('institution')}>
                      <input {...inputProps('institution', { autoComplete: 'organization', maxLength: LIMITS.institution + 20 })} placeholder="স্কুল / কলেজ / বিশ্ববিদ্যালয়" />
                    </Field>
                    <Field id="className" label="শ্রেণি / সেমিস্টার" error={errorFor('className')}>
                      <input {...inputProps('className', { maxLength: LIMITS.className + 20 })} placeholder="Class 12 / 3rd Semester" />
                    </Field>
                    <Field id="whatsapp" label="WhatsApp নম্বর" error={errorFor('whatsapp')} hint={normalised.whatsapp ? `“${normalised.whatsapp}” থেকে ঠিক করা হয়েছে` : 'যে নম্বরে WhatsApp আছে'}>
                      <input {...inputProps('whatsapp', { type: 'tel', inputMode: 'tel', autoComplete: 'tel-national', maxLength: 20, onBlur: () => normaliseOnBlur('whatsapp') })} placeholder="01XXXXXXXXX" />
                    </Field>
                    <Field
                      id="email"
                      label="ইমেইল"
                      error={errorFor('email')}
                      hint={
                        emailSuggestion ? (
                          <p id="email-hint" className="field-hint">
                            তুমি কি{' '}
                            <button type="button" onClick={() => update({ email: emailSuggestion })} className="font-semibold text-brand underline underline-offset-2">
                              {emailSuggestion}
                            </button>{' '}
                            বোঝাতে চেয়েছ?
                          </p>
                        ) : (
                          'কনফার্মেশন ও অ্যাপ্রুভাল লিংক এখানে যাবে'
                        )
                      }
                    >
                      <input {...inputProps('email', { type: 'email', inputMode: 'email', autoComplete: 'email', autoCapitalize: 'none', spellCheck: false, maxLength: 254 })} placeholder="you@example.com" />
                    </Field>
                    <Field id="github" label="GitHub ইউজারনেম" error={errorFor('github')} hint={normalised.github ? 'লিংক থেকে ইউজারনেম নেওয়া হয়েছে' : 'লিংক পেস্ট করলেও চলবে'}>
                      <input {...inputProps('github', { autoComplete: 'off', autoCapitalize: 'none', spellCheck: false, maxLength: 200, onBlur: () => normaliseOnBlur('github') })} placeholder="your-github-username" />
                    </Field>
                    <Field id="productName" label="প্রোডাক্টের নাম" error={errorFor('productName')} hint="পরে বদলানো যাবে">
                      <input {...inputProps('productName', { maxLength: LIMITS.productName + 20 })} placeholder="যেমন: বাজারদর" />
                    </Field>
                  </div>
                </FormGroup>

                <FormGroup index="২" title="তোমার আইডিয়া" subtitle="আয়োজকরা এটা পড়েই অ্যাপ্রুভ করবেন।" complete={ideaDone}>
                  <Field id="problem" label="কোন সমস্যার সমাধান করবে?" error={errorFor('problem')} hint="কে, কী সমস্যায় পড়ছে, আর এখন সে কীভাবে সামলায়?" aside={<Counter value={form.problem} max={LIMITS.long} min={LIMITS.problemMin} />}>
                    <textarea {...inputProps('problem')} rows={3} className="field-input resize-y" placeholder="যেমন: বাজারে প্রতিদিন দাম বদলায়, কিন্তু ক্রেতারা আগে থেকে জানতে পারেন না…" />
                  </Field>
                  <Field id="users" label="কারা এটি ব্যবহার করবে?" error={errorFor('users')} aside={<Counter value={form.users} max={LIMITS.long} />}>
                    <textarea {...inputProps('users')} rows={2} className="field-input resize-y" placeholder="যেমন: শহরের পরিবার, ছোট দোকানদার" />
                  </Field>
                  <FeatureList
                    features={form.features}
                    error={errorFor('features')}
                    onChange={(features) => update({ features })}
                    onLeave={() => touch('features')}
                  />
                </FormGroup>

                <FormGroup index="৩" title="নিশ্চিত করো" complete={form.agree}>
                  <div>
                    <label
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 text-[15px] text-ink-2 transition-colors hover:border-ink-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft/50 ${
                        errorFor('agree') ? 'border-red-400' : 'border-line-strong'
                      }`}
                    >
                      <input
                        id="agree"
                        type="checkbox"
                        checked={form.agree}
                        onChange={(e) => update({ agree: e.target.checked })}
                        aria-invalid={errorFor('agree') ? true : undefined}
                        aria-describedby={errorFor('agree') ? 'agree-error' : undefined}
                        className="mt-1 h-4 w-4 shrink-0 accent-brand"
                      />
                      <span>
                        আমি <Link href="/rulebook" target="_blank" className="link">রুলবুক</Link> পড়েছি এবং সব নিয়ম মেনে চলব
                      </span>
                    </label>
                    <FieldError id="agree-error" message={errorFor('agree')} />
                  </div>

                  {/* honeypot */}
                  <div className="honeypot" aria-hidden="true">
                    <label htmlFor="website">Leave this field empty</label>
                    <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => update({ website: e.target.value })} />
                  </div>
                </FormGroup>
              </div>

              <div className="mt-8">
                <button type="submit" disabled={submitting} className="btn-brand w-full !py-4 !text-base">
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" /> পাঠানো হচ্ছে…
                    </>
                  ) : (
                    <>
                      রেজিস্ট্রেশন জমা দাও <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
                <p className="mt-3 text-center text-sm text-ink-3">জমা দেওয়ার পর তথ্য বদলাতে হলে আয়োজকদের জানাও।</p>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Success({ successRef, done, onCalendar }) {
  const who = done.registrationType === 'team' ? done.teamName : done.fullName;
  return (
    <div ref={successRef} tabIndex={-1} className="card rise scroll-mt-24 p-6 outline-none sm:p-9" role="status">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-green-50 text-green-700"><CheckCircle2 className="h-6 w-6" /></span>
      <h3 className="mt-4 text-2xl font-semibold">রেজিস্ট্রেশন সম্পন্ন হয়েছে</h3>
      <p className="mt-2 text-[15px] text-ink-2">
        ধন্যবাদ, {who}!{' '}
        {done.emailed ? (
          <>কনফার্মেশন ইমেইল গেছে <strong className="break-all text-ink">{done.email}</strong>-এ (স্প্যাম ফোল্ডারও দেখো)।</>
        ) : (
          <>তোমার রেজিস্ট্রেশন আমরা পেয়েছি। ইমেইল দেরিতে আসতে পারে — স্ট্যাটাস পেজে যেকোনো সময় অবস্থা দেখতে পারবে।</>
        )}
      </p>

      <dl className="mt-6 grid gap-x-6 gap-y-3 rounded-xl bg-paper p-4 text-sm sm:grid-cols-2">
        <div><dt className="text-ink-3">প্রোডাক্ট</dt><dd className="font-semibold text-ink">{done.productName}</dd></div>
        <div><dt className="text-ink-3">{done.registrationType === 'team' ? 'টিম লিডার' : 'নাম'}</dt><dd className="font-semibold text-ink">{done.fullName}</dd></div>
        <div><dt className="text-ink-3">ইমেইল</dt><dd className="break-all font-semibold text-ink">{done.email}</dd></div>
        <div><dt className="text-ink-3">WhatsApp</dt><dd className="font-semibold text-ink">{done.whatsapp}</dd></div>
      </dl>

      <h4 className="mt-7 text-sm font-semibold text-ink">এরপর যা হবে</h4>
      <ol className="mt-3 space-y-3">
        {[
          ['২৪–২৫ নভেম্বর', 'আয়োজকরা আইডিয়া যাচাই করবে; অ্যাপ্রুভ হলে ইমেইলে সাবমিশন লিংক পাবে'],
          ['২৬ নভেম্বর', 'ব্রিফিং ও WhatsApp গ্রুপ'],
          ['২৭ নভেম্বর, সকাল ১০টা', '১২ ঘণ্টার মূল প্রতিযোগিতা শুরু'],
        ].map(([when, what], i) => (
          <li key={when} className="flex gap-3 text-[15px]">
            <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold ${i === 0 ? 'bg-brand text-white' : 'bg-sunken text-ink-2'}`}>{bn(i + 1)}</span>
            <span><span className="text-ink-3">{when} · </span><span className="text-ink">{what}</span></span>
          </li>
        ))}
      </ol>

      <div className="mt-7 flex flex-wrap gap-3">
        <button type="button" onClick={onCalendar} className="btn-primary">
          <CalendarPlus className="h-4 w-4" /> ক্যালেন্ডারে যোগ করো
        </button>
        <Link href="/status" className="btn-secondary">স্ট্যাটাস দেখো</Link>
        <Link href="/rulebook" className="btn-secondary">রুলবুক</Link>
      </div>
    </div>
  );
}

/**
 * Main features: three required inputs, up to two more optional ones.
 * Enter moves to the next box (or adds one) instead of submitting the form.
 */
function FeatureList({ features, error, onChange, onLeave }) {
  const refs = useRef([]);
  const required = LIMITS.featuresRequired;
  const canAdd = features.length < LIMITS.featuresMax;

  const focus = (i) => requestAnimationFrame(() => refs.current[i]?.focus());
  const set = (i, value) => onChange(features.map((f, j) => (j === i ? value : f)));
  const add = () => {
    if (!canAdd) return;
    onChange([...features, '']);
    focus(features.length);
  };
  const remove = (i) => {
    onChange(features.filter((_, j) => j !== i));
    focus(Math.min(i, features.length - 2));
  };

  return (
    <fieldset
      aria-describedby={error ? 'features-error' : 'features-hint'}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && onLeave()}
    >
      <legend className="field-label">প্রধান ফিচার <span className="font-normal text-ink-3">· ৩টি আবশ্যক, চাইলে আরও ২টি</span></legend>
      <ol className="space-y-2.5">
        {features.map((value, i) => {
          const optional = i >= required;
          const missing = error && !optional && !value.trim();
          const n = [...value].length;
          return (
            <li key={i} className="flex items-center gap-2">
              <span aria-hidden className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-display text-[13px] font-semibold ${value.trim() ? 'bg-brand text-white' : 'bg-sunken text-ink-3'}`}>
                {bn(i + 1)}
              </span>
              <div className="relative min-w-0 flex-1">
                <input
                  ref={(el) => (refs.current[i] = el)}
                  id={`feature-${i}`}
                  className={`field-input ${n > LIMITS.feature * 0.8 ? '!pr-16' : ''}`}
                  aria-label={`ফিচার ${bn(i + 1)}${optional ? ' (ঐচ্ছিক)' : ''}`}
                  aria-invalid={missing || (error && n > LIMITS.feature) ? true : undefined}
                  placeholder={optional ? 'আরেকটি ফিচার (ঐচ্ছিক)' : FEATURE_EXAMPLES[i]}
                  maxLength={LIMITS.feature + 40}
                  enterKeyHint={i < features.length - 1 || canAdd ? 'next' : 'done'}
                  value={value}
                  onChange={(e) => set(i, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== 'Enter' || e.nativeEvent.isComposing) return;
                    e.preventDefault();
                    if (i < features.length - 1) focus(i + 1);
                    else if (value.trim()) add();
                  }}
                />
                {n > LIMITS.feature * 0.8 && (
                  <span className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${n > LIMITS.feature ? 'font-semibold text-red-600' : 'text-ink-3'}`}>
                    {bn(n)}/{bn(LIMITS.feature)}
                  </span>
                )}
              </div>
              {optional ? (
                <button type="button" onClick={() => remove(i)} aria-label={`ফিচার ${bn(i + 1)} সরাও`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-3 transition-colors hover:bg-sunken hover:text-ink">
                  <X className="h-4 w-4" />
                </button>
              ) : (
                <span aria-hidden className="w-9 shrink-0" />
              )}
            </li>
          );
        })}
      </ol>
      {canAdd && (
        <button type="button" onClick={add} className="ml-9 mt-2.5 inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft">
          <Plus className="h-4 w-4" /> আরেকটি ফিচার যোগ করো <span className="font-normal text-ink-3">(আরও {bn(LIMITS.featuresMax - features.length)}টি)</span>
        </button>
      )}
      {!error && <p id="features-hint" className="field-hint ml-9">প্রতিটি ঘরে একটি করে, ছোট করে লেখো। ১২ ঘণ্টায় বানানো যায় এমন স্কোপ রাখো।</p>}
      <div className="ml-9"><FieldError id="features-error" message={error} /></div>
    </fieldset>
  );
}
