'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, ToggleButton, mutedClass } from '@/components/ui';
import {
  GESTURES, buildCards, frDay, groupNotifications, nextSunday, notifWrites, rappelLabel, summaryText, totals, writesFor,
} from './TriageLogic';

const NOTIFS = 'notifs';
const GESTURE_STYLE = {
  F: 'border-emerald-700 text-emerald-300',
  R: 'border-sky-700 text-sky-300',
  A: 'border-red-800 text-red-300',
  P: 'border-amber-700 text-amber-300',
  G: 'border-zinc-600 text-zinc-300',
  I: 'border-red-800 text-red-300',
};

function Badge({ children, tone = 'zinc' }) {
  const tones = {
    zinc: 'border-zinc-700 text-zinc-300',
    red: 'border-red-800 text-red-300',
    amber: 'border-amber-700 text-amber-300',
    sky: 'border-sky-800 text-sky-300',
  };
  return <span className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[11px] ${tones[tone]}`}>{children}</span>;
}

function dueBadge(card) {
  if (card.late > 0) return <Badge tone="red">{`en retard de ${card.late} j (due le ${frDay(card.due)})`}</Badge>;
  if (card.due) return <Badge tone="sky">{`pour le ${frDay(card.due)}`}</Badge>;
  return <Badge>sans échéance</Badge>;
}

export default function TriageDemo({ tasks, slots, notifications, today }) {
  const [variant, setVariant] = useState('A');
  const [decisions, setDecisions] = useState({});
  const [log, setLog] = useState([]); // lots d'identifiants, pour le retour arrière
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState({});
  const [showFinal, setShowFinal] = useState(false);
  const [moreNotifs, setMoreNotifs] = useState(false);

  const cards = useMemo(() => buildCards(tasks), [tasks]);
  const notifInfo = useMemo(() => groupNotifications(notifications), [notifications]);
  const sunday = useMemo(() => nextSunday(today), [today]);
  const items = useMemo(
    () => [...(notifInfo.forgotCount ? [{ id: NOTIFS, isNotifs: true }] : []), ...cards],
    [cards, notifInfo.forgotCount]
  );
  const byId = useMemo(() => Object.fromEntries(cards.map((c) => [c.id, c])), [cards]);

  const decide = useCallback((ids, decision) => {
    setDecisions((d) => ({ ...d, ...Object.fromEntries(ids.map((id) => [id, decision])) }));
    setLog((l) => [...l, ids]);
    setPicking(false);
  }, []);

  const undo = useCallback(() => {
    setLog((l) => {
      if (!l.length) return l;
      const last = l[l.length - 1];
      setDecisions((d) => {
        const next = { ...d };
        for (const id of last) delete next[id];
        return next;
      });
      return l.slice(0, -1);
    });
    setPicking(false);
    setShowFinal(false);
  }, []);

  const undoOne = (id) => {
    setDecisions((d) => {
      const next = { ...d };
      delete next[id];
      return next;
    });
    setLog((l) => l.map((batch) => batch.filter((x) => x !== id)).filter((b) => b.length));
  };

  const reset = () => {
    setDecisions({});
    setLog([]);
    setSelected({});
    setPicking(false);
    setShowFinal(false);
  };

  const current = items.find((it) => !decisions[it.id]);
  const decidedCount = items.filter((it) => decisions[it.id]).length;
  const t = totals(cards, decisions);
  const tasksDone = tasks.length - t.left;

  // Clavier (variante A seulement) : F R A P G, U pour revenir, 1-3 pour choisir un bloc, I pour les notifications.
  useEffect(() => {
    if (variant !== 'A' || !current || showFinal) return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName ?? '')) return;
      const k = e.key.toLowerCase();
      if (k === 'u') return void undo();
      if (current.isNotifs) {
        if (k === 'i') decide([NOTIFS], { g: 'I' });
        else if (k === 'g') decide([NOTIFS], { g: 'G' });
        return;
      }
      if (picking) {
        if (k === 'escape' || k === 'r') return void setPicking(false);
        const i = Number(k) - 1;
        if (i >= 0 && i < slots.length) decide([current.id], { g: 'R', slot: slots[i] });
        return;
      }
      if (k === 'r') {
        if (slots.length) setPicking(true);
      } else if ('fapg'.includes(k) && k.length === 1) {
        decide([current.id], { g: k.toUpperCase() });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [variant, current, picking, slots, decide, undo, showFinal]);

  // Lignes « Ce qui serait écrit », la plus récente d'abord.
  const writes = useMemo(() => {
    const out = [];
    for (const batch of log) {
      for (const id of batch) {
        const d = decisions[id];
        if (!d) continue;
        const lines = id === NOTIFS ? notifWrites(notifInfo, d) : writesFor(byId[id], d, { sunday });
        out.push(...lines);
      }
    }
    return out.reverse();
  }, [log, decisions, byId, notifInfo, sunday]);

  const finished = !current || showFinal;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <div className="rounded-xl border border-amber-700 bg-amber-950/40 px-3.5 py-2.5 text-sm text-amber-200">
        <strong className="font-semibold">Démo : rien n&apos;est enregistré.</strong> Tes gestes restent dans cet onglet.{' '}
        <Link href="/demo" className="underline underline-offset-2">
          Retour aux démos
        </Link>
      </div>

      <h1 className="mt-5 text-2xl font-bold text-zinc-100">Le grand ménage</h1>
      <p className="mt-1 text-sm text-zinc-400">
        {tasks.length} tâches ouvertes en {cards.length} cartes (les séries sont regroupées), et {notifInfo.forgotCount} rappels « Oublié hier ? ».
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Choix de la variante">
        <ToggleButton pressed={variant === 'A'} onClick={() => setVariant('A')}>
          Variante A : Carte par carte
        </ToggleButton>
        <ToggleButton pressed={variant === 'B'} onClick={() => setVariant('B')}>
          Variante B : Liste à cocher
        </ToggleButton>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3 text-xs text-zinc-400">
          <span className="tabular font-mono">
            {decidedCount} cartes sur {items.length} triées ({tasksDone} tâches sur {tasks.length})
          </span>
          <button type="button" onClick={undo} disabled={!log.length} className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200 hover:border-zinc-500 disabled:opacity-40">
            Revenir en arrière (U)
          </button>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={decidedCount}>
          <div className="h-full bg-[var(--color-accent)] transition-all" style={{ width: `${items.length ? (decidedCount / items.length) * 100 : 0}%` }} />
        </div>
      </div>

      {variant === 'A' && !finished && current && (
        <section className="mt-5 rounded-xl border border-zinc-800 bg-zinc-900 p-4" aria-live="polite">
          {current.isNotifs ? (
            <NotifsCard info={notifInfo} more={moreNotifs} setMore={setMoreNotifs} onIgnore={() => decide([NOTIFS], { g: 'I' })} onKeep={() => decide([NOTIFS], { g: 'G' })} />
          ) : (
            <TaskCard
              card={byId[current.id]}
              slots={slots}
              picking={picking}
              setPicking={setPicking}
              onDecide={(decision) => decide([current.id], decision)}
            />
          )}
          <p className="mt-4 hidden text-xs text-zinc-500 sm:block">Clavier : F fait, R recaser (puis 1, 2 ou 3), A abandonner, P plus tard, G garder, U revenir en arrière.</p>
        </section>
      )}

      {variant === 'B' && !showFinal && (
        <ListVariant
          cards={cards}
          notifInfo={notifInfo}
          decisions={decisions}
          selected={selected}
          setSelected={setSelected}
          decide={decide}
          undoOne={undoOne}
        />
      )}

      {(finished || showFinal) && (
        <Recap t={t} cards={cards} notifInfo={notifInfo} decisions={decisions} onReset={reset} onBack={showFinal ? () => setShowFinal(false) : null} />
      )}

      {!finished && (
        <div className="mt-4">
          <Button onClick={() => setShowFinal(true)}>Voir le récapitulatif maintenant</Button>
        </div>
      )}

      <WritesPanel writes={writes} />
    </main>
  );
}

function TaskCard({ card, slots, picking, setPicking, onDecide }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {card.isSeries && <Badge tone="amber">{`série de ${card.tasks.length}`}</Badge>}
        {dueBadge(card)}
        <Badge>{`créée il y a ${card.age} j`}</Badge>
      </div>
      <h2 className="mt-3 text-xl font-semibold break-words text-zinc-100">{card.title}</h2>
      <dl className="mt-3 grid gap-1 text-sm text-zinc-400">
        <div>
          <dt className="inline text-zinc-500">Projet : </dt>
          <dd className="inline">{card.project ?? 'aucun'}</dd>
        </div>
        <div>
          <dt className="inline text-zinc-500">Bloc d&apos;origine : </dt>
          <dd className="inline break-words">{card.origin ?? 'aucun (tâche posée à la main)'}</dd>
        </div>
      </dl>
      {card.isSeries && (
        <ul className="mt-3 max-h-40 space-y-1 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-xs text-zinc-300">
          {card.tasks.map((x) => (
            <li key={x.id} className="flex justify-between gap-2">
              <span className="min-w-0 break-words">{x.title}</span>
              <span className={`${mutedClass} shrink-0`}>{x.due ? frDay(x.due) : 'sans date'}</span>
            </li>
          ))}
        </ul>
      )}
      {card.isSeries && <p className="mt-2 text-xs text-amber-300">Le geste choisi s&apos;applique aux {card.tasks.length} lignes de la série.</p>}

      {picking ? (
        <div className="mt-4">
          <p className="text-sm text-zinc-200">Dans quel bloc orange la recaser ?</p>
          <div className="mt-2 grid gap-2">
            {slots.map((s, i) => (
              <Button key={s.id} onClick={() => onDecide({ g: 'R', slot: s })} className="text-left">
                <span className="mr-2 font-mono text-zinc-400">{i + 1}</span>
                {s.label}
              </Button>
            ))}
            <Button onClick={() => setPicking(false)} className="text-zinc-300">
              Annuler (Échap)
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {Object.values(GESTURES).map((g) => (
            <Button
              key={g.key}
              disabled={g.key === 'R' && !slots.length}
              onClick={() => (g.key === 'R' ? setPicking(true) : onDecide({ g: g.key }))}
              className={`py-3 ${GESTURE_STYLE[g.key]}`}
              title={g.key === 'R' && !slots.length ? 'Aucun bloc orange à venir dans l’agenda' : undefined}
            >
              {g.label} <span className="font-mono text-xs opacity-70">({g.key})</span>
            </Button>
          ))}
        </div>
      )}
      <p className="mt-2 text-xs text-zinc-500">
        Abandonner : la tâche n&apos;est plus jamais affichée. Plus tard : elle sort de la liste du jour et revient dans la revue du dimanche.
      </p>
    </div>
  );
}

function NotifsCard({ info, more, setMore, onIgnore, onKeep }) {
  const shown = more ? info.groups : info.groups.slice(0, 6);
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="amber">Notifications</Badge>
        <Badge>{`${info.forgotCount} rappels « Oublié hier ? »`}</Badge>
      </div>
      <h2 className="mt-3 text-xl font-semibold text-zinc-100">{info.forgotCount} rappels sur {info.groups.length} tâches</h2>
      <p className="mt-1 text-sm text-zinc-400">La routine refabrique ces rappels chaque jour. Regroupés par tâche, voici ce qu&apos;ils disent.</p>
      <ul className="mt-3 space-y-1 rounded-lg border border-zinc-800 bg-zinc-950 p-2 text-sm text-zinc-300">
        {shown.map((g) => (
          <li key={g.key} className="break-words">
            {rappelLabel(g)}
          </li>
        ))}
      </ul>
      {info.groups.length > 6 && (
        <button type="button" onClick={() => setMore(!more)} className="mt-2 text-xs text-zinc-400 underline underline-offset-2">
          {more ? 'Réduire la liste' : `Voir les ${info.groups.length - 6} autres tâches`}
        </button>
      )}
      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Button onClick={onIgnore} className={`py-3 ${GESTURE_STYLE.I}`}>
          Tout ignorer ({info.forgotCount}) <span className="font-mono text-xs opacity-70">(I)</span>
        </Button>
        <Button onClick={onKeep} className="py-3 text-zinc-300">
          Les laisser telles quelles <span className="font-mono text-xs opacity-70">(G)</span>
        </Button>
      </div>
      {info.others.length > 0 && <p className="mt-2 text-xs text-zinc-400">{info.others.length} autres notifications (candidatures, infos) ne sont pas concernées et restent.</p>}
      <p className="mt-2 text-xs text-zinc-500">Ignorer ne coche aucune tâche : l&apos;état des tâches se règle ensuite, carte par carte.</p>
    </div>
  );
}

function ListVariant({ cards, notifInfo, decisions, selected, setSelected, decide, undoOne }) {
  const open = cards.filter((c) => !decisions[c.id]);
  const picked = open.filter((c) => selected[c.id]);
  const pickedTasks = picked.reduce((s, c) => s + c.tasks.length, 0);
  const toggle = (id) => setSelected((s) => ({ ...s, [id]: !s[id] }));
  const act = (g) => {
    decide(picked.map((c) => c.id), { g });
    setSelected({});
  };
  const selectWhere = (fn) => setSelected(Object.fromEntries(open.filter(fn).map((c) => [c.id, true])));

  return (
    <section className="mt-5 pb-24">
      {notifInfo.forgotCount > 0 && (
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3.5">
          <div className="text-sm font-semibold text-zinc-100">
            Notifications : {notifInfo.forgotCount} rappels « Oublié hier ? » sur {notifInfo.groups.length} tâches
          </div>
          {decisions[NOTIFS] ? (
            <p className="mt-2 text-sm text-zinc-400">
              {decisions[NOTIFS].g === 'I' ? 'Tout ignoré.' : 'Laissées telles quelles.'}{' '}
              <button type="button" onClick={() => undoOne(NOTIFS)} className="underline underline-offset-2">
                Annuler
              </button>
            </p>
          ) : (
            <>
              <p className="mt-1 text-xs text-zinc-400">
                Les plus répétées : {notifInfo.groups.slice(0, 3).map(rappelLabel).join(' ; ')}
              </p>
              <div className="mt-2">
                <Button onClick={() => decide([NOTIFS], { g: 'I' })} className={GESTURE_STYLE.I}>
                  Tout ignorer ({notifInfo.forgotCount})
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
        <span>Sélection rapide :</span>
        <button type="button" className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200" onClick={() => selectWhere((c) => c.late > 0)}>
          Toutes les tâches en retard
        </button>
        <button type="button" className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200" onClick={() => selectWhere((c) => c.isSeries)}>
          Toutes les séries
        </button>
        <button type="button" className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200" onClick={() => selectWhere(() => true)}>
          Tout
        </button>
        <button type="button" className="rounded-md border border-zinc-700 px-2 py-1 text-zinc-200" onClick={() => setSelected({})}>
          Aucune
        </button>
      </div>

      <ul className="divide-y divide-zinc-800 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900">
        {cards.map((c) => {
          const d = decisions[c.id];
          return (
            <li key={c.id} className={`flex items-start gap-3 px-3 py-2.5 ${d ? 'opacity-60' : ''}`}>
              <input
                type="checkbox"
                className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
                checked={Boolean(selected[c.id]) && !d}
                disabled={Boolean(d)}
                onChange={() => toggle(c.id)}
                aria-label={`Sélectionner ${c.title}`}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm break-words text-zinc-100">
                  {c.title} {c.isSeries && <Badge tone="amber">{`série de ${c.tasks.length}`}</Badge>}
                </div>
                <div className={`${mutedClass} mt-0.5 break-words`}>
                  {c.late > 0 ? `retard ${c.late} j` : c.due ? `pour le ${frDay(c.due)}` : 'sans échéance'} · {c.age} j · {c.project ?? 'sans projet'}
                  {c.origin ? ` · ${c.origin}` : ''}
                </div>
                {d && (
                  <div className="mt-1 text-xs text-zinc-300">
                    {GESTURES[d.g].label}{' '}
                    <button type="button" onClick={() => undoOne(c.id)} className="underline underline-offset-2">
                      Annuler
                    </button>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <span className="tabular mr-auto font-mono text-xs text-zinc-300">
            {picked.length} sélectionnées ({pickedTasks} tâches)
          </span>
          <Button disabled={!picked.length} onClick={() => act('F')} className={GESTURE_STYLE.F}>
            Fait
          </Button>
          <Button disabled={!picked.length} onClick={() => act('A')} className={GESTURE_STYLE.A}>
            Abandonner
          </Button>
          <Button disabled={!picked.length} onClick={() => act('P')} className={GESTURE_STYLE.P}>
            Plus tard
          </Button>
        </div>
      </div>
    </section>
  );
}

function Recap({ t, cards, notifInfo, decisions, onReset, onBack }) {
  const left = cards.filter((c) => !decisions[c.id]).length;
  const notifState = decisions[NOTIFS]?.g;
  return (
    <section className="mt-5 rounded-xl border border-emerald-800 bg-zinc-900 p-4">
      <h2 className="text-xl font-semibold text-zinc-100">Récapitulatif</h2>
      <p className="mt-2 text-base text-zinc-200">{summaryText(t)}.</p>
      <p className="mt-1 text-sm text-zinc-400">
        {notifState === 'I' ? `${notifInfo.forgotCount} rappels « Oublié hier ? » ignorés.` : notifState === 'G' ? 'Rappels laissés tels quels.' : 'Rappels pas encore traités.'}
        {left ? ` ${left} cartes restent à trier.` : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onBack && <Button onClick={onBack}>Revenir au tri</Button>}
        <Button onClick={onReset}>Tout recommencer</Button>
      </div>
    </section>
  );
}

function WritesPanel({ writes }) {
  return (
    <section className="mt-6 rounded-xl border border-zinc-800 bg-zinc-900 p-4" aria-label="Ce qui serait écrit pour de vrai">
      <h2 className="text-sm font-semibold text-zinc-100">
        Ce qui serait écrit pour de vrai <span className={mutedClass}>({writes.length})</span>
      </h2>
      {writes.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">Aucun geste pour l&apos;instant. Chaque geste ajoutera une ligne ici.</p>
      ) : (
        <ul className="mt-2 max-h-72 space-y-1 overflow-auto font-mono text-xs text-zinc-300">
          {writes.map((w, i) => (
            <li key={`${i}-${w.text}`} className="break-words">
              <span className="text-[var(--color-accent)]">{w.table}</span> : {w.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
