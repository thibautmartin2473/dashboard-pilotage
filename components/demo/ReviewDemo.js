'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, Panel, ToggleButton } from '@/components/ui';
import ReviewBilan from './ReviewBilan';
import ReviewChat from './ReviewChat';
import ReviewWeek from './ReviewWeek';
import { findNextBlock, planWrites } from './ReviewLogic';

export default function ReviewDemo({ data: realData }) {
  const [simulate, setSimulate] = useState(false);
  const [variant, setVariant] = useState('A');
  const [tab, setTab] = useState('bilan');
  const [marks, setMarks] = useState({}); // blockId -> { mode, lines, done, recased }
  const [extra, setExtra] = useState({}); // clé -> lignes (revue du dimanche)

  const data = useMemo(() => {
    if (!simulate || !realData.sim) return realData;
    const { sim } = realData;
    return {
      ...realData,
      blocks: sim.blocks,
      reviewDayLabel: sim.label,
      usedFallback: false,
      simulated: true,
      future: realData.future.filter((b) => b.day > sim.day),
    };
  }, [simulate, realData]);

  const mark = (block, mode, doneIds = []) => {
    const next = findNextBlock(block, data.future);
    const plan = planWrites({ block, tasks: block.tasks, mode, doneIds, next });
    setMarks((m) => ({ ...m, [block.id]: { mode, ...plan } }));
  };
  const unmark = (id) =>
    setMarks((m) => {
      const { [id]: _drop, ...rest } = m;
      return rest;
    });
  const emit = (key, lines) => setExtra((e) => ({ ...e, [key]: lines }));
  const undo = (key) =>
    setExtra((e) => {
      const { [key]: _drop, ...rest } = e;
      return rest;
    });
  const markAllDone = () => data.blocks.forEach((b) => !marks[b.id] && mark(b, 'done'));

  const allHandled = data.blocks.length > 0 && data.blocks.every((b) => marks[b.id]);
  const recased = Object.values(marks).reduce((n, m) => n + m.recased, 0);
  const writes = useMemo(
    () => [...Object.values(marks).flatMap((m) => m.lines), ...Object.values(extra).flat()],
    [marks, extra]
  );

  const bilanProps = { data, marks, mark, unmark, markAllDone, allHandled };

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div role="status" className="rounded-xl border border-amber-700 bg-amber-950/40 px-4 py-2.5 text-sm text-amber-200">
        <strong className="font-semibold">Démo : rien n&apos;est enregistré.</strong>{' '}
        Tes vraies données sont lues, mais chaque geste reste dans cet onglet.{' '}
        <Link href="/demo" className="underline underline-offset-2">Retour aux démos</Link>
      </div>

      <h1 className="mt-4 text-xl font-bold text-zinc-100">Bilan de la veille et revue de la semaine</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Une seule carte remplace les « Oublié hier ? » fabriquées chaque jour (95 en base aujourd&apos;hui, jamais traitées).
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Variante">
        <ToggleButton pressed={variant === 'A'} onClick={() => setVariant('A')}>Variante A : sur l&apos;accueil</ToggleButton>
        <ToggleButton pressed={variant === 'B'} onClick={() => setVariant('B')}>Variante B : dans le chat</ToggleButton>
      </div>
      <p className="mt-2 text-xs text-zinc-400">
        {variant === 'A'
          ? "A : la carte de bilan s'affiche en haut de l'accueil jusqu'à ce qu'elle soit traitée."
          : 'B : la routine de midi écrit la carte dans la session Claude, tu réponds en une ligne.'}
      </p>

      {realData.sim && tab === 'bilan' && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ToggleButton pressed={simulate} onClick={() => { setSimulate((v) => !v); setMarks({}); }}>
            Simuler : traiter le {realData.sim.label} comme si c&apos;était hier
          </ToggleButton>
          <span className="min-w-0 text-xs text-zinc-400">
            Les blocs orange passés sont effacés de l&apos;agenda lu et leurs tâches n&apos;y retrouvent plus leur bloc : cette simulation prend de vrais blocs à venir qui ont des tâches.
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Onglet">
        <ToggleButton pressed={tab === 'bilan'} onClick={() => setTab('bilan')}>Bilan d&apos;hier</ToggleButton>
        <ToggleButton pressed={tab === 'revue'} onClick={() => setTab('revue')}>Revue du dimanche</ToggleButton>
      </div>

      <div className="mt-4 grid gap-4">
        {tab === 'bilan' && variant === 'A' && <ReviewBilan {...bilanProps} />}
        {tab === 'bilan' && variant === 'B' && <ReviewChat {...bilanProps} />}
        {tab === 'revue' && (
          <ReviewWeek data={data} recased={recased} emit={emit} undo={undo} variant={variant} />
        )}

        <Panel title="Ce qui serait écrit pour de vrai" count={writes.length}>
          {writes.length === 0 ? (
            <p className="text-sm text-zinc-400">Rien pour l&apos;instant. Clique sur un bouton : chaque geste ajoute ici la ligne exacte qui serait écrite en base.</p>
          ) : (
            <>
              <ol className="grid gap-1.5 font-mono text-xs text-zinc-300">
                {writes.map((w, i) => (
                  <li key={`${i}-${w}`} className="min-w-0 break-words rounded border border-zinc-800 bg-zinc-950 px-2 py-1.5">{w}</li>
                ))}
              </ol>
              <Button className="mt-3" onClick={() => { setMarks({}); setExtra({}); }}>Tout remettre à zéro</Button>
            </>
          )}
        </Panel>
      </div>
    </main>
  );
}
