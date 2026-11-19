'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Loader2,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react';
import SectionHeading from '@/components/SectionHeading';

export default function AdminPage() {
  const [authed, setAuthed] = useState(null); // null = checking
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState('');
  const [reminding, setReminding] = useState(false);
  const [resultsJson, setResultsJson] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState('');

  async function loadIdeas() {
    setLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/ideas', { cache: 'no-store' });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'লোড করা যায়নি।');
      setAuthed(true);
      setIdeas(data.ideas || []);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadIdeas();
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'লগইন ব্যর্থ।');
      setAuthed(true);
      setPassword('');
      loadIdeas();
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoggingIn(false);
    }
  }

  async function sendReminders() {
    setReminding(true);
    setToast('');
    try {
      const res = await fetch('/api/admin/remind', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ব্যর্থ।');
      setToast(`${data.sent} জনকে রিমাইন্ডার ইমেইল পাঠানো হয়েছে।`);
    } catch (error) {
      setToast(`সমস্যা: ${error.message}`);
    } finally {
      setReminding(false);
    }
  }

  async function publishResults() {
    setPublishing(true);
    setToast('');
    try {
      const winners = JSON.parse(resultsJson);
      const res = await fetch('/api/admin/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ winners }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ব্যর্থ।');
      setToast(`${data.published} টি প্লেস প্রকাশিত, ${data.emailsSent} টি ইমেইল পাঠানো হয়েছে।`);
    } catch (error) {
      setToast(`সমস্যা: ${error.message}`);
    } finally {
      setPublishing(false);
    }
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setIdeas([]);
  }

  async function decide(item, decision) {
    const key = `${item.uid}-${decision}`;
    setBusy(key);
    setToast('');
    try {
      const res = await fetch('/api/admin/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: item.email,
          name: item.name,
          productName: item.productName,
          decision,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'ব্যর্থ।');
      setToast(
        decision === 'approve'
          ? `${item.name}-কে অ্যাপ্রুভ করা হয়েছে, অ্যাপ্রুভাল ইমেইল পাঠানো হয়েছে।`
          : `${item.name}-কে জানানো হয়েছে।`
      );
      setIdeas((prev) => prev.filter((i) => i.uid !== item.uid));
    } catch (error) {
      setToast(`সমস্যা: ${error.message}`);
    } finally {
      setBusy('');
    }
  }

  // ---------------- Login screen ----------------
  if (authed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="glass w-full max-w-md p-8">
          <div className="mb-6 inline-grid h-12 w-12 place-items-center rounded-2xl bg-brand">
            <ShieldCheck className="h-6 w-6 text-ink" />
          </div>
          <h1 className="text-2xl font-bold text-ink">Admin Login</h1>
          <p className="mt-2 text-sm text-ink-3">আইডিয়া পর্যালোচনার জন্য সাইন ইন করুন।</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="field-label" htmlFor="admin-email">ইমেইল</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
                <input
                  id="admin-email"
                  type="email"
                  className="field-input !pl-11"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div>
              <label className="field-label" htmlFor="admin-pass">পাসওয়ার্ড</label>
              <input
                id="admin-pass"
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {loginError && (
              <p className="field-error">
                <AlertCircle className="h-3.5 w-3.5" /> {loginError}
              </p>
            )}
            <button type="submit" disabled={loggingIn} className="btn-primary w-full">
              {loggingIn ? <Loader2 className="h-5 w-5 animate-spin" /> : 'লগইন করুন'}
            </button>
          </form>
          <p className="mt-6 text-center text-xs text-ink-3">
            <Link href="/" className="hover:text-brand-ink">← হোমে ফিরে যান</Link>
          </p>
        </div>
      </div>
    );
  }

  // ---------------- Dashboard ----------------
  return (
    <div className="min-h-screen py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Admin panel"
          title="আইডিয়া পর্যালোচনা"
          subtitle="জমা দেওয়া আইডিয়াগুলো দেখে এক ক্লিকে অ্যাপ্রুভ বা ডিক্লাইন করুন।"
        />

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-3">
            মোট <span className="font-bold text-ink">{ideas.length}</span> টি অপেক্ষমাণ আইডিয়া
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={sendReminders} disabled={reminding} className="btn-secondary !px-4 !py-2 !text-xs">
              <Mail className={`h-4 w-4 ${reminding ? 'animate-pulse' : ''}`} />
              {reminding ? 'পাঠানো হচ্ছে…' : 'রিমাইন্ডার পাঠান'}
            </button>
            <button onClick={loadIdeas} disabled={loading} className="btn-secondary !px-4 !py-2 !text-xs">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> রিফ্রেশ
            </button>
            <button onClick={logout} className="btn-secondary !px-4 !py-2 !text-xs">
              <LogOut className="h-4 w-4" /> লগআউট
            </button>
          </div>
        </div>

        {toast && (
          <div className="mt-5 rounded-2xl border border-brand/30 bg-brand-soft p-4 text-sm text-brand">
            {toast}
          </div>
        )}
        {loadError && (
          <div className="mt-5 flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" /> {loadError}
          </div>
        )}

        {authed === null || loading ? (
          <div className="mt-12 flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="glass mt-12 p-12 text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-700" />
            <p className="mt-4 font-bold text-ink">কোনো অপেক্ষমাণ আইডিয়া নেই।</p>
          </div>
        ) : (
          <div className="mt-8 space-y-5">
            {ideas.map((item) => (
              <div key={item.uid} className="glass p-6 sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand">
                      {item.registrationType === 'team' ? `Team · ${item.teamName || '—'}` : 'Solo'}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-ink">{item.productName}</h3>
                    <p className="mt-1 text-sm text-ink-3">
                      {item.name} · {item.institution} · {item.className}
                    </p>
                  </div>
                  <span className="text-xs text-ink-3">
                    {item.submittedAt ? new Date(item.submittedAt).toLocaleString('bn-BD') : ''}
                  </span>
                </div>

                <div className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                  {[
                    ['ইমেইল', item.email],
                    ['WhatsApp', item.whatsapp],
                    ['GitHub', item.github],
                    ['সমস্যা', item.problem],
                    ['ব্যবহারকারী', item.users],
                    ['ফিচার', item.features],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-xl border border-line bg-paper p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-ink-3">{label}</p>
                      <p className="mt-1 break-words text-ink">{value || '—'}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    onClick={() => decide(item, 'approve')}
                    disabled={!!busy}
                    className="btn-primary !px-5 !py-2.5 !text-xs"
                  >
                    {busy === `${item.uid}-approve` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => decide(item, 'decline')}
                    disabled={!!busy}
                    className="btn-secondary !px-5 !py-2.5 !text-xs !border-red-200 !text-red-700"
                  >
                    {busy === `${item.uid}-decline` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Publish final results (up to 10 places) */}
        <div className="glass mt-10 p-7 sm:p-9">
          <h3 className="text-lg font-bold text-ink">ফলাফল প্রকাশ করুন (সর্বোচ্চ ১০ প্লেস)</h3>
          <p className="mt-2 text-sm text-ink-3">
            নিচের ফরম্যাটে JSON পেস্ট করুন। প্রকাশের সাথে সাথেই winner-কে ফলাফল ইমেইল যাবে।
          </p>
          <textarea
            className="field-input mt-5 min-h-[180px] resize-y font-mono text-xs"
            placeholder={'[\n  {"place":"1st","name":"Team A","email":"a@example.com","product":"Product A","institution":"College","marks":92},\n  {"place":"2nd","name":"Team B","email":"b@example.com","product":"Product B","institution":"College","marks":88}\n]'}
            value={resultsJson}
            onChange={(e) => setResultsJson(e.target.value)}
          />
          <button
            onClick={publishResults}
            disabled={publishing || !resultsJson.trim()}
            className="btn-primary mt-5"
          >
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            প্রকাশ করুন ও ইমেইল পাঠান
          </button>
        </div>
      </div>
    </div>
  );
}
