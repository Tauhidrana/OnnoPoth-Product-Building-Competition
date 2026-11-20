/** RFC 4180 CSV with a UTF-8 BOM so Excel shows Bangla correctly. Neutralises formula injection. */
export function toCsv(columns, rows) {
  const cell = (v) => {
    let s = v == null ? '' : Array.isArray(v) ? v.join('; ') : v instanceof Date ? v.toISOString() : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [columns.map(([, label]) => cell(label)).join(',')];
  for (const row of rows) lines.push(columns.map(([key]) => cell(row[key])).join(','));
  return '﻿' + lines.join('\r\n') + '\r\n';
}
