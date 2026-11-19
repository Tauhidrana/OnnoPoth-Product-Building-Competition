'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CalendarDays, Check, CheckCircle2, Clock3, Loader2, Lock, ShieldCheck, User, Users } from 'lucide-react';
import SectionHeading from './SectionHeading';
import { dates, isRegistrationOpen, event } from '@/lib/config';

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
  features: '',
  agree: false,
  website: '', // hidden honeypot
};

const PHONE_RE = /^01\d{9}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="field-error" role="alert">
      <AlertCircle className="h-3.5 w-3.5" /> {message}
    </p>
  );
}

/** Label + control + error, wired together for screen readers. */
function Field({ id, label, hint, error, children }) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>{label}</label>
      {children}
      {hint && !error && <p className="field-hint">{hint}</p>}
      <FieldError message={error} />
    </div>
  );
}

/** Numbered group; the number turns into a tick once its fields are filled. */
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

export default function RegistrationForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [serverMessage, setServerMessage] = useState('');
  const [registrationOpen, setRegistrationOpen] = useState(null);

  // Client-only check after mount → no hydration mismatch.
  useEffect(() => {
    setRegistrationOpen(isRegistrationOpen());
  }, []);

  const isTeam = form.registrationType === 'team';

  const setField = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const setMember = (index, value) => {
    setForm((prev) => {
      const members = [...prev.members];
      members[index] = value;
      return { ...prev, members };
    });
  };

  const clearError = (name) => setErrors((prev) => ({ ...prev, [name]: undefined }));

  function validate() {
    const next = {};
    const leaderName = isTeam
      ? (form.members[form.teamLeader] || '').trim() || (form.members[0] || '').trim()
      : form.fullName.trim();

    if (!leaderName) next.fullName = 'নাম আবশ্যক।';
    if (isTeam && !form.members.some((m) => m.trim())) {
      next.members = 'কমপক্ষে একজন সদস্যের নাম লিখুন।';
    }
    if (isTeam && !form.teamName.trim()) next.teamName = 'টিমের নাম আবশ্যক।';
    if (!form.institution.trim()) next.institution = 'প্রতিষ্ঠানের নাম আবশ্যক।';
    if (!form.className.trim()) next.className = 'শ্রেণি/সেমিস্টার আবশ্যক।';

    const phone = form.whatsapp.replace(/[\s-]/g, '');
    if (!PHONE_RE.test(phone)) next.whatsapp = 'সঠিক WhatsApp নম্বর দিন (01XXXXXXXXX)।';
    if (!EMAIL_RE.test(form.email.trim())) next.email = 'সঠিক ইমেইল ঠিকানা দিন।';
    if (!form.github.trim()) next.github = 'GitHub ইউজারনেম আবশ্যক।';
    if (!form.productName.trim()) next.productName = 'প্রোডাক্টের নাম আবশ্যক।';
    if (!form.problem.trim()) next.problem = 'কোন সমস্যার সমাধান করবে তা লিখুন।';
    if (!form.users.trim()) next.users = 'কারা এটি ব্যবহার করবে তা লিখুন।';
    if (!form.features.trim()) next.features = 'প্রধান ফিচারগুলো লিখুন।';
    if (!form.agree) next.agree = 'রুলবুক পড়ার নিশ্চিতকরণ আবশ্যক।';

    return next;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (submitting || registrationOpen === false) return;

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) {
      // Take the person straight to the first field that needs fixing.
      const first = Object.keys(found)[0];
      const id = first === 'members' || (first === 'fullName' && isTeam) ? 'member-0' : first;
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.focus({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    setStatus(null);
    setServerMessage('');

    const leaderName = isTeam
      ? (form.members[form.teamLeader] || form.members[0]).trim()
      : form.fullName.trim();
    const payload = { ...form, fullName: leaderName };

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('success');
        setForm(EMPTY_FORM);
      } else {
        setStatus('error');
        setServerMessage(data.error || 'কিছু একটা সমস্যা হয়েছে। আবার চেষ্টা করুন।');
        if (data.fields) setErrors(data.fields);
      }
    } catch {
      setStatus('error');
      setServerMessage('ইন্টারনেট সংযোগ যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  }

  const closed = registrationOpen === false;
  const filled = (v) => String(v).trim().length > 0;
  const identityDone =
    (isTeam ? filled(form.teamName) && form.members.some(filled) : filled(form.fullName)) &&
    [form.institution, form.className, form.whatsapp, form.email, form.github, form.productName].every(filled);
  const ideaDone = [form.problem, form.users, form.features].every(filled);
  const inputProps = (name) => ({
    id: name,
    className: 'field-input',
    value: form[name],
    onChange: (e) => setField(name, e.target.value),
    'aria-invalid': errors[name] ? true : undefined,
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
                {[
                  '২৫ নভেম্বর কনফার্মড তালিকা ঘোষণা',
                  'ইমেইলে কনফার্মেশন পাবে',
                  'একজন শুধু একটি টিমে অংশ নিতে পারবে',
                  'কোনো অভিজ্ঞতা লাগবে না, কোনো ফি নেই',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 shrink-0 text-signal" strokeWidth={3} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3 px-1 text-sm text-ink-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                তথ্য শুধু {event.organizer} আয়োজক কমিটি দেখবে। প্রশ্ন থাকলে{' '}
                <a href="#contact" className="link">যোগাযোগ করো</a>।
              </p>
            </div>
          </aside>

          <form onSubmit={handleSubmit} noValidate className="card p-6 sm:p-9">
            {closed && (
              <div className="mb-8 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
                <Lock className="h-5 w-5 shrink-0" />
                রেজিস্ট্রেশনের সময় শেষ হয়ে গেছে। ধন্যবাদ!
              </div>
            )}

            <div className="space-y-8">
              <FormGroup index="১" title="তোমার পরিচয়" subtitle="কে অংশ নিচ্ছে?" complete={identityDone}>
                <div>
                  <p className="field-label" id="reg-type">রেজিস্ট্রেশনের ধরন</p>
                  <div role="radiogroup" aria-labelledby="reg-type" className="grid grid-cols-2 gap-1 rounded-xl bg-sunken p-1">
                    {[
                      { value: 'solo', label: 'একা', icon: User },
                      { value: 'team', label: 'টিম (৩ জন পর্যন্ত)', icon: Users },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={form.registrationType === value}
                        onClick={() => {
                          setField('registrationType', value);
                          setStatus(null);
                        }}
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
                  <div className="space-y-5 rounded-xl border border-line bg-paper p-5">
                    <Field id="teamName" label="টিমের নাম" error={errors.teamName}>
                      <input {...inputProps('teamName')} placeholder="যেমন: Team Syntax Error" />
                    </Field>

                    <div>
                      <p className="field-label">সদস্যদের নাম</p>
                      <div className="space-y-2.5">
                        {form.members.map((member, i) => (
                          <input
                            key={i}
                            id={`member-${i}`}
                            className="field-input"
                            aria-label={`সদস্য ${i + 1}`}
                            placeholder={`সদস্য ${i + 1} এর পুরো নাম${i === 0 ? '' : ' (ঐচ্ছিক)'}`}
                            value={member}
                            onChange={(e) => {
                              setMember(i, e.target.value);
                              clearError('members');
                              clearError('fullName');
                            }}
                          />
                        ))}
                      </div>
                      <FieldError message={errors.members || errors.fullName} />
                    </div>

                    <Field id="teamLeader" label="টিম লিডার">
                      <select
                        id="teamLeader"
                        className="field-input"
                        value={form.teamLeader}
                        onChange={(e) => setField('teamLeader', Number(e.target.value))}
                      >
                        {form.members.map((member, i) => (
                          <option key={i} value={i}>
                            সদস্য {i + 1}{member.trim() ? ` — ${member.trim()}` : ' (খালি)'}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                ) : (
                  <Field id="fullName" label="পুরো নাম" error={errors.fullName}>
                    <input {...inputProps('fullName')} placeholder="তোমার পুরো নাম" autoComplete="name" />
                  </Field>
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <Field id="institution" label="প্রতিষ্ঠানের নাম" error={errors.institution}>
                    <input {...inputProps('institution')} placeholder="স্কুল / কলেজ / বিশ্ববিদ্যালয়" />
                  </Field>
                  <Field id="className" label="শ্রেণি / সেমিস্টার" error={errors.className}>
                    <input {...inputProps('className')} placeholder="Class 12 / 3rd Semester" />
                  </Field>
                  <Field id="whatsapp" label="WhatsApp নম্বর" error={errors.whatsapp}>
                    <input {...inputProps('whatsapp')} placeholder="01XXXXXXXXX" inputMode="numeric" autoComplete="tel" />
                  </Field>
                  <Field id="email" label="ইমেইল" error={errors.email}>
                    <input {...inputProps('email')} type="email" placeholder="you@example.com" autoComplete="email" />
                  </Field>
                  <Field id="github" label="GitHub ইউজারনেম" error={errors.github}>
                    <input {...inputProps('github')} placeholder="your-github-username" autoCapitalize="none" />
                  </Field>
                  <Field id="productName" label="প্রোডাক্টের নাম" error={errors.productName}>
                    <input {...inputProps('productName')} placeholder="তোমার প্রোডাক্টের নাম" />
                  </Field>
                </div>
              </FormGroup>

              <FormGroup index="২" title="তোমার আইডিয়া" subtitle="কী বানাবে, কেন বানাবে?" complete={ideaDone}>
                <Field id="problem" label="কোন সমস্যার সমাধান করবে?" error={errors.problem}>
                  <textarea {...inputProps('problem')} rows={3} className="field-input resize-y" placeholder="কে, কী সমস্যার মুখোমুখি হচ্ছে?" />
                </Field>
                <Field id="users" label="কারা এটি ব্যবহার করবে?" error={errors.users}>
                  <textarea {...inputProps('users')} rows={2} className="field-input resize-y" placeholder="যেমন: গ্রামের শিক্ষার্থী, ছোট দোকানদার" />
                </Field>
                <Field id="features" label="প্রধান ৩–৫টি ফিচার" error={errors.features}>
                  <textarea {...inputProps('features')} rows={4} className="field-input resize-y" placeholder="১. লগইন  ২. ড্যাশবোর্ড  ৩. রিপোর্ট …" />
                </Field>
              </FormGroup>

              <FormGroup index="৩" title="নিশ্চিত করো" complete={form.agree}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-line-strong p-4 text-[15px] text-ink-2 transition-colors hover:border-ink-3 has-[:checked]:border-brand has-[:checked]:bg-brand-soft/50">
                  <input
                    id="agree"
                    type="checkbox"
                    checked={form.agree}
                    onChange={(e) => {
                      setField('agree', e.target.checked);
                      clearError('agree');
                    }}
                    className="mt-1 h-4 w-4 shrink-0 accent-brand"
                  />
                  <span>
                    আমি{' '}
                    <Link href="/rulebook" target="_blank" className="link">রুলবুক</Link>{' '}
                    পড়েছি এবং সব নিয়ম মেনে চলব
                  </span>
                </label>
                <FieldError message={errors.agree} />

                {/* honeypot */}
                <div className="honeypot" aria-hidden="true">
                  <label htmlFor="website">Leave this field empty</label>
                  <input
                    id="website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form.website}
                    onChange={(e) => setField('website', e.target.value)}
                  />
                </div>
              </FormGroup>
            </div>

            <div className="mt-8">
              <button type="submit" disabled={submitting || closed} className="btn-brand w-full !py-4 !text-base">
                {closed ? (
                  <>রেজিস্ট্রেশন বন্ধ</>
                ) : submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" /> পাঠানো হচ্ছে…
                  </>
                ) : (
                  <>
                    রেজিস্ট্রেশন জমা দাও <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-sm text-ink-3">
                <Clock3 className="h-3.5 w-3.5" /> প্রায় ২ মিনিট লাগবে
              </p>
            </div>

            {status === 'success' && (
              <div className="rise mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-5 text-[15px] text-green-800" role="status">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">রেজিস্ট্রেশন সফল হয়েছে</p>
                  <p className="mt-1 leading-relaxed">
                    ২৫ নভেম্বর কনফার্মড তালিকা ঘোষণা করা হবে। ইনবক্সে কনফার্মেশন ইমেইল দেখে নাও (স্প্যাম ফোল্ডারও)।
                  </p>
                </div>
              </div>
            )}

            {status === 'error' && (
              <div className="rise mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-[15px] text-red-800" role="alert">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold">কিছু সমস্যা হয়েছে</p>
                  <p className="mt-1 leading-relaxed">{serverMessage}</p>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}
