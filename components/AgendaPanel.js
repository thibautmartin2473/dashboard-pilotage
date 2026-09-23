'use client';

import { useState } from 'react';
import { LinkedIdeas } from './IdeasPanel';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, SyncFooter, mutedClass, useAction } from './ui';
import { deleteEvent, saveEvent } from '@/app/edit-actions';
import { describeWhen, eventForm, timeParis } from '@/lib/home';

const HOUR_PX = 44; // hauteur d'une heure dans la grille
const DAY_MIN_REM = 6.5; // largeur minimale d'une colonne (défilement horizontal sur téléphone)
const GUTTER_REM = 3;

const findEvent = (week, id) => {
  for (const d of week.days) for (const e of [...d.allDay, ...d.blocks]) if (e.id === id) return e;
  return null;
};

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

function EventDetail({ event, today, onClose, ideas }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const google = (event.origin ?? 'google') === 'google';

  return (
    <div className="mt-3 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800" data-testid="event-detail">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="break-words font-medium">{event.title}</p>
          <p className={mutedClass}>{describeWhen(event)}</p>
          {event.location && <p className={`break-words ${mutedClass}`}>{event.location}</p>}
          <LinkedIdeas ideas={ideas} eventId={event.id} />
          {event.conflict && <p className="text-xs font-medium text-red-600 dark:text-red-400">Conflit avec un autre événement</p>}
          {event.link && (
            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-xs underline">
              Ouvrir dans Google Agenda
            </a>
          )}
          {google && (
            <p className={mutedClass}>
              Événement Google : la prochaine synchro peut annuler ta modification ou le rétablir après suppression.
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
export default function AgendaPanel({ week, state, now, ideas }) {
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const rows = state.data ?? [];
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
          {week.days.map((d) => (
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
              {d.blocks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => open(b)}
                  title={`${b.title} (${timeParis(b.starts_at)})`}
                  className={`absolute overflow-hidden rounded border px-1 text-left text-xs leading-tight ${
                    b.conflict
                      ? 'border-red-500 bg-red-100 dark:bg-red-950'
                      : 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                  } ${selectedId === b.id ? 'ring-2 ring-zinc-900 dark:ring-zinc-100' : ''}`}
                  style={{ top: `${b.top}%`, height: `${b.height}%`, left: `${(b.col / b.cols) * 100}%`, width: `${100 / b.cols}%` }}
                  data-testid="event-block"
                  data-conflict={b.conflict}
                >
                  {b.conflict && '⚠ '}
                  {ideas?.some((n) => n.event_id === b.id) && '💡 '}
                  {b.title}
                </button>
              ))}
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
      {adding && <EventForm today={today} onDone={() => setAdding(false)} />}
      {noEvents && (
        <p className="my-2 text-sm text-zinc-500 dark:text-zinc-400">
          Aucun événement de {week.days[0].short} à {week.days.at(-1).short}.
        </p>
      )}
      {grid}
      {selected && <EventDetail key={selected.id} event={selected} today={today} onClose={() => setSelectedId(null)} ideas={ideas} />}
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
