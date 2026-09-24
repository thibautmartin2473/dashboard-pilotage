'use client';

import { useRef, useState } from 'react';
import { LinkedIdeas } from './IdeasPanel';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, SyncFooter, mutedClass, useAction } from './ui';
import { completeTask } from '@/app/actions';
import { deleteEvent, moveEvent, saveEvent } from '@/app/edit-actions';
import { buildWeek, describeWhen, eventColor, eventForm, shiftEvent, snapMinutes, timeParis } from '@/lib/home';

const HOUR_PX = 44; // hauteur d'une heure dans la grille
const DAY_MIN_REM = 6.5; // largeur minimale d'une colonne (défilement horizontal sur téléphone)
const GUTTER_REM = 3;
const DRAG_PX = 5; // en deçà, un appui reste un clic (ouvre le détail)

// Code couleur de l'agenda (voir lib/home.js, eventColor) : rouge Tomate = cours EDHEC, bleu
// Myrtille = autres événements, orange Mandarine = tâches/blocs de travail.
const CATEGORY_CLASS = {
  edhec: 'border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950',
  task: 'border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950',
  other: 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950',
};
const LEGEND = [
  { key: 'edhec', dot: 'bg-red-400', label: 'Cours EDHEC' },
  { key: 'other', dot: 'bg-blue-400', label: 'Autres événements' },
  { key: 'task', dot: 'bg-amber-400', label: 'Tâches / travail' },
];

const findEvent = (week, id) => {
  for (const d of week.days) for (const e of [...d.allDay, ...d.blocks]) if (e.id === id) return e;
  return null;
};

// Idées (status new) et tâches non faites rattachées à un événement (brain_notes.event_id,
// tasks.event_id) : survolé sur le bloc, listé dans le détail.
const linkedOf = (eventId, ideas, tasks) => ({
  ideas: (ideas ?? []).filter((n) => n.event_id === eventId),
  tasks: (tasks ?? []).filter((t) => t.event_id === eventId),
});

function EventForm({ initial, today, onDone }) {
  const { pending, error, run } = useAction();
  const [form, setForm] = useState(
    initial ?? { title: '', all_day: false, location: '', start: `${today}T09:00`, end: `${today}T10:00` }
  );
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleAllDay = (all_day) =>
    set({
      all_day,
      start: all_day ? form.start.slice(0, 10) : `${form.start.slice(0, 10)}T09:00`,
      end: all_day ? form.end.slice(0, 10) : `${form.end.slice(0, 10) || form.start.slice(0, 10)}T10:00`,
    });

  const submit = (e) => {
    e.preventDefault();
    run(async () => {
      const result = await saveEvent({ id: initial?.id, ...form });
      if (!result.error) onDone();
      return result;
    });
  };

  const type = form.all_day ? 'date' : 'datetime-local';
  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <Field
        value={form.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="Titre"
        aria-label="Titre"
        maxLength={200}
        required
        className="w-full"
      />
      <div className="flex flex-wrap gap-2">
        <label className={`flex flex-col ${mutedClass}`}>
          Début
          <Field type={type} value={form.start} onChange={(e) => set({ start: e.target.value })} required />
        </label>
        <label className={`flex flex-col ${mutedClass}`}>
          {form.all_day ? 'Dernier jour' : 'Fin'}
          <Field type={type} value={form.end} onChange={(e) => set({ end: e.target.value })} />
        </label>
      </div>
      <Field
        value={form.location}
        onChange={(e) => set({ location: e.target.value })}
        placeholder="Lieu"
        aria-label="Lieu"
        maxLength={200}
        className="w-full"
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={form.all_day} onChange={(e) => toggleAllDay(e.target.checked)} className="h-4 w-4" />
        Toute la journée
      </label>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter'}
        </Button>
        <Button disabled={pending} onClick={onDone}>
          Annuler
        </Button>
      </div>
      <ErrorLine error={error} />
    </form>
  );
}

// Case à cocher « fait » sur une tâche placée dans la plage (comme ActionsPanel, completeTask).
function PlacedTask({ task }) {
  const { pending, run } = useAction();
  return (
    <li className={`flex items-center gap-1.5 ${pending ? 'opacity-50' : ''}`}>
      <input
        type="checkbox"
        checked={pending}
        disabled={pending}
        onChange={() => run(() => completeTask(task.id))}
        aria-label={`Terminer : ${task.title}`}
        className="h-4 w-4 shrink-0"
      />
      <span className="break-words">{task.title}</span>
    </li>
  );
}

// Flèches ▲▼ du détail (téléphone, clavier) : début ou fin −/+ 15 min, même calcul que les poignées.
function Nudge({ label, event, mode, onMove, disabled }) {
  const arrow = (minutes, sign, word) => (
    <IconButton
      label={`${label} 15 min plus ${word}`}
      disabled={disabled}
      onClick={() => onMove(event, shiftEvent(event, { mode, minutes }))}
    >
      {sign}
    </IconButton>
  );
  return (
    <span className="flex items-center gap-1">
      {label}
      {arrow(-15, '▲', 'tôt')}
      {arrow(15, '▼', 'tard')}
    </span>
  );
}

function EventDetail({ event, today, onClose, ideas, tasks, onMove, moving }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const google = (event.origin ?? 'google') === 'google';
  const linked = linkedOf(event.id, ideas, tasks);

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800" data-testid="event-detail">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-medium">{event.title}</p>
          <p className={mutedClass}>{describeWhen(event)}</p>
          {event.location && <p className={`break-words ${mutedClass}`}>{event.location}</p>}
          <LinkedIdeas ideas={ideas} eventId={event.id} />
          {linked.tasks.length > 0 && (
            <ul className="mt-1 space-y-1 text-sm">
              {linked.tasks.map((t) => (
                <PlacedTask key={t.id} task={t} />
              ))}
            </ul>
          )}
          {event.conflict && <p className="text-xs font-medium text-red-600 dark:text-red-400">Conflit avec un autre événement</p>}
          {event.link && (
            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-xs underline">
              Ouvrir dans Google Agenda
            </a>
          )}
          {google && event.pending_move && (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300" data-testid="pending-move">
              ↻ à renvoyer vers Google (déplacé ici, la synchro ne l&apos;écrase pas)
            </p>
          )}
          {google && !event.pending_move && (
            <p className={mutedClass}>
              Événement Google : un déplacement est renvoyé vers Google ; « Modifier » ou une suppression peut être
              annulé par la prochaine synchro.
            </p>
          )}
        </div>
        <IconButton label="Fermer" onClick={onClose}>
          ×
        </IconButton>
      </div>
      {editing ? (
        <EventForm initial={{ id: event.id, ...eventForm(event) }} today={today} onDone={() => setEditing(false)} />
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!event.all_day && (
            <span className="flex flex-wrap items-center gap-2 text-xs" data-testid="nudge">
              <Nudge label="Début" event={event} mode="start" onMove={onMove} disabled={moving} />
              <Nudge label="Fin" event={event} mode="end" onMove={onMove} disabled={moving} />
            </span>
          )}
          <Button disabled={pending} onClick={() => setEditing(true)}>
            Modifier
          </Button>
          <ConfirmDelete pending={pending} onConfirm={() => run(() => deleteEvent(event.id))} />
        </div>
      )}
      <ErrorLine error={error} />
    </div>
  );
}

// Semaine glissante J à J+7 (calculée par buildWeek, heure de Paris) : une colonne
// par jour, un bloc par événement à son créneau. Sur téléphone, seule la grille
// défile horizontalement ; la colonne des heures reste fixe.
export default function AgendaPanel({ week: serverWeek, state, now, ideas, tasks }) {
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const moving = useAction();
  const justDragged = useRef(false);
  const rows = state.data ?? [];

  // Heures affichées avant la réponse du serveur (aperçu du glisser, mise à jour optimiste) :
  // { id: { starts_at, ends_at } }, valables pour cette version des données serveur seulement
  // (le rafraîchissement qui suit moveEvent les remplace).
  const [draft, setDraft] = useState({ base: null, map: {} });
  const overrides = draft.base === serverWeek ? draft.map : {};
  const setOverride = (id, times) =>
    setDraft((d) => {
      const map = { ...(d.base === serverWeek ? d.map : {}) };
      if (times) map[id] = times;
      else delete map[id];
      return { base: serverWeek, map };
    });
  const week =
    serverWeek && Object.keys(overrides).length
      ? buildWeek(rows.map((e) => (overrides[e.id] ? { ...e, ...overrides[e.id] } : e)), new Date(now))
      : serverWeek;

  const commit = (event, times) => {
    setOverride(event.id, { ...times, pending_move: (event.origin ?? 'google') === 'google' });
    moving.run(async () => {
      const result = await moveEvent({ id: event.id, ...times });
      if (result.error) setOverride(event.id, null);
      return result;
    });
  };

  // Glisser un bloc (mode 'move') ou une poignée ('start' / 'end') : écoute sur window pour
  // survivre au changement de colonne du bloc pendant l'aperçu. Pas de 15 min (snapMinutes).
  const startDrag = (ev, block, dayIndex, mode) => {
    if (ev.button !== 0 || moving.pending) return;
    ev.stopPropagation();
    const colW = ev.currentTarget.closest('[data-testid^="day-"]').offsetWidth;
    const origin = { x: ev.clientX, y: ev.clientY };
    let step = null; // { minutes, days } une fois le seuil de DRAG_PX franchi
    const move = (e) => {
      const dx = e.clientX - origin.x;
      const dy = e.clientY - origin.y;
      if (!step && Math.hypot(dx, dy) < DRAG_PX) return;
      const last = week.days.length - 1;
      const days = mode === 'move' ? Math.min(Math.max(Math.round(dx / colW), -dayIndex), last - dayIndex) : 0;
      step = { minutes: snapMinutes(dy, HOUR_PX), days };
      setOverride(block.id, shiftEvent(block, { mode, ...step }));
    };
    const end = (e) => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      if (!step) return; // simple clic : onClick ouvre le détail
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false));
      if (e.type === 'pointercancel' || (!step.minutes && !step.days)) setOverride(block.id, null);
      else commit(block, shiftEvent(block, { mode, ...step }));
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

  const today = week?.days[0].day;
  const selected = week && selectedId ? findEvent(week, selectedId) : null;

  let grid = null;
  if (week) {
    const hours = week.hourEnd - week.hourStart;
    const height = hours * HOUR_PX;
    const columns = `${GUTTER_REM}rem repeat(${week.days.length}, minmax(${DAY_MIN_REM}rem, 1fr))`;
    const gutter = 'sticky left-0 z-20 bg-white dark:bg-zinc-950';
    const cell = 'border-l border-zinc-200 dark:border-zinc-800';
    const open = (e) => {
      if (justDragged.current) return;
      setAdding(false);
      setSelectedId(e.id);
    };
    grid = (
      <div className="overflow-x-auto" data-testid="agenda-scroll">
        <div className="grid" style={{ gridTemplateColumns: columns, minWidth: `${GUTTER_REM + week.days.length * DAY_MIN_REM}rem` }}>
          <div className={gutter} />
          {week.days.map((d) => (
            <div key={d.day} className={`${cell} px-1 pb-1 text-xs font-semibold capitalize ${d.isToday ? 'text-blue-700 dark:text-blue-300' : ''}`}>
              {d.short}
              {d.isToday && <span className="block font-normal normal-case">aujourd&apos;hui</span>}
            </div>
          ))}

          <div className={`${gutter} text-[10px] ${mutedClass}`}>Jour</div>
          {week.days.map((d) => (
            <div key={d.day} className={`${cell} min-h-6 space-y-0.5 p-0.5`}>
              {d.allDay.map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => open(e)}
                  className="block w-full truncate rounded bg-zinc-200 px-1 text-left text-xs dark:bg-zinc-800"
                >
                  {e.title}
                </button>
              ))}
            </div>
          ))}

          <div className={`${gutter} relative`} style={{ height }}>
            {Array.from({ length: hours }, (_, i) => (
              <span key={i} className={`absolute right-1 -translate-y-1/2 ${mutedClass}`} style={{ top: i * HOUR_PX }}>
                {i > 0 && `${week.hourStart + i}h`}
              </span>
            ))}
          </div>
          {week.days.map((d, dayIndex) => (
            <div key={d.day} className={`${cell} relative`} style={{ height }} data-testid={`day-${d.day}`}>
              {Array.from({ length: hours }, (_, i) => (
                <div key={i} className="absolute inset-x-0 border-t border-zinc-100 dark:border-zinc-900" style={{ top: i * HOUR_PX }} />
              ))}
              {d.nowTop != null && (
                <div
                  className="absolute inset-x-0 z-10 border-t-2 border-red-500"
                  style={{ top: `${d.nowTop}%` }}
                  aria-label="Heure actuelle"
                  data-testid="now-line"
                />
              )}
              {d.blocks.map((b) => {
                const linked = linkedOf(b.id, ideas, tasks);
                const shown = linked.tasks.slice(0, 3);
                // Poignées sur le vrai début / la vraie fin seulement (pas sur la suite d'un événement de nuit).
                const ownStart = b.startMin > 0 || timeParis(b.starts_at) === '00h00';
                const ownEnd = b.endMin < 1440;
                const handle = 'absolute inset-x-0 h-2 cursor-ns-resize';
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => open(b)}
                    onPointerDown={(ev) => startDrag(ev, b, dayIndex, 'move')}
                    title={`${b.title} (${timeParis(b.starts_at)})`}
                    className={`group absolute cursor-grab touch-none select-none overflow-hidden rounded border px-1 text-left text-xs leading-tight ${
                      b.conflict ? 'border-red-500 bg-red-100 dark:bg-red-950' : CATEGORY_CLASS[eventColor(b)]
                    } ${selectedId === b.id ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : ''}`}
                    style={{ top: `${b.top}%`, height: `${b.height}%`, left: `${(b.col / b.cols) * 100}%`, width: `${100 / b.cols}%` }}
                    data-testid="event-block"
                    data-conflict={b.conflict}
                  >
                    {ownStart && (
                      <span
                        className={`${handle} top-0`}
                        onPointerDown={(ev) => startDrag(ev, b, dayIndex, 'start')}
                        aria-hidden="true"
                        data-testid="handle-start"
                      />
                    )}
                    {ownEnd && (
                      <span
                        className={`${handle} bottom-0`}
                        onPointerDown={(ev) => startDrag(ev, b, dayIndex, 'end')}
                        aria-hidden="true"
                        data-testid="handle-end"
                      />
                    )}
                    <span className="block truncate">
                      {b.pending_move && '↻ '}
                      {b.conflict && '⚠ '}
                      {linked.ideas.length > 0 && '💡 '}
                      {b.title}
                    </span>
                    {shown.length > 0 && (
                      <span className="mt-0.5 block space-y-px" data-testid="block-tasks">
                        {shown.map((t) => (
                          <span key={t.id} className="block truncate opacity-90">
                            ✓ {t.title}
                          </span>
                        ))}
                        {linked.tasks.length > shown.length && (
                          <span className="block opacity-70">+{linked.tasks.length - shown.length}</span>
                        )}
                      </span>
                    )}
                    {linked.ideas.length > 0 && (
                      <div
                        role="tooltip"
                        className="invisible absolute left-0 top-full z-30 mt-1 w-56 max-w-[80vw] rounded border border-zinc-700 bg-zinc-900 p-2 text-left text-xs leading-snug text-zinc-100 opacity-0 shadow-lg transition-opacity group-hover:visible group-hover:opacity-100 group-focus-visible:visible group-focus-visible:opacity-100"
                      >
                        {linked.ideas.map((n) => (
                          <p key={n.id} className="break-words">
                            💡 {n.content}
                          </p>
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const noEvents = week && week.days.every((d) => !d.allDay.length && !d.blocks.length);
  return (
    <Panel title="Agenda" state={state} file="agenda.sql">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button
          disabled={!week}
          onClick={() => {
            setSelectedId(null);
            setAdding((a) => !a);
          }}
        >
          Ajouter un événement
        </Button>
        {week?.conflicts > 0 && (
          <span className="text-sm font-medium text-red-600 dark:text-red-400">{week.conflicts} conflit(s)</span>
        )}
      </div>
      {week && (
        <div className="mb-2 flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400" data-testid="agenda-legend">
          {LEGEND.map((l) => (
            <span key={l.key} className="flex items-center gap-1">
              <span className={`h-2.5 w-2.5 rounded-full ${l.dot}`} aria-hidden="true" />
              {l.label}
            </span>
          ))}
        </div>
      )}
      {adding && <EventForm today={today} onDone={() => setAdding(false)} />}
      {noEvents && (
        <p className="my-2 text-sm text-zinc-500 dark:text-zinc-400">
          Aucun événement de {week.days[0].short} à {week.days.at(-1).short}.
        </p>
      )}
      {grid}
      <ErrorLine error={moving.error} />
      {selected && (
        <EventDetail
          key={selected.id}
          event={selected}
          today={today}
          onClose={() => setSelectedId(null)}
          ideas={ideas}
          tasks={tasks}
          onMove={commit}
          moving={moving.pending}
        />
      )}
      {!state.error && (
        <SyncFooter
          rows={rows.filter((e) => (e.origin ?? 'google') === 'google')}
          href="https://calendar.google.com/"
          label="Ouvrir Google Agenda"
          now={now}
        />
      )}
    </Panel>
  );
}
