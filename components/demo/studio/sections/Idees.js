'use client';

import { useState } from 'react';
import { dayOfEvent, diffDays } from '@/components/demo/DeadlinesLogic';
import { Button, Card, Empty, Page, Pill, ageLabel, trunc } from './kit';

// Idées : notes en attente de tri. Trois gestes simulés : en faire une tâche, garder, écarter.
export default function IdeesView({ data, log }) {
  const [fate, setFate] = useState({}); // id -> 'task' | 'keep' | 'drop'

  const act = (n, kind) => {
    const title = trunc(n.content.replace(/\s+/g, ' '), 60);
    if (kind === 'task') log(`brain_notes : transformer en tâche "${title}"`);
    if (kind === 'keep') log(`brain_notes : garder pour plus tard "${title}"`);
    if (kind === 'drop') log(`brain_notes : écarter "${title}"`);
    setFate((f) => ({ ...f, [n.id]: kind }));
  };

  const pending = data.ideas.filter((n) => !fate[n.id]).length;

  return (
    <Page
      eyebrow="À trier"
      title="Idées"
      lead={
        data.ideas.length === 0
          ? 'Aucune idée en attente.'
          : `${pending} idée${pending > 1 ? 's' : ''} à trier sur ${data.ideas.length}. Chacune se tranche en un geste.`
      }
    >
      {data.ideas.length === 0 ? (
        <Card>
          <Empty>La boîte à idées est vide.</Empty>
        </Card>
      ) : (
        <ul className="grid grid-cols-1 gap-[var(--k-gap)] sm:grid-cols-2">
          {data.ideas.map((n) => {
            const age = n.created_at ? diffDays(data.today, dayOfEvent(n.created_at)) : null;
            const state = fate[n.id];
            return (
              <li key={n.id}>
                <Card className="flex h-full flex-col gap-3 p-4 sm:p-5">
                  <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${state === 'drop' ? 'text-[color:var(--text-muted)] line-through' : 'text-[color:var(--text)]'}`}>
                    {n.content}
                  </p>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--text-muted)]">
                    {age !== null && <span>{ageLabel(age)}</span>}
                    {n.project_slug && <Pill>{n.project_slug}</Pill>}
                    {age !== null && age >= 7 && !state && <Pill tone="warning">en attente depuis {age} j</Pill>}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-2 pt-1">
                    {state ? (
                      <>
                        <Pill tone={state === 'task' ? 'success' : 'muted'}>
                          {state === 'task' ? 'Devient une tâche' : state === 'keep' ? 'Gardée' : 'Écartée'} (simulé)
                        </Pill>
                        <button
                          type="button"
                          className="text-xs text-[color:var(--accent)] underline-offset-2 hover:underline"
                          onClick={() => setFate((f) => ({ ...f, [n.id]: undefined }))}
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <>
                        <Button tone="accent" onClick={() => act(n, 'task')}>
                          En faire une tâche
                        </Button>
                        <Button onClick={() => act(n, 'keep')}>Garder</Button>
                        <Button onClick={() => act(n, 'drop')}>Écarter</Button>
                      </>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Page>
  );
}
