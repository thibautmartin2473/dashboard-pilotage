'use client';

import { useState } from 'react';
import { Button, Panel } from '@/components/ui';
import { findNextBlock } from './ReviewLogic';

const MODE_TEXT = { done: 'Fait', partial: 'En partie', skipped: 'Pas fait' };

function BlockCard({ block, mark, onMark, onUndo, future }) {
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState([]);
  const open = block.tasks.filter((t) => !t.done);
  const next = findNextBlock(block, future);
  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <li className="min-w-0 rounded-lg border border-amber-800/60 bg-zinc-950 p-3">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <span className="min-w-0 break-words text-sm font-semibold text-zinc-100">{block.title}</span>
        <span className="font-mono text-[11px] text-zinc-400">{block.dayLabel}, {block.time}</span>
      </div>
      {block.tasks.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-400">Aucune tâche rattachée à ce bloc : rien à bilanter.</p>
      ) : (
        <ul className="mt-2 grid gap-1">
          {block.tasks.map((t) => (
            <li key={t.id} className="flex min-w-0 items-start gap-2 text-sm text-zinc-200">
              {picking ? (
                <label className="flex min-w-0 items-start gap-2">
                  <input type="checkbox" className="mt-1" disabled={t.done} checked={t.done || picked.includes(t.id)} onChange={() => toggle(t.id)} />
                  <span className="min-w-0 break-words">{t.title}</span>
                </label>
              ) : (
                <span className={`min-w-0 break-words ${t.done ? 'text-zinc-500 line-through' : ''}`}>
                  {t.title}{t.done ? ' (déjà fait)' : ''}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
      {open.length > 0 && (
        <p className="mt-2 text-xs text-zinc-400">
          Si une tâche est recasée : {next ? `${next.block.dayLabel}, ${next.block.time}, "${next.block.title}"${next.sameTheme ? ' (même thème)' : ' (aucun bloc du même thème, premier bloc orange libre)'}` : 'aucun bloc orange à venir, elle passe dans Plus tard'}.
        </p>
      )}
      {mark ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full border border-emerald-700 bg-emerald-950/50 px-2.5 py-0.5 text-emerald-300">
            {MODE_TEXT[mark.mode]} : {mark.done} faite{mark.done > 1 ? 's' : ''}, {mark.recased} recasée{mark.recased > 1 ? 's' : ''}
          </span>
          <Button onClick={onUndo}>Annuler ce geste</Button>
        </div>
      ) : picking ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => { onMark('partial', picked); setPicking(false); }}>Valider : le reste est recasé</Button>
          <Button onClick={() => setPicking(false)}>Annuler</Button>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button onClick={() => onMark('done')}>Fait</Button>
          <Button onClick={() => { if (open.length > 1) { setPicked([]); setPicking(true); } else onMark('partial', []); }}>En partie</Button>
          <Button onClick={() => onMark('skipped')}>Pas fait</Button>
        </div>
      )}
    </li>
  );
}

export default function ReviewBilan({ data, marks, mark, unmark, markAllDone, allHandled }) {
  const { blocks } = data;
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-xs text-zinc-400">
        Aperçu de l&apos;accueil : la carte ci-dessous est posée tout en haut, au-dessus de l&apos;agenda, des tâches et des mails (le reste de l&apos;accueil ne change pas).
      </div>

      {allHandled ? (
        <div role="status" className="rounded-xl border border-emerald-800 bg-emerald-950/30 px-4 py-4 text-sm text-emerald-200">
          Bilan traité : la carte disparaît de l&apos;accueil jusqu&apos;à demain. Aucune notification n&apos;a été fabriquée.
          <div className="mt-3">
            <Button onClick={() => Object.keys(marks).forEach(unmark)}>Annuler tous les gestes</Button>
          </div>
        </div>
      ) : (
        <Panel title={`Bilan d'hier${data.reviewDayLabel ? ` : ${data.reviewDayLabel}` : ''}`} count={blocks.length} state={data.eventsError ? { error: 'error', message: data.eventsError } : undefined}>
          {data.usedFallback && (
            <p className="mb-3 rounded-lg border border-amber-800 bg-amber-950/30 px-3 py-2 text-xs text-amber-200">
              Hier n&apos;avait aucun bloc orange : on prend le dernier jour qui en avait (de préférence avec des tâches liées) : {data.reviewDayLabel}.
            </p>
          )}
          {data.linkedError && (
            <p className="mb-3 rounded-lg border border-red-800 bg-red-950/30 px-3 py-2 text-xs text-red-300">Tâches liées illisibles : {data.linkedError}</p>
          )}
          {blocks.length === 0 ? (
            <p className="text-sm text-zinc-400">Aucun bloc orange passé dans l&apos;agenda lu : rien à bilanter.</p>
          ) : (
            <>
              <ul className="grid gap-3">
                {blocks.map((b) => (
                  <BlockCard key={b.id} block={b} mark={marks[b.id]} future={data.future} onMark={(mode, ids) => mark(b, mode, ids)} onUndo={() => unmark(b.id)} />
                ))}
              </ul>
              <Button className="mt-4 w-full" onClick={markAllDone}>Tout était fait</Button>
            </>
          )}
          <p className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            Règle : si tu ne fais rien pendant 2 jours, les tâches non traitées de ces blocs passent seules dans « Plus tard ».
            Rien ne s&apos;accumule, rien n&apos;est notifié.
          </p>
        </Panel>
      )}
    </div>
  );
}
