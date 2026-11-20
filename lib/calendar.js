import { dates, event } from './config.js';

function icsDate(value) {
  return new Date(value).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function escapeText(value) {
  return String(value).replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

/** Calendar invite for the main competition day (UTC+6 times from config). */
export function eventIcs() {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//OnnoPoth//Product Building Competition//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:onnopoth-pbc-${new Date(dates.competitionStart).getFullYear()}@onnopoth`,
    `DTSTAMP:${icsDate(Date.now())}`,
    `DTSTART:${icsDate(dates.competitionStart)}`,
    `DTEND:${icsDate(dates.competitionEnd)}`,
    `SUMMARY:${escapeText(event.name)}`,
    `DESCRIPTION:${escapeText(event.tagline)}`,
    'LOCATION:Online',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}
