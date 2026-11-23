/** Shared helpers for the rulebook's docs layout (server- and client-safe). */
import { rulebookSections } from '@/lib/rulebook';

/** "১২. যোগাযোগ" → "যোগাযোগ" for navigation labels. */
export const navTitle = (title) => title.replace(/^[০-৯0-9]+\.\s*/, '');

/** Sub-headings inside a section, with the ids the renderer gives them. */
export function subHeadings(section) {
  const out = [];
  section.blocks.forEach((b) => {
    if (b.type === 'steps') b.items.forEach((s, i) => out.push({ id: `${section.id}-${i + 1}`, title: s.title }));
    if (b.type === 'qa') b.items.forEach((q, i) => out.push({ id: `${section.id}-q${i + 1}`, title: q.q }));
  });
  return out;
}

const GROUPS = [
  { title: 'শুরু করো', ids: ['intro', 'overview', 'who', 'dates'] },
  { title: 'অংশগ্রহণ', ids: ['process', 'github-vercel', 'readme'] },
  { title: 'বিচার ও নিয়ম', ids: ['judging', 'rules', 'prizes'] },
  { title: 'সাহায্য', ids: ['faq', 'contact'] },
];

const blockText = (b) =>
  [b.text, ...(b.items || []).map((i) => (typeof i === 'string' ? i : [i.title, i.q, i.a, ...(i.blocks || []).map(blockText)].join(' '))), ...(b.rows || []).flat()]
    .filter(Boolean)
    .join(' ');

/** Plain, serialisable navigation data for the client components. */
export function buildNav() {
  const byId = Object.fromEntries(rulebookSections.map((s) => [s.id, s]));
  const known = new Set(GROUPS.flatMap((g) => g.ids));
  const groups = GROUPS.map((g) => ({ title: g.title, ids: g.ids.filter((id) => byId[id]) }));
  // Any section added later without a group still shows up.
  const extra = rulebookSections.filter((s) => !known.has(s.id)).map((s) => s.id);
  if (extra.length) groups.push({ title: 'অন্যান্য', ids: extra });
  groups.at(-1).ids.push('id-card');

  const items = {
    ...Object.fromEntries(
      rulebookSections.map((s) => [s.id, { id: s.id, title: navTitle(s.title), sub: subHeadings(s), search: `${s.title} ${s.blocks.map(blockText).join(' ')}`.toLowerCase() }])
    ),
    'id-card': { id: 'id-card', title: 'প্রতিযোগীর আইডি কার্ড', sub: [], search: 'id card আইডি কার্ড পরিচয়পত্র' },
  };
  return { groups, items, order: groups.flatMap((g) => g.ids) };
}
