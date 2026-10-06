'use client';

import { useMemo } from 'react';
import { buildWeek, timeParis } from '@/lib/home';
import { Card, Dot, Label, Page, catVar, dayNumber, monthShort, weekdayShort } from './kit';

// Agenda : les 7 prochains jours, un jour par rang (date à gauche, événements à droite).
export default function AgendaView({ data }) {
  const week = useMemo(() => buildWeek(data.events, new Date(data.nowIso), data.categories, 0, 7), [data]);
  const total = week.days.reduce((n, d) => n + d.allDay.length + d.blocks.length, 0);

  // Légende : une entrée par jeton de catégorie réellement visible.
  const legend = [];
  for (const c of data.categories) {
    const v = catVar(c);
    if (!legend.some((l) => l.v === v)) legend.push({ v, name: c.name });
  }

  return (
    <Page
      eyebrow="7 prochains jours"
      title="Agenda"
      lead={total === 0 ? 'Aucun événement sur les sept prochains jours.' : `${total} événement${total > 1 ? 's' : ''} à venir, du jour même à J+6.`}
      aside={
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[color:var(--text-muted)]">
          {legend.map((l) => (
            <li key={l.v} className="flex items-center gap-1.5">
              <Dot color={l.v} />
              {l.name}
            </li>
          ))}
        </ul>
      }
    >
      <Card className="overflow-hidden">
        <ol className="divide-y divide-[color:var(--border)]">
          {week.days.map((d) => {
            const items = [
              ...d.allDay.map((e) => ({ e, allDay: true })),
              ...d.blocks.map((b) => ({ e: b, allDay: false, cat: b.category })),
            ];
            return (
              <li
                key={d.day}
                aria-current={d.isToday ? 'date' : undefined}
                className={`grid grid-cols-[3.75rem_minmax(0,1fr)] gap-x-3 px-4 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-x-6 sm:px-5 ${d.isToday ? 'bg-[var(--accent-soft)]' : ''}`}
              >
                <div className="flex flex-col">
                  <Label accent={d.isToday}>{weekdayShort(d.day)}</Label>
                  <span className={`mt-1.5 text-3xl leading-none [font-family:var(--k-num-font)] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)] ${d.isToday ? 'text-[color:var(--accent)]' : 'text-[color:var(--text)]'}`}>
                    {d.isToday && <span className="sr-only">Aujourd’hui, </span>}{dayNumber(d.day)}
                  </span>
                  <span className="mt-1 text-xs text-[color:var(--text-faint)]">{monthShort(d.day)}</span>
                </div>
                {items.length === 0 ? (
                  <p className="self-center text-sm text-[color:var(--text-faint)]">Rien de prévu.</p>
                ) : (
                  <ul className="flex flex-col gap-2.5">
                    {items.map(({ e, allDay, cat }) => (
                      <li key={`${e.id}-${d.day}`} className="flex gap-3">
                        <span
                          aria-hidden="true"
                          style={{ background: catVar(cat ?? data.categories.find((c) => c.key === (e.color_id ?? '9'))) }}
                          className="mt-0.5 w-[3px] shrink-0 self-stretch rounded-[1px]"
                        />
                        <div className="min-w-0">
                          <p className="text-[13px] leading-snug text-[color:var(--text-muted)] [font-family:var(--font-mono)]">
                            {allDay ? 'Toute la journée' : `${timeParis(e.starts_at)}${e.ends_at ? ` à ${timeParis(e.ends_at)}` : ''}`}
                          </p>
                          <p className="text-[15px] leading-snug font-medium break-words text-[color:var(--text)]">{e.title}</p>
                          {e.location && <p className="text-xs break-words text-[color:var(--text-faint)]">{e.location}</p>}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      </Card>
    </Page>
  );
}
