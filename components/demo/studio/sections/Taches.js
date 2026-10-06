'use client';

import { useMemo, useState } from 'react';
import { eventIdsOnDay, splitTasks } from '@/lib/home';
import { diffDays, shortDate } from '@/components/demo/DeadlinesLogic';
import { Check, Empty, Group, More, Page, Pill, Row, Rows, trunc } from './kit';

const PREVIEW = 6;

// Tâches : en retard / aujourd'hui / plus tard. Cocher une case est un geste simulé (journal du Studio).
export default function TachesView({ data, log }) {
  const [checked, setChecked] = useState(() => new Set());
  const [open, setOpen] = useState({});

  const sections = useMemo(() => {
    const s = splitTasks(data.tasks, data.today, eventIdsOnDay(data.events, data.today));
    return { overdue: s.overdue, today: s.today, later: [...s.next_session, ...s.inbox] };
  }, [data]);

  const toggle = (t) => {
    const next = new Set(checked);
    if (next.has(t.id)) {
      next.delete(t.id);
      log(`tasks : rouvrir "${t.title}"`);
    } else {
      next.add(t.id);
      log(`tasks : marquer fait "${t.title}"`);
    }
    setChecked(next);
  };

  const total = data.tasks.length;
  const groups = [
    { id: 'overdue', title: 'En retard', tone: 'danger', list: sections.overdue, empty: 'Rien en retard.' },
    { id: 'today', title: "Aujourd'hui", tone: 'accent', list: sections.today, empty: "Rien de prévu pour aujourd'hui." },
    { id: 'later', title: 'Plus tard', tone: 'muted', list: sections.later, empty: 'Rien de côté.' },
  ];

  return (
    <Page
      eyebrow="À faire"
      title="Tâches"
      lead={`${total} tâche${total > 1 ? 's' : ''} ouverte${total > 1 ? 's' : ''}, dont ${sections.overdue.length} en retard.`}
    >
      {groups.map((g) => {
        const shown = open[g.id] ? g.list : g.list.slice(0, PREVIEW);
        return (
          <Group key={g.id} title={g.title} count={g.list.length} tone={g.list.length ? g.tone : 'muted'}>
            {g.list.length === 0 ? (
              <Empty>{g.empty}</Empty>
            ) : (
              <>
                <Rows>
                  {shown.map((t) => {
                    const done = checked.has(t.id);
                    const late = t.due_date ? diffDays(data.today, t.due_date) : 0;
                    return (
                      <Row key={t.id} className="flex items-start gap-3">
                        <Check checked={done} onChange={() => toggle(t)} label={`Marquer fait : ${trunc(t.title, 80)}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-[15px] leading-snug break-words ${done ? 'text-[color:var(--text-muted)] line-through' : 'text-[color:var(--text)]'}`}>
                            {t.title}
                          </p>
                          {(t.project_slug || t.due_date) && (
                            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--text-muted)]">
                              {t.due_date && (
                                <span className="[font-family:var(--font-mono)]">
                                  {shortDate(t.due_date)}
                                  {late > 0 ? ` · ${late} j de retard` : ''}
                                </span>
                              )}
                              {t.project_slug && <Pill>{t.project_slug}</Pill>}
                            </p>
                          )}
                        </div>
                      </Row>
                    );
                  })}
                </Rows>
                <More
                  open={Boolean(open[g.id])}
                  hidden={g.list.length - PREVIEW}
                  onToggle={() => setOpen((o) => ({ ...o, [g.id]: !o[g.id] }))}
                />
              </>
            )}
          </Group>
        );
      })}
    </Page>
  );
}
