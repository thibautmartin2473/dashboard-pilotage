'use client';

import { useMemo, useState } from 'react';
import { classify, shortDate } from '@/components/demo/DeadlinesLogic';
import { Card, Empty, Group, Label, More, Page, Pill, Row, Rows, longDay } from './kit';

const PREVIEW = 8;

// Échéances : ce qui a une date et ne se déplace pas (candidatures, tests, examens, dépôts),
// détecté par mots-clés dans les titres et dans l'agenda (classify de DeadlinesLogic).
const toneOf = (days) => (days <= 3 ? 'danger' : days <= 10 ? 'warning' : 'muted');

export default function EcheancesView({ data }) {
  const [open, setOpen] = useState(false);
  const { upcoming, recurrences } = useMemo(() => {
    const c = classify({ tasks: data.tasks, events: data.events, today: data.today });
    return { upcoming: c.deadlines.filter((d) => d.days !== null && d.days >= 0), recurrences: c.recurrences };
  }, [data]);

  const shown = open ? upcoming : upcoming.slice(0, PREVIEW);
  const first = upcoming[0];

  return (
    <Page
      eyebrow="Dates qui ne bougent pas"
      title="Échéances"
      lead={
        first
          ? `${upcoming.length} échéance${upcoming.length > 1 ? 's' : ''} à venir. La prochaine : ${first.title}, ${first.days === 0 ? "aujourd'hui" : first.days === 1 ? 'demain' : `dans ${first.days} jours`}.`
          : 'Aucune échéance détectée à venir.'
      }
    >
      <Group title="À venir" count={upcoming.length} tone={first && first.days <= 3 ? 'danger' : 'muted'}>
        {upcoming.length === 0 ? (
          <Empty>Rien à l&apos;horizon.</Empty>
        ) : (
          <>
            <Rows>
              {shown.map((d) => {
                const tone = toneOf(d.days);
                const color = tone === 'danger' ? 'var(--danger)' : tone === 'warning' ? 'var(--warning)' : 'var(--text)';
                return (
                  <Row key={d.id} className="grid grid-cols-[3.75rem_minmax(0,1fr)] items-start gap-x-3 sm:grid-cols-[5.5rem_minmax(0,1fr)] sm:gap-x-5">
                    <div>
                      <span
                        style={{ color }}
                        className="block text-2xl leading-none [font-family:var(--k-num-font)] [font-weight:var(--k-title-weight)] [letter-spacing:var(--k-title-tracking)] sm:text-3xl"
                      >
                        {d.days === 0 ? 'Auj.' : `J-${d.days}`}
                      </span>
                      <span className="mt-1.5 block text-xs text-[color:var(--text-muted)] [font-family:var(--font-mono)]">{shortDate(d.day)}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[15px] leading-snug font-medium break-words text-[color:var(--text)]">{d.title}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--text-muted)]">
                        <Pill tone={tone === 'muted' ? 'accent' : tone}>{d.kind.label}</Pill>
                        <span>{longDay(d.day)}</span>
                      </p>
                      <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                        {d.prep.length > 0
                          ? `${d.prep.length} bloc${d.prep.length > 1 ? 's' : ''} de préparation prévu${d.prep.length > 1 ? 's' : ''}`
                          : d.days <= 10
                            ? 'Aucun bloc de préparation prévu'
                            : 'Source : ' + d.from}
                      </p>
                    </div>
                  </Row>
                );
              })}
            </Rows>
            <More open={open} hidden={upcoming.length - PREVIEW} onToggle={() => setOpen((o) => !o)} />
          </>
        )}
      </Group>

      {recurrences.length > 0 && (
        <section>
          <div className="mb-3">
            <Label>Paiements récurrents</Label>
          </div>
          <Card>
            <Rows>
              {recurrences.map((r) => (
                <Row key={r.key} className="flex items-baseline justify-between gap-4">
                  <span className="text-[15px] text-[color:var(--text)]">{r.label}</span>
                  <span className="text-right text-xs text-[color:var(--text-muted)] [font-family:var(--font-mono)]">
                    prochain le {shortDate(r.next)}
                  </span>
                </Row>
              ))}
            </Rows>
          </Card>
        </section>
      )}
    </Page>
  );
}
