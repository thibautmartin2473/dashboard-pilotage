'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button, ToggleButton } from '@/components/ui';
import {
  addDays, classify, countdown, ordinal, shortDate, urgency,
} from '@/components/demo/DeadlinesLogic';

const SECTION_TITLE = 'font-mono text-[11px] font-semibold tracking-[0.1em] text-zinc-400 uppercase';

function prepLine(d) {
  const n = d.prep.length + (d.extraPrep ?? 0);
  if (n > 0) return { ok: true, text: `Préparation prévue : ${n} bloc${n > 1 ? 's' : ''} d'ici là` };
  return { ok: false, text: 'Aucune préparation prévue' };
}

function DeadlineCard({ d, compact, onPrep, onDone }) {
  const u = urgency(d.days);
  const prep = prepLine(d);
  return (
    <li data-testid="deadline-card" className={`rounded-xl border px-3.5 py-3 ${u.box}`}>
      <div className="flex items-start gap-3">
        <div className="w-16 shrink-0">
          <div className={`tabular font-mono text-xl font-bold ${u.text}`}>{countdown(d.days)}</div>
          <div className={`font-mono text-[10px] tracking-[0.08em] uppercase ${u.text}`}>{u.label}</div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold break-words text-zinc-100">{d.title}</div>
          <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
            {d.kind.label}
            {d.day ? ` · ${shortDate(d.day)}` : ''}
            {compact ? '' : ` · source : ${d.from}`}
          </div>
          <div className={`mt-1 text-xs ${prep.ok ? 'text-zinc-300' : 'font-semibold text-red-400'}`}>{prep.text}</div>
        </div>
      </div>
      {!compact && (
        <div className="mt-2 flex flex-wrap gap-2">
          {!prep.ok && <Button onClick={() => onPrep(d)}>Poser un bloc de préparation</Button>}
          <Button onClick={() => onDone(d)}>{d.source === 'task' ? 'Marquer cette échéance faite' : 'Masquer cette échéance'}</Button>
        </div>
      )}
    </li>
  );
}

const PIPE = [
  { key: 'todo', label: 'À faire' },
  { key: 'sent', label: 'Envoyé, en attente de réponse' },
  { key: 'closed', label: 'Clos' },
];

function RelanceCard({ r, state, today, onMove }) {
  const st = state ?? { stage: 'todo' };
  return (
    <li data-testid="relance-card" className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
      <div className="text-sm break-words text-zinc-100">{r.title}</div>
      <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
        {r.person ? `Personne : ${r.person}` : 'Personne non repérée dans le titre'}
        {st.stage === 'sent' ? ` · relancer le ${shortDate(st.remindOn)} (dans 7 jours)` : ' · relancer dans 7 jours une fois envoyé'}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {st.stage === 'todo' && <Button onClick={() => onMove(r, 'sent')}>Marquer envoyé</Button>}
        {st.stage === 'sent' && (
          <>
            <Button onClick={() => onMove(r, 'closed')}>Réponse reçue, clore</Button>
            <Button onClick={() => onMove(r, 'resent')}>Relancer à nouveau, +7 jours</Button>
          </>
        )}
        {st.stage === 'closed' && <Button onClick={() => onMove(r, 'todo')}>Rouvrir</Button>}
      </div>
      <span className="sr-only">{today}</span>
    </li>
  );
}

export default function DeadlinesDemo({ tasks, events, today, error }) {
  const [variant, setVariant] = useState('A');
  const [hidden, setHidden] = useState(() => new Set());
  const [extraPrep, setExtraPrep] = useState({});
  const [pipe, setPipe] = useState({});
  const [log, setLog] = useState([]);
  const add = (line) => setLog((l) => [...l, line]);

  const result = useMemo(() => classify({ tasks, events, today }), [tasks, events, today]);
  const deadlines = result.deadlines
    .filter((d) => !hidden.has(d.id))
    .map((d) => ({ ...d, extraPrep: extraPrep[d.id] ?? 0 }));
  const dated = deadlines.filter((d) => d.days !== null);
  const undated = deadlines.filter((d) => d.days === null);
  const noPrep = deadlines.filter((d) => d.days !== null && d.days >= 0 && d.prep.length + d.extraPrep === 0).length;
  const total = tasks.length;
  const classified = total - result.other.length;

  const onPrep = (d) => {
    const when = d.days !== null && d.days >= 2 ? addDays(today, Math.max(0, d.days - 2)) : today;
    setExtraPrep((p) => ({ ...p, [d.id]: (p[d.id] ?? 0) + 1 }));
    add(`calendar_events : poser un bloc orange "Préparation : ${d.title}" le ${shortDate(when)} (couleur 6, [bloc planifié])`);
  };
  const onDone = (d) => {
    setHidden((h) => new Set(h).add(d.id));
    add(
      d.source === 'task'
        ? `tasks : marquer fait "${d.title}" (done_at = maintenant)`
        : `deadlines : masquer "${d.title}" (aucune écriture dans l'agenda Google, seulement un filtre d'affichage)`
    );
  };
  const onMove = (r, to) => {
    if (to === 'sent' || to === 'resent') {
      const remindOn = addDays(today, 7);
      setPipe((p) => ({ ...p, [r.id]: { stage: 'sent', remindOn } }));
      add(
        to === 'sent'
          ? `tasks : marquer fait "${r.title}" ; contact_followups : créer un suivi (étape "envoyé", relance le ${shortDate(remindOn)})`
          : `contact_followups : repousser la relance de "${r.title}" au ${shortDate(remindOn)} (compteur de relances +1)`
      );
    } else if (to === 'closed') {
      setPipe((p) => ({ ...p, [r.id]: { stage: 'closed' } }));
      add(`contact_followups : clore le suivi de "${r.title}" (réponse reçue)`);
    } else {
      setPipe((p) => ({ ...p, [r.id]: { stage: 'todo' } }));
      add(`contact_followups : rouvrir le suivi de "${r.title}" (étape "à faire")`);
    }
  };
  const countStage = (k) => result.relances.filter((r) => (pipe[r.id]?.stage ?? 'todo') === k).length;

  const band = (
    <section aria-label="Échéances" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className={SECTION_TITLE}>Échéances</h2>
        <span className="font-mono text-[11px] text-zinc-400">
          {dated.length} datées{noPrep ? `, ${noPrep} sans préparation` : ''}
        </span>
      </div>
      {dated.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-400">Aucune échéance détectée dans les tâches ouvertes ni dans l&apos;agenda.</p>
      ) : (
        <ul className="mt-2 grid gap-2">
          {(variant === 'A' ? dated.slice(0, 5) : dated).map((d) => (
            <DeadlineCard key={d.id} d={d} compact={variant === 'A'} onPrep={onPrep} onDone={onDone} />
          ))}
        </ul>
      )}
      {variant === 'A' && (
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-400">
          <span>
            {countStage('todo') + countStage('sent')} relances ouvertes, {result.recurrences.length} récurrences
          </span>
          <Button onClick={() => setVariant('B')}>Voir la page Échéances complète (Variante B)</Button>
        </div>
      )}
    </section>
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div role="status" className="rounded-lg border border-amber-700 bg-amber-950/40 px-3 py-2 text-sm text-amber-300">
        Démo : rien n&apos;est enregistré.{' '}
        <Link href="/demo" className="underline underline-offset-2">
          Retour à la liste des démos
        </Link>
      </div>

      <h1 className="mt-4 text-2xl font-bold text-zinc-100">Échéances, relances et récurrences</h1>
      <p className="mt-1 text-sm text-zinc-400">
        Ce qui n&apos;est pas du travail à faire dans un bloc, mais une date à ne pas rater, sort de la to-do.
      </p>
      {error && <p role="alert" className="mt-2 text-sm text-red-400">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Variante">
        <ToggleButton pressed={variant === 'A'} onClick={() => setVariant('A')}>
          Variante A : bande en haut de l&apos;accueil
        </ToggleButton>
        <ToggleButton pressed={variant === 'B'} onClick={() => setVariant('B')}>
          Variante B : page Échéances dédiée
        </ToggleButton>
      </div>

      <div className="mt-4 grid gap-4">
        {variant === 'A' && (
          <p className="font-mono text-[11px] text-zinc-400">
            Emplacement prévu : tout en haut de l&apos;accueil, au-dessus des tuiles. Les relances et les récurrences ne
            prennent qu&apos;une ligne.
          </p>
        )}
        {band}

        {variant === 'B' && (
          <div className="grid gap-4 lg:grid-cols-2">
            <section aria-label="Relances de personnes" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <h2 className={SECTION_TITLE}>Relances de personnes</h2>
              {result.relances.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400">Aucune tâche ne nomme une personne à contacter.</p>
              ) : (
                <div className="mt-2 grid gap-3">
                  {PIPE.map((col) => {
                    const list = result.relances.filter((r) => (pipe[r.id]?.stage ?? 'todo') === col.key);
                    return (
                      <div key={col.key}>
                        <h3 className="font-mono text-[10px] tracking-[0.08em] text-zinc-400 uppercase">
                          {col.label} ({list.length})
                        </h3>
                        {list.length > 0 && (
                          <ul className="mt-1.5 grid gap-2">
                            {list.map((r) => (
                              <RelanceCard key={r.id} r={r} state={pipe[r.id]} today={today} onMove={onMove} />
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section aria-label="Récurrences" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
              <h2 className={SECTION_TITLE}>Récurrences</h2>
              {result.recurrences.length === 0 ? (
                <p className="mt-2 text-sm text-zinc-400">Aucun paiement mensuel détecté.</p>
              ) : (
                <ul className="mt-2 grid gap-2">
                  {result.recurrences.map((r) => (
                    <li key={r.key} data-testid="recurrence-card" className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5">
                      <div className="text-sm font-semibold text-zinc-100">{r.label}</div>
                      <div className="text-sm text-zinc-300">
                        Tous les {ordinal(r.dom)} du mois, prochain : {shortDate(r.next)}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
                        Remplace {r.tasks.length} tâche{r.tasks.length > 1 ? 's' : ''} ouverte{r.tasks.length > 1 ? 's' : ''}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          onClick={() =>
                            add(`recurrences : "${r.label}" payé pour le ${shortDate(r.next)} ; prochaine occurrence recalculée`)
                          }
                        >
                          Marquer payé ce mois-ci
                        </Button>
                        <Button
                          onClick={() =>
                            add(
                              `tasks : fusionner ${r.tasks.length} tâche${r.tasks.length > 1 ? 's' : ''} "${r.label}" en une règle recurrences (jour ${r.dom}) ; supprimer les ${r.tasks.length} lignes`
                            )
                          }
                        >
                          Fusionner en une récurrence
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {undated.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-mono text-[10px] tracking-[0.08em] text-zinc-400 uppercase">
                    Échéances sans date ({undated.length})
                  </h3>
                  <ul className="mt-1.5 grid gap-2">
                    {undated.map((d) => (
                      <DeadlineCard key={d.id} d={d} onPrep={onPrep} onDone={onDone} />
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>
        )}

        <section aria-label="Couverture" className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
          <p data-testid="unclassified" className="text-sm text-zinc-300">
            Non classées : {result.other.length} sur {total} tâches ouvertes ({classified} reconnues par mots-clés).
          </p>
          {result.other.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-zinc-400">Voir les tâches non classées</summary>
              <ul className="mt-2 grid gap-1 text-xs text-zinc-400">
                {result.other.map((t) => (
                  <li key={t.id} className="break-words">
                    {t.title}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </section>

        <section aria-label="Ce qui serait écrit" className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={SECTION_TITLE}>Ce qui serait écrit pour de vrai</h2>
            {log.length > 0 && <Button onClick={() => { setLog([]); setHidden(new Set()); setExtraPrep({}); setPipe({}); }}>Tout remettre à zéro</Button>}
          </div>
          {log.length === 0 ? (
            <p className="mt-2 text-sm text-zinc-400">Rien pour l&apos;instant. Chaque geste ci-dessus ajoute une ligne ici.</p>
          ) : (
            <ol className="mt-2 grid list-decimal gap-1 pl-5 font-mono text-xs break-words text-zinc-300">
              {log.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
