'use client';

// La frise des 30 jours : une règle de 30 cases (une par jour), un trait coloré par date qui compte,
// puis la liste chronologique. Un clic sur une case isole les dates de ce jour.
import { useState } from 'react';
import { dd, fmtDay, isMonday, isWeekend, weekday } from './classify';
import { Dot, Eyebrow, Ghost, KIND_LABEL, KIND_TONE, MONO, When } from './ui';

export default function Frise({ frise, today }) {
  const [sel, setSel] = useState(null);
  const { days, chips } = frise;
  const shown = sel ? chips.filter((c) => c.dayList.includes(sel)) : chips;
  const kinds = [...new Set(chips.map((c) => c.kind))];
  const selDay = sel ? days.find((d) => d.day === sel) : null;

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 [box-shadow:var(--shadow)] sm:p-4">
      <div role="group" aria-label="Les 30 prochains jours" className="grid grid-cols-[repeat(30,minmax(0,1fr))] gap-px overflow-hidden">
        {days.map((d) => {
          const isToday = d.day === today;
          const showNum = isToday || isMonday(d.day);
          const kindsOfDay = [...new Set(d.marks.map((m) => m.kind))];
          const label = `${fmtDay(d.day)}${d.marks.length ? ` : ${d.marks.map((m) => m.label).join(', ')}` : ', rien de noté'}`;
          return (
            <button
              key={d.day}
              type="button"
              aria-label={label}
              aria-pressed={sel === d.day}
              title={label}
              onClick={() => setSel(sel === d.day ? null : d.day)}
              className={`relative flex h-[4.25rem] min-w-0 cursor-pointer flex-col justify-between rounded-[2px] px-px pt-1 pb-px text-left transition-colors hover:bg-[var(--accent-soft)] ${
                isWeekend(d.day) ? 'bg-[var(--surface-2)]' : 'bg-[var(--bg)]'
              } ${sel === d.day ? 'outline-2 -outline-offset-2 outline-[var(--text)]' : ''}`}
              style={isToday ? { boxShadow: 'inset 0 -3px 0 var(--accent)' } : undefined}
            >
              <span
                className={`${MONO} block text-center text-[8px] leading-none tracking-tighter lg:text-[9px] ${isToday ? 'font-bold text-[var(--text)]' : 'text-[var(--text-faint)]'} ${
                  showNum ? '' : 'max-lg:invisible'
                }`}
              >
                {dd(d.day).slice(0, 2)}
              </span>
              <span className="flex flex-col gap-px">
                {kindsOfDay.slice(0, 4).map((k) => (
                  <span key={k} className="block h-1.5 w-full rounded-[1px]" style={{ background: KIND_TONE[k] }} />
                ))}
              </span>
            </button>
          );
        })}
      </div>
      <div className={`${MONO} mt-1.5 flex justify-between text-[11px] text-[var(--text-faint)]`}>
        <span>{fmtDay(days[0].day)}</span>
        <span>{fmtDay(days[days.length - 1].day)}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
        {kinds.map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
            <Dot color={KIND_TONE[k]} />
            {KIND_LABEL[k]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
          <span aria-hidden="true" className="inline-block h-0.5 w-3" style={{ background: 'var(--accent)' }} />
          Aujourd&apos;hui
        </span>
      </div>

      <div className="mt-3 border-t border-[var(--border)] pt-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <Eyebrow>{sel ? `Le ${weekday(sel)} ${dd(sel)}` : 'Dates qui comptent'}</Eyebrow>
          {sel ? (
            <Ghost onClick={() => setSel(null)} label="Afficher toutes les dates">
              Tout afficher
            </Ghost>
          ) : null}
        </div>
        {shown.length === 0 ? (
          <p className="text-[13px] text-[var(--text-muted)]">
            {selDay ? 'Rien de noté ce jour-là : une vraie journée de travail.' : 'Aucune date dans les 30 prochains jours.'}
          </p>
        ) : (
          <ul className="grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((c) => (
              <li key={c.key} className="flex min-w-0 items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--bg)] px-2 py-1.5">
                <Dot color={KIND_TONE[c.kind]} />
                <span className={`${MONO} w-[5.25rem] shrink-0 text-[12px] text-[var(--text)]`}>
                  {fmtDay(c.day)}
                </span>
                <span className="min-w-0 flex-1 text-[13px] leading-snug break-words text-[var(--text)] sm:truncate" title={c.dayList.length > 1 ? `${c.label} (jusqu’au ${dd(c.dayList[c.dayList.length - 1])})` : c.label}>
                  {c.label}
                </span>
                {c.dayList.length > 1 ? <span className="shrink-0 text-[12px] text-[var(--text-muted)]">x{c.dayList.length}</span> : null}
                <When days={c.days} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
