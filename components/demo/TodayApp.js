'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button, IconButton, ToggleButton, mutedClass } from '@/components/ui';
import { dayLabel, categoryOf } from '@/lib/home';
import {
  MAX_PINS, addDays, allDayOf, focusBlock, isCourse, organize, shortDate, timeRange,
} from './TodayLogic';

const OFFSET_MIN = -7;
const OFFSET_MAX = 30;

function TaskRow({ task, done, pinned, pinFull, onToggle, onPin, note }) {
  return (
    <li className="flex items-start gap-2 py-1">
      <label className="flex min-h-9 min-w-0 flex-1 cursor-pointer items-start gap-2.5 py-1">
        <input
          type="checkbox"
          checked={done}
          onChange={onToggle}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-accent)]"
        />
        <span className={`min-w-0 text-sm break-words ${done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}>
          {task.title}
          {note && <span className="ml-2 font-mono text-[11px] text-[var(--color-accent)]">{note}</span>}
        </span>
      </label>
      <Button
        className="shrink-0 px-2 py-1 text-xs"
        aria-pressed={pinned}
        disabled={!pinned && pinFull}
        onClick={onPin}
      >
        {pinned ? 'Retirer des priorités' : 'Épingler'}
      </Button>
    </li>
  );
}

export default function TodayApp({ tasks, events, categories, today, nowMs }) {
  const [variant, setVariant] = useState('A');
  const [offset, setOffset] = useState(0);
  const [state, setState] = useState({ done: {}, placed: {}, dropped: {} });
  const [pins, setPins] = useState({});
  const [log, setLog] = useState([]);
  const [openRecaser, setOpenRecaser] = useState(false);
  const [openLater, setOpenLater] = useState(false);
  const [focusPick, setFocusPick] = useState({});

  const day = addDays(today, offset);
  const eventTitle = new Map(events.map((e) => [e.id, e]));
  const addLog = (text) => setLog((l) => [{ id: l.length + 1, text }, ...l]);
  const eventLabel = (e) => `bloc "${e.title}" du ${shortDate(e.starts_at.slice(0, 10) === day ? day : new Date(e.starts_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }))}`;

  const view = organize({ tasks, events, categories, day, today, nowMs, state });
  const dayTasks = [...view.perBlock.values()].flat().concat(view.loose);
  const dayPins = (pins[day] ?? []).filter((id) => dayTasks.some((t) => t.id === id));
  const pinFull = dayPins.length >= MAX_PINS;
  const allDay = allDayOf(events, day);

  const toggle = (t) => {
    const next = !view.isDone(t);
    setState((s) => ({ ...s, done: { ...s.done, [t.id]: next } }));
    addLog(next ? `tasks : marquer fait "${t.title}" (done_at = maintenant)` : `tasks : remettre à faire "${t.title}" (done_at = null)`);
  };
  const pin = (t) => {
    const on = dayPins.includes(t.id);
    setPins((p) => ({ ...p, [day]: on ? dayPins.filter((id) => id !== t.id) : [...dayPins, t.id] }));
    addLog(
      on
        ? `tasks : retirer "${t.title}" des priorités du ${shortDate(day)} (priority_day = null)`
        : `tasks : épingler "${t.title}" comme priorité du ${shortDate(day)} (priority_day = ${day})`,
    );
  };
  const place = (item) => {
    const { task, suggestion } = item;
    const e = suggestion.event;
    setState((s) => ({ ...s, placed: { ...s.placed, [task.id]: e.id } }));
    addLog(`tasks : rattacher "${task.title}" au ${eventLabel(e)} (event_id = ${e.id})`);
    addLog(`calendar_events : poser dans le ${eventLabel(e)} (ligne ajoutée à la description Google Agenda)`);
  };
  const drop = (t) => {
    setState((s) => ({ ...s, dropped: { ...s.dropped, [t.id]: true } }));
    addLog(`tasks : abandonner "${t.title}" (status = dropped, sort de toutes les listes)`);
  };
  const reset = () => {
    setState({ done: {}, placed: {}, dropped: {} });
    setPins({});
    setLog([]);
    setFocusPick({});
  };

  const rowProps = (t, note) => ({
    task: t,
    done: view.isDone(t),
    pinned: dayPins.includes(t.id),
    pinFull,
    onToggle: () => toggle(t),
    onPin: () => pin(t),
    note: note ?? (state.placed[t.id] ? 'recasée' : undefined),
  });

  const counter = (list) => {
    const n = list.filter((t) => view.isDone(t)).length;
    return list.length ? `${n} sur ${list.length} faites` : 'aucune tâche';
  };

  function blockHeader({ b, list, big }) {
    const cat = categoryOf(categories, b.color_id);
    return (
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="tabular font-mono text-[11px] text-zinc-400">{timeRange(b)}</span>
        <h3 className={`min-w-0 flex-1 font-semibold break-words text-zinc-100 ${big ? 'text-lg' : 'text-sm'}`}>{b.title}</h3>
        <span className="font-mono text-[11px] text-zinc-400">{cat.name}</span>
        <span className="tabular font-mono text-[11px] font-semibold text-[var(--color-accent)]">{counter(list)}</span>
      </div>
    );
  }

  function blockCard({ b, big }) {
    const cat = categoryOf(categories, b.color_id);
    const list = view.perBlock.get(b.id) ?? [];
    return (
      <section
        className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
        style={{ borderLeftWidth: 4, borderLeftColor: cat.color }}
      >
        {blockHeader({ b, list, big })}
        {b.location && <p className="mt-0.5 text-xs text-zinc-400">{b.location}</p>}
        {list.length ? (
          <ul className="mt-2 divide-y divide-zinc-800/60">
            {list.map((t) => <TaskRow key={t.id} {...rowProps(t)} />)}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-500">Aucune tâche liée à ce bloc.</p>
        )}
      </section>
    );
  }

  function courseLine({ b }) {
    const cat = categoryOf(categories, b.color_id);
    return (
      <div
        className="flex flex-wrap items-baseline gap-x-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5"
        style={{ borderLeftWidth: 4, borderLeftColor: cat.color }}
      >
        <span className="tabular font-mono text-[11px] text-zinc-400">{timeRange(b)}</span>
        <span className="min-w-0 flex-1 text-sm break-words text-zinc-300">{b.title}</span>
        <span className="font-mono text-[11px] text-zinc-500">{cat.name}</span>
      </div>
    );
  }

  const nonCourse = view.blocks.filter((b) => !isCourse(b));
  const focus = focusBlock(view.blocks, categories, day, today, nowMs);
  const picked = focusPick[day] ? view.blocks.find((b) => b.id === focusPick[day]) : null;
  const big = picked ?? focus;

  return (
    <main className="mx-auto min-w-0 max-w-3xl px-4 py-5 sm:px-6">
      <div className="rounded-lg border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
        <strong className="font-semibold">Démo : rien n&apos;est enregistré.</strong>{' '}
        Tout reste dans cet onglet.{' '}
        <Link href="/demo" className="underline underline-offset-2">Retour aux démos</Link>
      </div>

      <h1 className="mt-4 text-xl font-bold tracking-tight text-zinc-100">Ma journée, l&apos;agenda d&apos;abord</h1>

      <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Choix de la variante">
        <ToggleButton pressed={variant === 'A'} onClick={() => setVariant('A')}>Variante A : Blocs</ToggleButton>
        <ToggleButton pressed={variant === 'B'} onClick={() => setVariant('B')}>Variante B : Focus</ToggleButton>
        <Button className="ml-auto" onClick={reset} disabled={!log.length}>Remettre la démo à zéro</Button>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <IconButton label="Jour précédent" disabled={offset <= OFFSET_MIN} onClick={() => setOffset(offset - 1)}>
          Précédent
        </IconButton>
        <div className="min-w-0 flex-1 text-center">
          <div className="text-base font-semibold text-zinc-100 capitalize">{dayLabel(day, today)}</div>
          <div className={mutedClass}>{day}</div>
        </div>
        <IconButton label="Jour suivant" disabled={offset >= OFFSET_MAX} onClick={() => setOffset(offset + 1)}>
          Suivant
        </IconButton>
      </div>
      {offset !== 0 && (
        <div className="mt-2 text-center">
          <Button className="px-2 py-1 text-xs" onClick={() => setOffset(0)}>Revenir à aujourd&apos;hui</Button>
        </div>
      )}

      {allDay.length > 0 && (
        <p className="mt-3 text-xs text-zinc-400">Toute la journée : {allDay.map((e) => e.title).join(', ')}</p>
      )}

      <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3" data-testid="priorities">
        <h2 className="text-sm font-semibold text-zinc-100">
          3 priorités du jour <span className={`${mutedClass} ml-1`}>{dayPins.length} sur {MAX_PINS}</span>
        </h2>
        {dayPins.length ? (
          <ul className="mt-1 divide-y divide-zinc-800/60">
            {dayPins.map((id) => {
              const t = dayTasks.find((x) => x.id === id);
              return <TaskRow key={id} {...rowProps(t)} />;
            })}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">Aucune priorité choisie. Utilise « Épingler » sur une tâche du jour.</p>
        )}
        {pinFull && <p className="mt-1 text-xs text-amber-300">Les 3 places sont prises : retire une priorité pour en épingler une autre.</p>}
      </section>

      <div className="mt-4 grid gap-3">
        {variant === 'A' && view.blocks.map((b) => (isCourse(b) ? <div key={b.id}>{courseLine({ b })}</div> : <div key={b.id}>{blockCard({ b })}</div>))}

        {variant === 'B' && (
          <>
            {big ? (
              <div>
                <p className="mb-1 font-mono text-[11px] tracking-[0.1em] text-zinc-400 uppercase">
                  {day === today && !picked && Date.parse(big.starts_at) <= nowMs && nowMs < Date.parse(big.ends_at ?? big.starts_at) ? 'Bloc en cours' : picked ? 'Bloc choisi' : 'Prochain bloc'}
                </p>
                {blockCard({ b: big, big: true })}
              </div>
            ) : (
              <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">Aucun bloc ce jour-là.</p>
            )}
            {view.blocks.some((b) => b.id !== big?.id) && (
              <div>
                <p className="mb-1 font-mono text-[11px] tracking-[0.1em] text-zinc-400 uppercase">Le reste de la journée</p>
                <ul className="grid gap-1.5">
                  {view.blocks.filter((b) => b.id !== big?.id).map((b) =>
                    isCourse(b) ? (
                      <li key={b.id}>{courseLine({ b })}</li>
                    ) : (
                      <li key={b.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5">
                        <span className="tabular font-mono text-[11px] text-zinc-400">{timeRange(b)}</span>
                        <span className="min-w-0 flex-1 text-sm break-words text-zinc-300">{b.title}</span>
                        <span className="tabular font-mono text-[11px] text-zinc-400">{counter(view.perBlock.get(b.id) ?? [])}</span>
                        <Button className="px-2 py-1 text-xs" onClick={() => setFocusPick((f) => ({ ...f, [day]: b.id }))}>
                          Mettre ce bloc en grand
                        </Button>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            )}
          </>
        )}

        {!view.blocks.length && variant === 'A' && (
          <p className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400">Aucun bloc ce jour-là.</p>
        )}

        {view.loose.length > 0 && (
          <section className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <h3 className="text-sm font-semibold text-zinc-100">Prévu ce jour, sans bloc</h3>
            <ul className="mt-1 divide-y divide-zinc-800/60">
              {view.loose.map((t) => <TaskRow key={t.id} {...rowProps(t)} />)}
            </ul>
          </section>
        )}
      </div>

      <section className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900" data-testid="recaser">
        <button
          type="button"
          aria-expanded={openRecaser}
          onClick={() => setOpenRecaser(!openRecaser)}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm font-semibold text-zinc-100"
        >
          <span>À recaser ({view.recaser.length})</span>
          <span className={mutedClass}>{openRecaser ? 'Replier' : 'Déplier'}</span>
        </button>
        {openRecaser && (
          <ul className="divide-y divide-zinc-800 border-t border-zinc-800 px-4">
            {view.recaser.length === 0 && <li className="py-3 text-sm text-zinc-500">Rien à recaser.</li>}
            {view.recaser.map((item) => (
              <li key={item.task.id} className="py-3">
                <p className="text-sm break-words text-zinc-100">{item.task.title}</p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  {item.task.due_date ? `prévue le ${shortDate(item.task.due_date)}` : 'sans date'}
                  {item.origin ? `, bloc d'origine : ${item.origin.title}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.suggestion ? (
                    <Button className="text-left text-xs" onClick={() => place(item)}>
                      Mettre dans le prochain bloc {item.suggestion.shared ? `« ${item.suggestion.event.title} »` : `orange « ${item.suggestion.event.title} »`}
                      {' '}({shortDate(new Date(item.suggestion.event.starts_at).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }))})
                    </Button>
                  ) : (
                    <span className="text-xs text-zinc-500">Aucun bloc orange à venir.</span>
                  )}
                  <Button className="text-xs" onClick={() => drop(item.task)}>Abandonner</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900" data-testid="later">
        <button
          type="button"
          aria-expanded={openLater}
          onClick={() => setOpenLater(!openLater)}
          className="flex min-h-11 w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm font-semibold text-zinc-100"
        >
          <span>Plus tard : {view.later.length} tâches</span>
          <span className={mutedClass}>{openLater ? 'Replier' : 'Déplier'}</span>
        </button>
        {openLater && (
          <ul className="divide-y divide-zinc-800/60 border-t border-zinc-800 px-4 py-1">
            {view.later.map((t) => (
              <li key={t.id} className="py-1.5 text-sm break-words text-zinc-300">
                {t.title}
                {t.due_date && <span className="ml-2 font-mono text-[11px] text-zinc-500">{shortDate(t.due_date)}</span>}
                {t.event_id && eventTitle.get(t.event_id) && (
                  <span className="ml-2 font-mono text-[11px] text-zinc-500">bloc : {eventTitle.get(t.event_id).title}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3" data-testid="writes">
        <h2 className="text-sm font-semibold text-zinc-100">
          Ce qui serait écrit pour de vrai <span className={`${mutedClass} ml-1`}>{log.length}</span>
        </h2>
        {log.length ? (
          <ol className="mt-2 grid gap-1">
            {log.map((l) => (
              <li key={l.id} className="font-mono text-xs break-words text-zinc-300">
                {l.id}. {l.text}
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-1 text-sm text-zinc-500">Coche une tâche, épingle une priorité ou recase une tâche : chaque geste apparaît ici.</p>
        )}
      </section>
    </main>
  );
}
