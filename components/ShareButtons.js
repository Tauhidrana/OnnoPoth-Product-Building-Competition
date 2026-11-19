'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, MessageCircle } from 'lucide-react';
import { event, socialLinks } from '@/lib/config';

const pill = 'inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3.5 py-2 text-sm font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink';

/** WhatsApp / Facebook / copy-link sharing row. */
export default function ShareButtons() {
  const [url, setUrl] = useState(socialLinks.siteUrl);
  const [copied, setCopied] = useState(false);

  // Keep server and first client render identical; use the real URL after mount.
  useEffect(() => setUrl(window.location.origin), []);

  const text = `${event.name} — ${event.tagline}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked; the other share options still work.
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer" className={pill}>
        <MessageCircle className="h-4 w-4" /> WhatsApp
      </a>
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" className={pill}>
        Facebook
      </a>
      <button type="button" onClick={copyLink} className={pill} aria-live="polite">
        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
        {copied ? 'কপি হয়েছে' : 'লিংক কপি'}
      </button>
    </div>
  );
}

/** Shows the real group button once a link is configured, otherwise a status note. */
export function CommunityCard() {
  if (socialLinks.whatsappGroup) {
    return (
      <a href={socialLinks.whatsappGroup} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
        <MessageCircle className="h-4 w-4" /> WhatsApp গ্রুপে যোগ দাও
      </a>
    );
  }
  return (
    <p className="text-[15px] leading-relaxed text-ink-2">
      কনফার্মড প্রতিযোগীদের WhatsApp গ্রুপ <span className="font-semibold text-ink">২৬ নভেম্বর</span> ব্রিফিংয়ের পর চালু হবে।
    </p>
  );
}
