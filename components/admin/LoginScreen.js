'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Mark } from '../Logo';

export default function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'লগইন ব্যর্থ।');
      setPassword('');
      onLoggedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-paper px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <Mark className="h-8 w-8 text-ink" />
          <div className="leading-tight">
            <p className="font-display text-lg font-bold">OnnoPoth</p>
            <p className="text-xs text-ink-3">আয়োজক ড্যাশবোর্ড</p>
          </div>
        </div>
        <form onSubmit={submit} className="card space-y-5 p-6 sm:p-7">
          <div>
            <h1 className="text-xl font-semibold">সাইন ইন</h1>
            <p className="mt-1 text-sm text-ink-3">রেজিস্ট্রেশন রিভিউ, সাবমিশন ও ফলাফল এখান থেকে।</p>
          </div>
          <div>
            <label className="field-label" htmlFor="admin-email">ইমেইল</label>
            <input id="admin-email" type="email" autoComplete="username" required className="field-input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="admin-pass">পাসওয়ার্ড</label>
            <input id="admin-pass" type="password" autoComplete="current-password" required className="field-input" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && (
            <p className="field-error" role="alert">
              <AlertCircle className="h-4 w-4" /> {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'লগইন করুন'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/" className="text-ink-3 hover:text-ink">← ওয়েবসাইটে ফিরে যান</Link>
        </p>
      </div>
    </div>
  );
}
