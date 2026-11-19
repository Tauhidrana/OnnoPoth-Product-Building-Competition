import { Mark } from './Logo';
import { event, idCardSample } from '@/lib/config';

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

function Field({ label, value, wide, mono }) {
  return (
    <div className={`min-w-0 ${wide ? 'col-span-2' : ''}`}>
      <dt className="text-[11px] font-medium text-ink-3">{label}</dt>
      <dd className={`mt-0.5 break-words text-[15px] font-semibold leading-snug text-ink ${mono ? 'font-mono text-[14px]' : ''}`}>{value}</dd>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div className="border-t border-line pt-4 first:border-0 first:pt-0">
      <p className="mb-3 text-xs font-semibold text-brand">{title}</p>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3">{children}</dl>
    </div>
  );
}

/**
 * Competitor identity card.
 * Renders exactly the eight identity fields — nothing added, nothing omitted.
 * Used on the website (home) and inside the printable rulebook PDF.
 */
export default function CompetitorIdCard({ data = idCardSample }) {
  return (
    <article
      aria-label={`Competitor ID — ${data.fullName}`}
      className="id-card mx-auto grid w-full max-w-[680px] overflow-hidden rounded-[20px] border border-line bg-surface shadow-lift sm:grid-cols-[230px_minmax(0,1fr)]"
    >
      {/* Identity panel */}
      <div className="relative flex flex-col bg-navy p-6 text-white sm:p-7">
        <div className="flex items-center gap-2">
          <Mark className="h-7 w-7 text-white" dot="#8fb2ff" />
          <span className="font-display text-base font-semibold">OnnoPoth</span>
        </div>

        <div className="mt-7 flex items-center gap-4 sm:mt-10 sm:block">
          <span
            aria-hidden
            className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand font-display text-xl font-semibold tracking-wide text-white ring-4 ring-white/10"
          >
            {initials(data.fullName)}
          </span>
          <div className="min-w-0 sm:mt-5">
            <p className="text-[11px] font-medium text-white/60">Full Name</p>
            <p className="mt-0.5 break-words font-display text-[22px] font-semibold leading-tight text-white">{data.fullName}</p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/15 pt-4 sm:mt-auto">
          <span className="text-xs font-semibold text-white/80">Competitor ID</span>
          <span className="rounded-full bg-signal px-2.5 py-0.5 text-[11px] font-bold text-navy">২৭ নভেম্বর</span>
        </div>
      </div>

      {/* Details */}
      <div className="flex flex-col">
        <div className="space-y-4 p-6 sm:p-7">
          <Group title="শিক্ষা">
            <Field label="Institution" value={data.institution} />
            <Field label="Class / Department" value={data.className} />
          </Group>
          <Group title="যোগাযোগ">
            <Field label="WhatsApp" value={data.whatsapp} mono />
            <Field label="GitHub Username" value={data.github} mono />
            <Field label="Email" value={data.email} wide mono />
          </Group>
          <Group title="টিম">
            <Field label="Team Name" value={data.teamName} />
            <Field label="Team Leader" value={data.teamLeader} />
          </Group>
        </div>
        <p className="mt-auto truncate border-t border-line bg-paper px-6 py-3 text-xs text-ink-3 sm:px-7">
          {event.name} · {event.mode}
        </p>
      </div>
    </article>
  );
}
