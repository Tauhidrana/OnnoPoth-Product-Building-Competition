'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, Download, ExternalLink, Loader2, LogOut, RefreshCw } from 'lucide-react';
import { Mark } from '../Logo';
import { phaseAt } from '@/lib/phase';
import { api, ago, n, ToastProvider, useToast } from './ui';
import LoginScreen from './LoginScreen';
import RegistrationsView from './RegistrationsView';
import SubmissionsView, { rowsFromScores } from './SubmissionsView';
import ResultsView from './ResultsView';
import ActivityView from './ActivityView';

const TABS = [
  { id: 'registrations', label: 'রেজিস্ট্রেশন' },
  { id: 'submissions', label: 'সাবমিশন ও নম্বর' },
  { id: 'results', label: 'ফলাফল' },
  { id: 'activity', label: 'অ্যাক্টিভিটি' },
];

export default function AdminApp() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}

function Dashboard() {
  const toast = useToast();
  const [state, setState] = useState('loading'); // loading | login | ready | error
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loadedAt, setLoadedAt] = useState(null);
  const [tab, setTab] = useState('registrations');
  const [regFilter, setRegFilter] = useState('pending');
  const [resultSeed, setResultSeed] = useState(null);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const d = await api('/api/admin/data');
      setData(d);
      setLoadedAt(new Date());
      setState('ready');
    } catch (e) {
      if (e.name === 'AuthError') setState('login');
      else {
        setError(e.message);
        setState((s) => (s === 'ready' ? s : 'error'));
        toast(e.message, { tone: 'error' });
      }
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    const fromHash = window.location.hash.slice(1);
    if (TABS.some((t) => t.id === fromHash)) setTab(fromHash);
    load();
  }, [load]);

  // Keep data fresh while the tab is open.
  useEffect(() => {
    if (state !== 'ready') return;
    const onFocus = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onFocus);
    const id = setInterval(onFocus, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(id);
    };
  }, [state, load]);

  const go = (id, filter) => {
    setTab(id);
    if (filter) setRegFilter(filter);
    history.replaceState(null, '', `#${id}`);
  };

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setData(null);
    setState('login');
  }

  async function resendAll(ids) {
    try {
      const res = await api('/api/admin/resend', { ids });
      await load();
      toast(`${n(res.sent)}টি ইমেইল গেছে${res.failed ? ` · ${n(res.failed)}টি ব্যর্থ` : ''}`, { tone: res.failed ? 'error' : 'info' });
    } catch (e) {
      toast(e.message, { tone: 'error' });
    }
  }

  if (state === 'login') return <LoginScreen onLoggedIn={load} />;
  if (state === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-paper">
        <Loader2 className="h-7 w-7 animate-spin text-ink-3" aria-label="লোড হচ্ছে" />
      </div>
    );
  }
  if (state === 'error') {
    return (
      <div className="grid min-h-screen place-items-center bg-paper px-4 text-center">
        <div>
          <p className="font-semibold">ড্যাশবোর্ড লোড করা যায়নি</p>
          <p className="mt-1 text-sm text-ink-3">{error}</p>
          <button onClick={load} className="btn-primary mt-5">আবার চেষ্টা করুন</button>
        </div>
      </div>
    );
  }

  const { stats, registrations, submissions, results, activity, emails, emailConfigured, me } = data;
  const unsentDecisions = registrations.filter((r) => r.status !== 'pending' && (!r.decisionEmail || r.decisionEmail.status !== 'sent'));

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[90rem] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Mark className="h-7 w-7 text-ink" />
            <span className="font-display font-bold">OnnoPoth</span>
            <span className="hidden rounded-md bg-sunken px-2 py-0.5 text-xs font-medium text-ink-2 sm:inline">আয়োজক ড্যাশবোর্ড</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="hidden text-xs text-ink-3 md:inline">{loadedAt && `আপডেট ${ago(loadedAt)}`}</span>
            <button onClick={load} disabled={refreshing} className="rounded-lg p-2 text-ink-2 hover:bg-sunken" title="রিফ্রেশ" aria-label="রিফ্রেশ">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <a href="/api/admin/export?type=registrations" className="rounded-lg p-2 text-ink-2 hover:bg-sunken" title="রেজিস্ট্রেশন CSV" aria-label="রেজিস্ট্রেশন CSV ডাউনলোড">
              <Download className="h-4 w-4" />
            </a>
            <Link href="/" target="_blank" className="rounded-lg p-2 text-ink-2 hover:bg-sunken" title="ওয়েবসাইট" aria-label="ওয়েবসাইট খুলুন">
              <ExternalLink className="h-4 w-4" />
            </Link>
            <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
            <span className="hidden max-w-[12rem] truncate text-sm text-ink-3 sm:inline">{me}</span>
            <button onClick={logout} className="rounded-lg p-2 text-ink-2 hover:bg-sunken" title="লগআউট" aria-label="লগআউট">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[90rem] space-y-6 px-4 py-6 sm:px-6">
        {!emailConfigured && (
          <div role="status" className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">ইমেইল এখনো সেটআপ হয়নি</p>
              <p className="mt-0.5">
                রেজিস্ট্রেশন ও সিদ্ধান্ত ঠিকমতো সংরক্ষিত হচ্ছে, শুধু ইমেইল যাচ্ছে না। SMTP সেটিংস যোগ করার পর এখান থেকে বাকি ইমেইল এক ক্লিকে পাঠানো যাবে। এর মধ্যে অ্যাপ্রুভড টিমকে “সাবমিশন লিংক কপি” করে WhatsApp-এ পাঠাতে পারেন।
              </p>
            </div>
          </div>
        )}
        {emailConfigured && unsentDecisions.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface p-4 text-sm">
            <p><strong>{n(unsentDecisions.length)}</strong>টি সিদ্ধান্তের ইমেইল এখনো পাঠানো হয়নি।</p>
            <button onClick={() => resendAll(unsentDecisions.map((r) => r.id))} className="btn-primary !py-2 !text-sm">বাকি ইমেইল পাঠান</button>
          </div>
        )}

        <Overview stats={stats} submissions={submissions} onGo={go} />

        <nav role="tablist" aria-label="ড্যাশবোর্ড" className="flex gap-1 overflow-x-auto border-b border-line">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => go(t.id)}
              className={`-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                tab === t.id ? 'border-ink text-ink' : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              {t.label}
              {t.id === 'registrations' && stats.pending > 0 && <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-xs text-amber-900">{n(stats.pending)}</span>}
            </button>
          ))}
        </nav>

        <div role="tabpanel">
          {tab === 'registrations' && (
            <RegistrationsView data={registrations} emailConfigured={emailConfigured} onChange={load} onAuthLost={() => setState('login')} initialFilter={regFilter} />
          )}
          {tab === 'submissions' && (
            <SubmissionsView
              submissions={submissions}
              registrations={registrations}
              onChange={load}
              onBuildResults={() => {
                setResultSeed(rowsFromScores(submissions, 3));
                go('results');
              }}
            />
          )}
          {tab === 'results' && <ResultsView results={results} submissions={submissions} emailConfigured={emailConfigured} onChange={load} seed={resultSeed} />}
          {tab === 'activity' && <ActivityView activity={activity} emails={emails} />}
        </div>
      </main>
    </div>
  );
}

function Overview({ stats, submissions, onGo }) {
  const phase = phaseAt();
  const unscored = submissions.filter((s) => s.score == null).length;

  // The one thing the organizer should do next, by phase.
  const next =
    stats.pending > 0 && (phase === 'registration' || phase === 'review')
      ? { text: `${n(stats.pending)}টি আইডিয়া রিভিউ বাকি`, sub: '২৫ নভেম্বর কনফার্মড তালিকা প্রকাশের আগে শেষ করুন।', label: 'রিভিউ শুরু করুন', go: ['registrations', 'pending'] }
      : phase === 'live'
        ? { text: `${n(stats.submissions)}/${n(stats.approved)} টিম জমা দিয়েছে`, sub: 'রাত ১০টায় জমা বন্ধ হবে। যারা বাকি, তাদের লিংক পাঠান।', label: 'সাবমিশন দেখুন', go: ['submissions'] }
        : phase === 'judging' && unscored > 0
          ? { text: `${n(unscored)}টি সাবমিশনে নম্বর বাকি`, sub: 'নম্বর দেওয়া শেষ হলে এক ক্লিকে ফলাফল তৈরি করা যাবে।', label: 'নম্বর দিন', go: ['submissions'] }
          : phase === 'judging' && !stats.results
            ? { text: 'ফলাফল প্রকাশের জন্য প্রস্তুত', sub: 'নম্বর থেকে শীর্ষ স্থানগুলো তৈরি করে প্রকাশ করুন।', label: 'ফলাফল তৈরি করুন', go: ['results'] }
            : { text: 'সব কাজ আপ-টু-ডেট', sub: 'নতুন কিছু এলে এখানে দেখাবে।', label: null };

  const cards = [
    { label: 'মোট রেজিস্ট্রেশন', value: stats.total, hint: stats.lastDay ? `গত ২৪ ঘণ্টায় +${n(stats.lastDay)}` : 'গত ২৪ ঘণ্টায় নতুন নেই', go: ['registrations', 'all'] },
    { label: 'অপেক্ষমাণ', value: stats.pending, hint: 'রিভিউ বাকি', tone: stats.pending ? 'text-amber-800' : '', go: ['registrations', 'pending'] },
    { label: 'অ্যাপ্রুভড', value: stats.approved, hint: `ডিক্লাইনড ${n(stats.declined)}`, go: ['registrations', 'approved'] },
    { label: 'সাবমিশন', value: stats.submissions, hint: `নম্বর দেওয়া ${n(stats.scored)}`, go: ['submissions'] },
  ];

  return (
    <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div className="flex flex-col justify-between gap-4 rounded-2xl bg-navy p-5 text-white sm:p-6">
        <div>
          <p className="text-sm text-white/60">এখন যা করতে হবে</p>
          <p className="mt-1 font-display text-2xl font-semibold text-white">{next.text}</p>
          <p className="mt-1 text-sm text-white/75">{next.sub}</p>
        </div>
        {next.label && (
          <button onClick={() => onGo(...next.go)} className="btn w-fit bg-white !py-2.5 !text-sm text-navy hover:bg-white/90">
            {next.label} <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map((c) => (
          <button key={c.label} onClick={() => onGo(...c.go)} className="card group p-4 text-left transition hover:-translate-y-0.5 hover:shadow-lift">
            <p className="text-sm text-ink-3">{c.label}</p>
            <p className={`mt-1 font-display text-3xl font-semibold tabular-nums ${c.tone || 'text-ink'}`}>{n(c.value)}</p>
            <p className="mt-0.5 text-xs text-ink-3">{c.hint}</p>
          </button>
        ))}
      </div>
    </section>
  );
}
