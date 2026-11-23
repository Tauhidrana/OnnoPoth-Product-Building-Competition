'use client';

import { Printer } from 'lucide-react';

/** Prints the page — the browser's "Save as PDF" is available in the print dialog. */
export default function PrintButton({ compact = false }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={compact ? 'no-print inline-flex items-center gap-1.5 text-ink-3 transition-colors hover:text-ink' : 'btn-primary no-print'}
    >
      <Printer className="h-4 w-4" /> {compact ? 'প্রিন্ট / PDF' : 'Print / Save as PDF'}
    </button>
  );
}
