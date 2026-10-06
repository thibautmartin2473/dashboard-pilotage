'use client';

import { useMemo } from 'react';
import { buildWeek, doneByDay } from '@/lib/home';
import { addDays, dayOfEvent } from '@/components/demo/DeadlinesLogic';
import { Card, Empty, Group, Label, Page, Row, Rows, dayNumber, weekdayShort } from './kit';

// Revue : les chiffres de la semaine écoulée (7 jours, aujourd'hui compris), tirés de data.done.
export default function RevueView({ data }) {
  const stats = useMemo(() => {
    const byDay = doneByDay(data.done);
    const days = Array.from({ length: 7 }, (_, i) => addDays(data.today, i - 6));
    const counts = days.map((d) => ({ day: d, n: byDay[d]?.length ?? 0 }));
    const week = counts.reduce((s, c) => s + c.n, 0);
    const prevDays = Array.from({ length: 7 }, (_, i) => addDays(data.today, i - 13));
    const prev = prevDays.reduce((s, d) => s + (byDay[d]?.length ?? 0), 0);
    const overdue = data.tasks.filter((t) => t.due_date && t.due_date < data.today).length;
    const doneList = data.done
      .filter((t) => t.done_at && days.includes(dayOfEvent(t.done_at)))
      .sort((a, b) => String(b.done_at).localeCompare(String(a.done_at)));
    const wk = buildWeek(data.events, new Date(data.nowIso), data.categories, -6, 7);
    const events = wk.days.reduce((s, d) => s + d.allDay.length + d.blocks.length, 0);
    return { counts, week, prev, overdue, doneList, events, max: Math.max(1, ...counts.map((c) => c.n)) };
  }, [data]);

  const delta = stats.week - stats.prev;
  const tiles = [
    { label: 'Faites', value: stats.week, note: 'sur les 7 derniers jours' },
    {
      label: 'Semaine précédente',
      value: stats.prev,
      note: delta === 0 ? 'même rythme' : delta > 0 ? `${delta} de plus cette semaine` : `${-delta} de moins cette semaine`,
    },
    { label: 'En retard', value: stats.overdue, note: 'tâches ouvertes échues', tone: stats.overdue > 0 ? 'var(--danger)' : undefined },
    { label: 'Agenda', value: stats.events, note: 'événements sur 7 jours' },
  ];

  return (
    <Page
      eyebrow="Semaine écoulée"
      title="Revue"
      lead={
        stats.week === 0
          ? 'Aucune tâche terminée sur les sept derniers jours.'
          : `${stats.week} tâche${stats.week > 1 ? 's' : ''} terminée${stats.week > 1 ? 's' : ''} sur les sept derniers jours.`
      }
    >
      <ul className="grid grid-cols-2 gap-[var(--k-gap)] lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Card className="h-full p-4">
              <Label>{t.label}</Label>
              <p
                style={t.tone ? { color: t.tone } : undefined}
                className="mt-3 text-4xl leading-none [font-family:var(--k-num-font)] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)] text-[color:var(--text)]"
              >
                {t.value}
              </p>
              <p className="mt-2 text-xs leading-snug text-[color:var(--text-muted)]">{t.note}</p>
            </Card>
          </li>
        ))}
      </ul>

      <Group title="Jour par jour" hint="tâches terminées">
        <div
          role="img"
          aria-label={`Tâches terminées par jour : ${stats.counts.map((c) => `${weekdayShort(c.day)} ${c.n}`).join(', ')}`}
          className="flex h-44 items-end gap-2 px-4 pt-6 pb-4 sm:gap-4 sm:px-6"
        >
          {stats.counts.map((c, i) => {
            const today = i === stats.counts.length - 1;
            return (
              <div key={c.day} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
                <span className="text-xs text-[color:var(--text-muted)] [font-family:var(--font-mono)]">{c.n}</span>
                <div
                  style={{ height: c.n === 0 ? 2 : `${Math.max(8, (c.n / stats.max) * 100)}%`, background: c.n === 0 ? 'var(--border-strong)' : 'var(--accent)' }}
                  className="w-full max-w-10 rounded-t-[calc(var(--radius-sm)*0.6)]"
                />
                <span className={`text-[11px] ${today ? 'font-semibold text-[color:var(--accent)]' : 'text-[color:var(--text-muted)]'}`}>
                  {weekdayShort(c.day)} {dayNumber(c.day)}
                </span>
              </div>
            );
          })}
        </div>
      </Group>

      <Group title="Ce qui est fait" count={stats.doneList.length}>
        {stats.doneList.length === 0 ? (
          <Empty>Rien de terminé cette semaine.</Empty>
        ) : (
          <Rows>
            {stats.doneList.slice(0, 8).map((t) => (
              <Row key={t.id} className="flex items-baseline justify-between gap-4">
                <span className="min-w-0 text-[15px] leading-snug break-words text-[color:var(--text)]">{t.title}</span>
                <span className="shrink-0 text-xs text-[color:var(--text-muted)] [font-family:var(--font-mono)]">
                  {weekdayShort(dayOfEvent(t.done_at))} {dayNumber(dayOfEvent(t.done_at))}
                </span>
              </Row>
            ))}
          </Rows>
        )}
      </Group>
    </Page>
  );
}
