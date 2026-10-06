'use client';

import { useEffect, useMemo, useState } from 'react';
import { MAX_PINS, addDays, allDayOf, dayOf, isCourse, organize, timeRange } from '@/components/demo/TodayLogic';
import { classify } from '@/components/demo/DeadlinesLogic';
import { cleanBlockTitle } from '@/components/demo/TriageLogic';
import { categoryOf, formatMailDate, latestMails, timeParis } from '@/lib/home';
import {
  blockStatus, briefPieces, clockParis, doneOnDay, dueNote, hourParis, markerFor, nextDayWord, plural, relativeDay, titleOfDay,
} from './logic';
import { Check, FOCUS, Fold, Head, IconChevron, IconCheck, LinkButton, PinButton, TaskRow } from './parts';

const OFFSET_MAX = 30;
const dm = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const catColor = (b, categories) =>
  isCourse(b) ? 'var(--cat-cours)' : categoryOf(categories, b.color_id).kind === 'tache' ? 'var(--cat-tache)' : 'var(--cat-autre)';
const catName = (b, categories) => (isCourse(b) ? 'Cours' : categoryOf(categories, b.color_id).kind === 'tache' ? 'Travail' : 'Autre');

// Le Journal du jour : une colonne qui se lit comme le déroulé de la journée.
// Brief, trois priorités, la journée bloc par bloc avec « maintenant », bilan du soir, puis le reste replié.
export default function OrgJournalHome({ data, log, onNavigate }) {
  const { today, categories } = data;
  const baseNow = useMemo(() => Date.parse(data.nowIso), [data.nowIso]);
  const [now, setNow] = useState(baseNow);
  const [offset, setOffset] = useState(0);
  const [doneDay, setDoneDay] = useState({}); // id -> jour où la tâche a été cochée
  const [movedTo, setMovedTo] = useState({}); // id -> jour d'où elle a été recasée au lendemain
  const [placed, setPlaced] = useState({}); // id -> id du bloc proposé
  const [pinsByDay, setPinsByDay] = useState({});
  const [stay, setStay] = useState({}); // ids que le bilan laisse sur place
  const [open, setOpen] = useState({});
  const [allBacklog, setAllBacklog] = useState(false);
  const [ideasDone, setIdeasDone] = useState({});

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const day = addDays(today, offset);
  const titleById = useMemo(() => new Map(data.tasks.map((t) => [t.id, t.title])), [data.tasks]);

  const plan = useMemo(
    () =>
      organize({
        tasks: data.tasks,
        events: data.events,
        categories,
        day,
        today,
        nowMs: baseNow,
        state: { done: Object.fromEntries(Object.keys(doneDay).map((k) => [k, true])), placed, dropped: movedTo },
      }),
    [data.tasks, data.events, categories, day, today, baseNow, doneDay, placed, movedTo]
  );

  // Tâches de la journée, dans l'ordre des blocs puis les tâches sans horaire ; et le bloc de chacune.
  const { dayTasks, blockOf } = useMemo(() => {
    const seen = new Set();
    const list = [];
    const owner = new Map();
    for (const b of plan.blocks) {
      for (const t of plan.perBlock.get(b.id) ?? []) {
        if (seen.has(t.id)) continue;
        seen.add(t.id);
        list.push(t);
        owner.set(t.id, b);
      }
    }
    for (const t of plan.loose) if (!seen.has(t.id)) list.push(t);
    return { dayTasks: list, blockOf: owner };
  }, [plan]);

  const deadlines = useMemo(
    () => classify({ tasks: data.tasks, events: data.events, today: day }).deadlines,
    [data.tasks, data.events, day]
  );

  const liveById = useMemo(() => new Map(data.tasks.filter((t) => !movedTo[t.id]).map((t) => [t.id, t])), [data.tasks, movedTo]);
  const stored = pinsByDay[day];
  const pinned = (stored ?? dayTasks.filter((t) => !plan.isDone(t)).slice(0, MAX_PINS).map((t) => t.id))
    .map((id) => liveById.get(id))
    .filter(Boolean);
  const pinIds = pinned.map((t) => t.id);

  const toggleDone = (t) => {
    const next = !plan.isDone(t);
    setDoneDay((d) => {
      const copy = { ...d };
      if (next) copy[t.id] = day;
      else delete copy[t.id];
      return copy;
    });
    log(`tasks : ${next ? 'marquer fait' : 'rouvrir'} "${t.title}"`);
  };
  const togglePin = (t) => {
    const has = pinIds.includes(t.id);
    if (!has && pinIds.length >= MAX_PINS) return;
    setPinsByDay((p) => ({ ...p, [day]: has ? pinIds.filter((id) => id !== t.id) : [...pinIds, t.id] }));
    log(`tasks : ${has ? 'retirer des priorités du jour' : 'épingler comme priorité du jour'} "${t.title}"`);
  };

  const remaining = dayTasks.filter((t) => !plan.isDone(t));
  const selected = remaining.filter((t) => !stay[t.id]);
  const doneList = doneOnDay(data.done, day, doneDay, titleById);
  const movedHere = Object.entries(movedTo).filter(([, d]) => d === day).map(([id]) => id);
  const nextIso = addDays(day, 1);
  const recase = () => {
    for (const t of selected) log(`tasks : recaser au ${dm(nextIso)} "${t.title}"`);
    setMovedTo((m) => ({ ...m, ...Object.fromEntries(selected.map((t) => [t.id, day])) }));
  };
  const undoRecase = () => {
    log(`tasks : annuler le recasage de ${plural(movedHere.length, 'tâche')}`);
    setMovedTo((m) => Object.fromEntries(Object.entries(m).filter(([, d]) => d !== day)));
  };

  const marker = markerFor(plan.blocks, day, today, now);
  const allDay = allDayOf(data.events, day);
  const unread = data.mails.filter((m) => m.unread !== false).length;
  const pieces = briefPieces({ blockCount: plan.blocks.length, deadlines, unread, backlog: plan.recaser.length });
  const isMorning = day === today && hourParis(now) < 12;
  const evening = day === today && hourParis(now) < 18;
  const toggleFold = (k) => setOpen((o) => ({ ...o, [k]: !o[k] }));

  const rowProps = (t) => ({
    task: t,
    done: plan.isDone(t),
    onToggle: () => toggleDone(t),
    pinned: pinIds.includes(t.id),
    canPin: pinIds.length < MAX_PINS,
    onPin: () => togglePin(t),
    note: dueNote(t, day, today),
  });

  const backlog = allBacklog ? plan.recaser : plan.recaser.slice(0, 6);
  const mails = latestMails(data.mails, 'all', 6);

  return (
    <div className="mx-auto w-full max-w-[40rem] px-4 pt-2 pb-28 text-[var(--text)] sm:px-2">
      <header className="pt-6 pb-8">
        <p className="text-[11px] tracking-[0.16em] text-[var(--text-muted)] uppercase [font-family:var(--font-mono)]">Le journal du jour</p>
        <h1 className="mt-3 text-[1.9rem] leading-[1.05] font-semibold tracking-[-0.01em] first-letter:uppercase sm:text-[2.4rem] [font-family:var(--font-display)]">
          {titleOfDay(day)}
        </h1>
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[13px] text-[var(--text-muted)]">{relativeDay(day, today)}</p>
          <div role="group" aria-label="Changer de jour" className="flex items-center gap-1.5">
            {offset !== 0 && (
              <button
                type="button"
                onClick={() => setOffset(0)}
                className={`min-h-11 rounded-[var(--radius-sm)] px-3 text-[13px] text-[var(--accent)] underline underline-offset-2 ${FOCUS}`}
              >
                Revenir à aujourd&apos;hui
              </button>
            )}
            <DayButton dir="left" label="Jour précédent" disabled={offset <= -OFFSET_MAX} onClick={() => setOffset((o) => o - 1)} />
            <DayButton dir="right" label="Jour suivant" disabled={offset >= OFFSET_MAX} onClick={() => setOffset((o) => o + 1)} />
          </div>
        </div>
      </header>

      {/* 01 Brief */}
      <section aria-labelledby="j-brief" className="mb-12">
        <Head n="01" id="j-brief" title={isMorning ? 'Brief du matin' : 'Brief du jour'} />
        <p className="border-l-2 border-[var(--accent)] pl-4 text-[1.2rem] leading-[1.45] sm:text-[1.4rem] [font-family:var(--font-display)]">
          {pieces.map((p, i) => (
            <span key={p.text}>
              <strong className="font-semibold text-[var(--accent)]">{p.n}</strong>
              {p.text}
              {i < pieces.length - 1 ? ', ' : '.'}
            </span>
          ))}
        </p>
      </section>

      {/* 02 Priorités */}
      <section aria-labelledby="j-prio" className="mb-12">
        <Head n="02" id="j-prio" title="Les trois priorités" hint={`${pinned.length} sur ${MAX_PINS}`} />
        <ol className="grid gap-2">
          {Array.from({ length: MAX_PINS }, (_, i) => {
            const t = pinned[i];
            if (!t) {
              return (
                <li
                  key={`vide-${i}`}
                  className="flex min-h-14 items-center gap-3 rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] px-3 text-[13px] text-[var(--text-muted)]"
                >
                  <span className="w-6 text-center text-[1.4rem] leading-none text-[var(--text-faint)] [font-family:var(--font-display)]">{i + 1}</span>
                  Place libre
                </li>
              );
            }
            const b = blockOf.get(t.id);
            const note = dueNote(t, day, today);
            const done = plan.isDone(t);
            return (
              <li
                key={t.id}
                className="flex items-start gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow)]"
              >
                <span className="w-6 text-center text-[1.6rem] leading-none text-[var(--accent)] [font-family:var(--font-display)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <span className={`block text-[15px] leading-snug font-medium [overflow-wrap:anywhere] ${done ? 'text-[var(--text-faint)] line-through' : ''}`}>
                    {t.title}
                  </span>
                  <span className={`mt-0.5 block text-[12px] ${note?.late && !done ? 'text-[var(--warning)]' : 'text-[var(--text-muted)]'}`}>
                    {b ? `${timeRange(b)}, ${cleanBlockTitle(b.title)}` : (note?.text ?? 'Sans bloc')}
                  </span>
                </div>
                <Check checked={done} onChange={() => toggleDone(t)} label={`${done ? 'Rouvrir' : 'Marquer fait'} : ${t.title}`} />
                <span className="flex">
                  <PinButton pinned canPin onClick={() => togglePin(t)} title={t.title} />
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-2 text-[12px] text-[var(--text-muted)]">
          Épingle une tâche depuis la journée ci-dessous. Trois au maximum : le reste attend.
        </p>
      </section>

      {/* 03 La journée */}
      <section aria-labelledby="j-day" className="mb-12">
        <Head n="03" id="j-day" title="La journée" hint={plural(plan.blocks.length, 'bloc')} />
        {allDay.length > 0 && (
          <ul className="mb-4 flex flex-wrap gap-2" aria-label="Toute la journée">
            {allDay.map((e) => (
              <li key={e.id} className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-[12px] text-[var(--text-muted)]">
                Toute la journée : {e.title}
              </li>
            ))}
          </ul>
        )}
        {plan.blocks.length === 0 && plan.loose.length === 0 && !marker && (
          <p className="rounded-[var(--radius)] border border-dashed border-[var(--border-strong)] p-4 text-[14px] text-[var(--text-muted)]">
            Aucun bloc ce jour-là. Une page blanche, pas une erreur.
          </p>
        )}
        <ol>
          {plan.blocks.map((b, i) => (
            <li key={b.id} className="contents">
              {marker && marker.index === i && <NowRow now={now} />}
              <BlockItem
                b={b}
                status={blockStatus(b, day, today, now)}
                categories={categories}
                tasks={plan.perBlock.get(b.id) ?? []}
                marker={marker?.insideId === b.id ? marker : null}
                now={now}
                rowProps={rowProps}
              />
            </li>
          ))}
          {marker && marker.index === plan.blocks.length && <NowRow now={now} />}
          {plan.loose.length > 0 && (
            <li className="grid grid-cols-[3.1rem_1fr] gap-x-3 sm:grid-cols-[3.5rem_1fr]">
              <div className="pt-3 text-right text-[11px] text-[var(--text-faint)] [font-family:var(--font-mono)]">sans heure</div>
              <div className="relative border-l border-dashed border-[var(--border-strong)] pb-2 pl-4">
                <span className="absolute top-4 -left-[5px] size-[9px] rounded-full border border-[var(--border-strong)] bg-[var(--bg)]" aria-hidden="true" />
                <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] p-3">
                  <h3 className="text-[14px] font-semibold">Dans la journée</h3>
                  <ul className="mt-1">
                    {plan.loose.map((t) => (
                      <TaskRow key={t.id} {...rowProps(t)} />
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          )}
        </ol>
      </section>

      {/* 04 Bilan du soir */}
      <section aria-labelledby="j-bilan" className="mb-12">
        <Head n="04" id="j-bilan" title="Bilan du soir" hint={evening ? 'se remplit au fil de la journée' : undefined} />
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="flex items-baseline gap-2">
              <span className="text-[2.2rem] leading-none font-semibold text-[var(--success)] [font-family:var(--font-display)]">{doneList.length}</span>
              <span className="text-[13px] text-[var(--text-muted)]">{doneList.length > 1 ? 'faites' : 'faite'} {day === today ? "aujourd'hui" : 'ce jour-là'}</span>
            </p>
            {doneList.length === 0 ? (
              <p className="mt-2 text-[13px] text-[var(--text-muted)]">Rien de coché pour l&apos;instant.</p>
            ) : (
              <ul className="mt-2 grid gap-1">
                {doneList.slice(0, 5).map((t) => (
                  <li key={t.id} className="flex items-start gap-2 text-[13px] text-[var(--text-muted)]">
                    <IconCheck className="mt-0.5 size-3.5 shrink-0 text-[var(--success)]" />
                    <span className="[overflow-wrap:anywhere]">{t.title}</span>
                  </li>
                ))}
                {doneList.length > 5 && <li className="text-[12px] text-[var(--text-faint)]">et {doneList.length - 5} autres</li>}
              </ul>
            )}
          </div>
          <div>
            <p className="flex items-baseline gap-2">
              <span className="text-[2.2rem] leading-none font-semibold [font-family:var(--font-display)]">{remaining.length}</span>
              <span className="text-[13px] text-[var(--text-muted)]">{remaining.length > 1 ? 'restent' : 'reste'}</span>
            </p>
            {remaining.length > 0 && (
              <ul className="mt-2 grid gap-1">
                {remaining.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-[13px]">
                    <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{t.title}</span>
                    <button
                      type="button"
                      aria-pressed={!stay[t.id]}
                      onClick={() => setStay((s) => ({ ...s, [t.id]: !s[t.id] }))}
                      className={`min-h-9 shrink-0 rounded-full border px-3 text-[12px] ${FOCUS} ${
                        stay[t.id]
                          ? 'border-[var(--border-strong)] text-[var(--text-muted)]'
                          : 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                      }`}
                    >
                      {stay[t.id] ? 'Laisser' : day === today ? 'Demain' : 'Lendemain'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={selected.length === 0}
            onClick={recase}
            className={`min-h-11 rounded-[var(--radius-sm)] bg-[var(--accent)] px-4 text-[14px] font-medium text-[var(--accent-contrast)] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
          >
            {day === today ? 'Recaser demain' : 'Recaser au lendemain'} ({selected.length})
          </button>
          <span className="text-[12px] text-[var(--text-muted)]">{selected.length > 0 ? `Une seule action pour ${nextDayWord(day, today)}.` : 'Rien à recaser.'}</span>
        </div>
        {movedHere.length > 0 && (
          <p className="mt-3 flex flex-wrap items-center gap-x-3 text-[13px] text-[var(--text-muted)]">
            {plural(movedHere.length, 'tâche recasée', 'tâches recasées')} pour le {dm(nextIso)}.
            <button type="button" onClick={undoRecase} className={`min-h-9 text-[var(--accent)] underline underline-offset-2 ${FOCUS}`}>
              Annuler
            </button>
          </p>
        )}
      </section>

      {/* 05 Le reste, replié */}
      <section aria-labelledby="j-reste" className="mb-6">
        <Head n="05" id="j-reste" title="Le reste, replié" />
        <div className="border-y border-[var(--border)]">
          <Fold id="recaser" title="À recaser" count={plan.recaser.length} tone="warning" open={!!open.recaser} onToggle={() => toggleFold('recaser')}>
            {plan.recaser.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">Rien en retard.</p>
            ) : (
              <ul className="grid gap-3">
                {backlog.map(({ task, origin, suggestion }) => {
                  const note = dueNote(task, day, today);
                  const ev = suggestion?.event;
                  return (
                    <li key={task.id} className="flex items-start gap-3">
                      <div className="min-w-0 flex-1">
                        <span className="block text-[14px] leading-snug [overflow-wrap:anywhere]">{task.title}</span>
                        <span className="mt-0.5 block text-[12px] text-[var(--text-muted)]">
                          {origin ? `Bloc du ${dm(dayOf(origin.starts_at))} passé` : (note?.text ?? 'Sans date')}
                          {ev ? `. Proposé : ${cleanBlockTitle(ev.title)}, le ${dm(dayOf(ev.starts_at))} à ${timeParis(ev.starts_at)}` : ''}
                        </span>
                      </div>
                      {ev && (
                        <button
                          type="button"
                          onClick={() => {
                            setPlaced((p) => ({ ...p, [task.id]: ev.id }));
                            log(`tasks : placer dans "${cleanBlockTitle(ev.title)}" "${task.title}"`);
                          }}
                          className={`min-h-9 shrink-0 rounded-full border border-[var(--accent)] px-3 text-[12px] text-[var(--accent)] ${FOCUS}`}
                        >
                          Placer
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {plan.recaser.length > 6 && (
              <LinkButton onClick={() => setAllBacklog((v) => !v)}>
                {allBacklog ? 'Réduire la liste' : `Voir les ${plan.recaser.length - 6} autres`}
              </LinkButton>
            )}
          </Fold>

          <Fold id="idees" title="Idées" count={data.ideas.length} open={!!open.idees} onToggle={() => toggleFold('idees')}>
            {data.ideas.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">Aucune idée en attente.</p>
            ) : (
              <ul className="grid gap-3">
                {data.ideas.slice(0, 5).map((n) => (
                  <li key={n.id} className="flex items-start gap-3">
                    <p className="line-clamp-2 min-w-0 flex-1 text-[14px] leading-snug [overflow-wrap:anywhere]">{n.content}</p>
                    {ideasDone[n.id] ? (
                      <span className="shrink-0 pt-2 text-[12px] text-[var(--success)]">Gardée</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIdeasDone((d) => ({ ...d, [n.id]: true }));
                          log(`brain_notes : transformer en tâche "${String(n.content).slice(0, 60)}"`);
                        }}
                        className={`min-h-9 shrink-0 rounded-full border border-[var(--accent)] px-3 text-[12px] text-[var(--accent)] ${FOCUS}`}
                      >
                        En tâche
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <LinkButton onClick={() => onNavigate('idees')}>Ouvrir les idées</LinkButton>
          </Fold>

          <Fold id="mails" title="Mails" count={`${unread} non lus`} open={!!open.mails} onToggle={() => toggleFold('mails')}>
            {mails.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">Aucun mail.</p>
            ) : (
              <ul className="grid gap-2.5">
                {mails.map((m) => (
                  <li key={m.id} className="flex items-start gap-3">
                    <span
                      className={`mt-[7px] size-2 shrink-0 rounded-full ${m.unread !== false ? 'bg-[var(--accent)]' : 'border border-[var(--border-strong)]'}`}
                      role="img"
                      aria-label={m.unread !== false ? 'Non lu' : 'Lu'}
                    />
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-[14px]">{m.subject || 'Sans objet'}</span>
                      <span className="block truncate text-[12px] text-[var(--text-muted)]">
                        {(m.sender ?? '').replace(/<.*>/, '').trim() || 'Expéditeur inconnu'} · {formatMailDate(m.received_at)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <LinkButton onClick={() => onNavigate('mails')}>Ouvrir les mails</LinkButton>
          </Fold>

          <Fold id="apps" title="Apps et projets" count={data.apps.length + data.projects.length} open={!!open.apps} onToggle={() => toggleFold('apps')}>
            {data.apps.length === 0 && data.projects.length === 0 ? (
              <p className="text-[13px] text-[var(--text-muted)]">Rien d&apos;enregistré.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {data.apps.map((a) => (
                  <li key={a.id}>
                    {/^https?:/i.test(a.url ?? '') ? (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex min-h-9 items-center rounded-full border border-[var(--border-strong)] px-3 text-[13px] ${FOCUS}`}
                      >
                        {a.name}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-9 items-center rounded-full border border-[var(--border)] px-3 text-[13px] text-[var(--text-muted)]">{a.name}</span>
                    )}
                  </li>
                ))}
                {data.projects.map((p) => (
                  <li key={p.id}>
                    <span className="inline-flex min-h-9 items-center rounded-full bg-[var(--surface-2)] px-3 text-[13px] text-[var(--text-muted)]">{p.name}</span>
                  </li>
                ))}
              </ul>
            )}
            <LinkButton onClick={() => onNavigate('apps')}>Ouvrir apps et projets</LinkButton>
          </Fold>
        </div>
      </section>
    </div>
  );
}

function DayButton({ dir, label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`grid size-11 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:border-[var(--border-strong)] disabled:opacity-35 ${FOCUS}`}
    >
      <IconChevron dir={dir} className="size-5" />
    </button>
  );
}

// Repère « maintenant » entre deux blocs.
function NowRow({ now }) {
  return (
    <div className="grid grid-cols-[3.1rem_1fr] gap-x-3 sm:grid-cols-[3.5rem_1fr]" role="separator" aria-label={`Maintenant, ${clockParis(now)}`}>
      <div className="text-right text-[12px] leading-none font-semibold text-[var(--accent)] [font-family:var(--font-mono)]">{clockParis(now)}</div>
      <div className="relative border-l border-[var(--accent)] pb-4 pl-4">
        <span className="absolute top-0 -left-[6px] size-[11px] rounded-full bg-[var(--accent)] ring-4 ring-[var(--accent-soft)]" aria-hidden="true" />
        <div className="flex items-center gap-2 leading-none">
          <span className="text-[11px] font-semibold tracking-[0.14em] text-[var(--accent)] uppercase">Maintenant</span>
          <span className="h-px flex-1 bg-[var(--accent)]" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

// Un bloc de la journée sur la ligne du temps : heure à gauche, point de catégorie, carte avec ses tâches.
function BlockItem({ b, status, categories, tasks, marker, now, rowProps }) {
  const current = status === 'current';
  const past = status === 'past';
  const place = b.location ? `, ${b.location}` : '';
  return (
    <div className="grid grid-cols-[3.1rem_1fr] gap-x-3 sm:grid-cols-[3.5rem_1fr]">
      <div className={`pt-3.5 text-right text-[12px] leading-tight [font-family:var(--font-mono)] ${current ? 'font-semibold text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
        {timeParis(b.starts_at)}
        <span className="block text-[11px] text-[var(--text-faint)]">{timeRange(b).split(' - ')[1]}</span>
      </div>
      <div className="relative border-l border-[var(--border-strong)] pb-4 pl-4">
        <span
          className="absolute top-[18px] -left-[5px] size-[9px] rounded-full ring-2 ring-[var(--bg)]"
          style={{ background: catColor(b, categories) }}
          aria-hidden="true"
        />
        <div
          className={`rounded-[var(--radius)] border p-3 ${
            current ? 'border-[var(--accent)] bg-[var(--accent-soft)] shadow-[var(--shadow)]' : 'border-[var(--border)] bg-[var(--surface)]'
          } ${past ? 'opacity-70' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 text-[15px] leading-snug font-semibold [overflow-wrap:anywhere]">{cleanBlockTitle(b.title)}</h3>
            {current && (
              <span className="shrink-0 rounded-full bg-[var(--accent)] px-2 py-0.5 text-[11px] font-medium text-[var(--accent-contrast)]">En cours</span>
            )}
          </div>
          <p className="mt-0.5 text-[12px] text-[var(--text-muted)] [overflow-wrap:anywhere]">
            {catName(b, categories)}
            {place}
          </p>
          {marker && (
            <div className="mt-2">
              <div className="h-1 overflow-hidden rounded-full bg-[var(--surface-2)]" role="progressbar" aria-label="Avancement du bloc" aria-valuemin={0} aria-valuemax={100} aria-valuenow={marker.pct}>
                <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${marker.pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] font-medium text-[var(--accent)]">
                Maintenant, {clockParis(now)} ({marker.pct} % du bloc)
              </p>
            </div>
          )}
          {tasks.length > 0 ? (
            <ul className="mt-2 border-t border-[var(--border)] pt-1.5">
              {tasks.map((t) => (
                <TaskRow key={t.id} {...rowProps(t)} />
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[12px] text-[var(--text-faint)]">Aucune tâche liée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
