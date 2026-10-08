'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { BlockIcon } from './AgendaIcons';
import CategoryEditor, { CategoryPicker } from './CategoryEditor';
import { LinkedIdeas } from './IdeasPanel';
import Panel from './Panel';
import { Button, ConfirmDelete, ErrorLine, Field, IconButton, Select, mutedClass, useAction } from './ui';
import { completeTask } from '@/app/actions';
import { deleteEvent, moveEvent, saveEvent, saveKindOverride } from '@/app/edit-actions';
import {
  BLOCK_KINDS, BLOCK_KIND_LABELS, OTHER_KEY, TIMELINE_DAYS, WEEK_OFFSET_MAX, WEEK_OFFSET_MIN, blockKind, blockTiming, blockUrgency, buildWeek,
  clampOffset, describeWhen, doneEventIds, eventForm, isToConfirm, shiftEvent, showBlockIcon, snapMinutes, timeParis, todayParis,
} from '@/lib/home';

const HOUR_PX_MIN = 36; // hauteur minimale d'une heure dans la grille (téléphone, petite fenêtre)
const HOUR_PX_MAX = 72; // plafond quand l'agenda remplit un grand écran (page « tout sur un écran »)
const VISIBLE_DAYS = 5; // jours visibles d'un coup (J à J+4) : une colonne = un cinquième de la bande
const DAY_MIN_REM = 6.5; // largeur minimale d'une colonne (défilement horizontal sur téléphone)
const GUTTER_REM = 3;
const DRAG_PX = 5; // en deçà, un appui reste un clic (ouvre le détail)
const NO_OVERRIDES = {}; // identité stable : la frise n'est pas recalculée sans aperçu en cours
// Bandeau « Jour » (journées entières) : 2 éléments par case puis « +N » (liste au survol).
const ROW_CHIPS = 2;
const TASK_INSET_PX = 8; // retrait à gauche d'une tâche posée sur une plage : laisse voir le filet de la plage
const TASK_LINE_PX = 14; // hauteur d'une ligne de tâche liée dans un bloc

// Teintes des blocs (jetons de globals.css) : fond pâle, filet de 3 px à gauche, texte de la même teinte.
// Examen : bordeaux plein. Travail de fond : bleu acier plein. Tâche courte : pastille à contour.
const OLIVE = { fill: 'var(--bloc-cours-fond)', rule: 'var(--bloc-cours)', ink: 'var(--bloc-cours-texte)' };
const TONES = {
  cours: OLIVE,
  sport: OLIVE,
  examen: { fill: 'var(--bloc-examen)', rule: 'var(--bloc-examen)', ink: 'var(--bloc-examen-texte)' },
  rdv: { fill: 'var(--bloc-rdv-fond)', rule: 'var(--bloc-rdv)', ink: 'var(--bloc-rdv-texte)' },
  prepa: { fill: 'var(--bloc-prepa-fond)', rule: 'var(--bloc-prepa)', ink: 'var(--bloc-prepa-texte)' },
  travail: { fill: 'var(--action)', rule: 'var(--action)', ink: 'var(--action-text)' },
  courte: { fill: 'var(--card-solid)', rule: 'var(--action)', ink: 'var(--action)' },
  journee: { fill: 'var(--btn-fill)', rule: 'var(--line-strong)', ink: 'var(--ink)' },
};

// Anneau double (bord clair puis couleur) : « en cours » (action) et « conflit » (corail).
const ring = (color) => `0 0 0 1.5px var(--card-solid), 0 0 0 3.5px ${color}`;

// Petits pictogrammes sobres (SVG) : case vide pour une tâche à faire.
function Tick() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="mr-1 inline-block h-2.5 w-2.5 align-[-1px]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function Chevron({ dir }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5'} />
    </svg>
  );
}

function Plus() {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function MoreChip({ items }) {
  if (items.length <= ROW_CHIPS) return null;
  const rest = items.slice(ROW_CHIPS);
  return (
    <span title={rest.join('\n')} className={`block px-1 text-xs ${mutedClass}`}>
      +{rest.length}
    </span>
  );
}

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

function EventForm({ initial, today, categories, onDone }) {
  const { pending, error, run } = useAction();
  const [form, setForm] = useState(
    initial ?? { title: '', all_day: false, location: '', start: `${today}T09:00`, end: `${today}T10:00`, category: OTHER_KEY }
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
    <form onSubmit={submit} className="mt-3 shrink-0 space-y-2 rounded-lg border border-[var(--line)] bg-[var(--card-inset)] p-3">
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
        <input type="checkbox" checked={form.all_day} onChange={(e) => toggleAllDay(e.target.checked)} className="size-4 [accent-color:var(--action)]" />
        Toute la journée
      </label>
      <div className={mutedClass}>
        Catégorie
        <CategoryPicker value={form.category ?? OTHER_KEY} categories={categories} onChange={(category) => set({ category })} />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" level="primary" disabled={pending}>
          {pending ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter'}
        </Button>
        <Button level="tertiary" disabled={pending} onClick={onDone}>
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
        className="size-4 shrink-0 [accent-color:var(--action)]"
      />
      <span className="break-words">{task.title}</span>
    </li>
  );
}

// Boutons -15 / +15 du détail (téléphone, clavier) : début ou fin −/+ 15 min, même calcul que les poignées.
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
    <span className="flex items-center gap-2">
      {label}
      {arrow(-15, '-15', 'tôt')}
      {arrow(15, '+15', 'tard')}
    </span>
  );
}

function EventDetail({ event, today, categories, onClose, ideas, tasks, onMove, moving, kindMap, onKind }) {
  const { pending, error, run } = useAction();
  const [editing, setEditing] = useState(false);
  const google = (event.origin ?? 'google') === 'google';
  const linked = linkedOf(event.id, ideas, tasks);
  // Type du bloc : automatique (catégorie + titre) ou choisi ici. `onKind` met à jour l'aperçu tout de suite,
  // l'enregistrement part en Server Action (clé agenda_kind_overrides) et l'aperçu revient en arrière si elle échoue.
  const chosen = BLOCK_KINDS.includes(kindMap[event.id]) ? kindMap[event.id] : '';
  const autoKind = blockKind(event, event.category, {});
  const changeKind = (value) => {
    onKind(event.id, value);
    run(async () => {
      const result = await saveKindOverride({ eventId: event.id, kind: value });
      if (result.error) onKind(event.id, null);
      return result;
    });
  };

  return (
    <div className="mt-3 max-h-[45%] shrink-0 overflow-y-auto rounded-lg border border-[var(--line)] bg-[var(--card-inset)] p-3 text-sm" data-testid="event-detail">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-start gap-1.5 break-words font-medium">
            {!event.all_day && <BlockIcon kind={event.kind} className="mt-0.5" />}
            {event.title}
          </p>
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
          {event.conflict && <p className="text-sm font-semibold text-[var(--late-text)]">Conflit avec un autre événement</p>}
          {event.link && (
            <a href={event.link} target="_blank" rel="noopener noreferrer" className="text-sm underline">
              Ouvrir dans Google Agenda
            </a>
          )}
          {google && event.pending_move && (
            <p className="border-l-2 border-[var(--pending)] pl-2 text-sm font-medium" data-testid="pending-move">
              À renvoyer vers Google (déplacé ici, la synchro ne l&apos;écrase pas)
            </p>
          )}
          {google && !event.pending_move && (
            <p className={mutedClass}>
              Événement Google : un déplacement est renvoyé vers Google ; « Modifier » ou une suppression peut être
              annulé par la prochaine synchro.
            </p>
          )}
        </div>
        <Button level="tertiary" onClick={onClose}>
          Fermer
        </Button>
      </div>
      {editing ? (
        <EventForm initial={{ id: event.id, ...eventForm(event) }} today={today} categories={categories} onDone={() => setEditing(false)} />
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {!event.all_day && (
            <label className="flex items-center gap-2 text-sm" data-testid="kind-picker">
              Type
              <Select value={chosen} disabled={pending} onChange={(e) => changeKind(e.target.value)} aria-label="Type du bloc">
                <option value="">Automatique ({BLOCK_KIND_LABELS[autoKind].toLowerCase()})</option>
                {BLOCK_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {BLOCK_KIND_LABELS[k]}
                  </option>
                ))}
              </Select>
            </label>
          )}
          {!event.all_day && (
            <span className="flex flex-wrap items-center gap-2 text-sm" data-testid="nudge">
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

// Navigation façon Calendrier : « Aujourd'hui » et deux flèches, qui avancent d'autant de jours que la bande
// en montre. `go(offset)` fait défiler la bande (même chemin que le glisser à la main).
function WeekNav({ offset, go, step, first, last, visible }) {
  const n = Math.max(1, visible);
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="week-nav">
      <IconButton label="Jours précédents" disabled={offset <= WEEK_OFFSET_MIN} onClick={() => step(-n)}>
        <Chevron dir="left" />
      </IconButton>
      <Button disabled={offset === 0} onClick={() => go(0)}>
        Aujourd&apos;hui
      </Button>
      <IconButton label="Jours suivants" disabled={offset >= WEEK_OFFSET_MAX} onClick={() => step(n)}>
        <Chevron dir="right" />
      </IconButton>
      <span className={`ml-1 capitalize ${mutedClass}`} data-testid="week-range">
        {first} - {last}
      </span>
    </div>
  );
}

// Bouton « + » : ajouter un événement, ou ouvrir les catégories. Se ferme à Échap ou en cliquant ailleurs.
function AddMenu({ disabled, onAdd, onCategories }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const outside = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const escape = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('pointerdown', outside);
    window.addEventListener('keydown', escape);
    return () => {
      window.removeEventListener('pointerdown', outside);
      window.removeEventListener('keydown', escape);
    };
  }, [open]);
  const pick = (fn) => () => {
    setOpen(false);
    fn();
  };
  return (
    <div ref={ref} className="relative">
      <IconButton label="Ajouter" level="primary" disabled={disabled} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Plus />
      </IconButton>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-40 mt-1 flex w-52 flex-col gap-0.5 rounded-xl border border-[var(--line)] bg-[var(--card-solid)] p-1 shadow-md"
        >
          <Button role="menuitem" level="tertiary" className="justify-start" onClick={pick(onAdd)}>
            Ajouter un événement
          </Button>
          <Button role="menuitem" level="tertiary" className="justify-start" onClick={pick(onCategories)}>
            Catégories
          </Button>
        </div>
      )}
    </div>
  );
}

// Frise de TIMELINE_DAYS jours (J-35 à J+98, buildWeek, heure de Paris) rendue d'un seul tenant dans
// une bande qui défile horizontalement : 5 jours visibles d'un coup (J à J+4, une colonne = un
// cinquième de la largeur de la bande), moins sur téléphone (DAY_MIN_REM). Elle s'ouvre sur aujourd'hui ; on la fait glisser à la main
// (souris : appui sur le fond de la grille ; pavé tactile, doigt, Maj + molette : défilement natif)
// ou aux flèches, avec un aimant sur chaque jour. Heures fixes de 8 h à 22 h. Blocs façon Calendrier
// d'Apple (type, icône, états : voir lib/home.js blockKind et la section « Agenda » de CLAUDE.md), les
// tâches posées par-dessus leur plage. La colonne des heures reste fixe.
export default function AgendaPanel({ week: serverWeek, state, now, ideas, tasks, done, categories, kindOverrides = NO_OVERRIDES }) {
  const [selectedId, setSelectedId] = useState(null);
  const [offset, setOffset] = useState(0); // premier jour visible, en jours depuis aujourd'hui
  const [visible, setVisible] = useState(VISIBLE_DAYS); // nombre de colonnes entières visibles
  const scrollRef = useRef(null);
  const [aligned, setAligned] = useState(false); // bande masquée tant qu'elle n'est pas calée sur aujourd'hui
  const [hourPx, setHourPx] = useState(HOUR_PX_MIN); // hauteur d'une heure : remplit la zone sur grand écran
  const [adding, setAdding] = useState(false);
  const [editingCategories, setEditingCategories] = useState(false);
  const moving = useAction();
  const justDragged = useRef(false);

  // Heures affichées avant la réponse du serveur (aperçu du glisser, mise à jour optimiste) :
  // { id: { starts_at, ends_at } }, valables pour cette version des données serveur seulement
  // (le rafraîchissement qui suit moveEvent les remplace).
  const [draft, setDraft] = useState({ base: null, map: {} });
  const overrides = draft.base === serverWeek ? draft.map : NO_OVERRIDES;
  const setOverride = (id, times) =>
    setDraft((d) => {
      const map = { ...(d.base === serverWeek ? d.map : {}) };
      if (times) map[id] = times;
      else delete map[id];
      return { base: serverWeek, map };
    });
  // Types choisis dans le détail, affichés avant le retour du serveur ('' = retour à l'automatique) :
  // valables pour cette version des surcharges seulement.
  const [kindDraft, setKindDraft] = useState({ base: null, map: {} });
  const kindMap = useMemo(
    () => (kindDraft.base === kindOverrides ? { ...kindOverrides, ...kindDraft.map } : kindOverrides),
    [kindOverrides, kindDraft]
  );
  const setKind = (id, kind) =>
    setKindDraft((d) => {
      const map = { ...(d.base === kindOverrides ? d.map : {}) };
      if (kind === null) delete map[id];
      else map[id] = kind;
      return { base: kindOverrides, map };
    });
  // Toute la frise, recalculée seulement quand les données, l'aperçu ou l'heure changent (pas au défilement).
  const week = useMemo(
    () =>
      serverWeek
        ? buildWeek(
            (state.data ?? []).map((e) => (overrides[e.id] ? { ...e, ...overrides[e.id] } : e)),
            new Date(now),
            categories,
            WEEK_OFFSET_MIN,
            TIMELINE_DAYS,
            kindMap
          )
        : null,
    [serverWeek, state.data, overrides, now, categories, kindMap]
  );
  const doneIds = useMemo(() => doneEventIds(done, tasks), [done, tasks]);
  const todayStr = todayParis(new Date(now));
  const hours = week ? week.hourEnd - week.hourStart : 0;

  // Défilement : largeur d'une colonne de jour, mesurée sur la première.
  const colWidth = () => scrollRef.current?.querySelector('[data-testid^="day-"]')?.offsetWidth || 1;
  // Cible d'un défilement animé en cours : deux clics rapides sur une flèche s'additionnent au lieu
  // de repartir d'une position intermédiaire. Effacée à l'arrivée ou dès un geste à la main.
  const targetRef = useRef(null);
  const go = (target, behavior = 'smooth') => {
    targetRef.current = clampOffset(target);
    scrollRef.current?.scrollTo({ left: (targetRef.current - WEEK_OFFSET_MIN) * colWidth(), behavior });
  };
  const step = (days) =>
    go((targetRef.current ?? Math.round(scrollRef.current.scrollLeft / colWidth()) + WEEK_OFFSET_MIN) + days);
  const handTakesOver = () => (targetRef.current = null);
  const offsetRef = useRef(0); // dernier premier jour visible, relu au redimensionnement
  const onScroll = () => {
    const el = scrollRef.current;
    const w = colWidth();
    if (targetRef.current !== null && Math.abs(el.scrollLeft - (targetRef.current - WEEK_OFFSET_MIN) * w) < 2) {
      targetRef.current = null;
    }
    offsetRef.current = clampOffset(Math.round(el.scrollLeft / w) + WEEK_OFFSET_MIN);
    setOffset(offsetRef.current);
    setVisible(Math.max(1, Math.floor((el.clientWidth - el.querySelector('[data-testid="agenda-gutter"]').offsetWidth) / w + 0.05)));
  };
  // Largeur d'un jour = un cinquième de la bande hors colonne des heures, jamais moins de DAY_MIN_REM :
  // mesurée sur la bande (ResizeObserver), puis la bande se recale sur le même premier jour visible
  // (aujourd'hui à l'ouverture).
  const [dayPx, setDayPx] = useState(null);
  const hasGrid = Boolean(week);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => {
      const gutterPx = el.querySelector('[data-testid="agenda-gutter"]').offsetWidth;
      const minPx = (gutterPx / GUTTER_REM) * DAY_MIN_REM;
      setDayPx(Math.max(minPx, (el.clientWidth - gutterPx) / VISIBLE_DAYS));
      // Grand écran : la zone a une hauteur fixe, les heures la remplissent (sinon 36 px, la page défile).
      const hoursCell = el.querySelector('[data-testid="agenda-hours"]');
      if (hours && hoursCell && window.matchMedia('(min-width: 1280px)').matches) {
        const head = hoursCell.getBoundingClientRect().top - el.firstElementChild.getBoundingClientRect().top;
        setHourPx(Math.min(HOUR_PX_MAX, Math.max(HOUR_PX_MIN, Math.floor((el.clientHeight - head - 2) / hours))));
      } else setHourPx(HOUR_PX_MIN);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasGrid, hours]);
  // Défilement vertical (zone à hauteur fixe) : à l'ouverture, la bande « maintenant » au tiers de la zone.
  const scrolledY = useRef(false);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!aligned || scrolledY.current || !el) return;
    scrolledY.current = true;
    const band = el.querySelector('[data-testid="now-band"]');
    if (band && el.scrollHeight > el.clientHeight + 1) {
      el.scrollTop += band.getBoundingClientRect().top - el.getBoundingClientRect().top - el.clientHeight / 3;
    }
  }, [aligned]);
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !dayPx) return;
    el.scrollLeft = (offsetRef.current - WEEK_OFFSET_MIN) * dayPx;
    onScroll();
    setAligned(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement quand la largeur d'un jour change
  }, [dayPx]);

  // Glisser la frise à la souris : appui sur le fond de la grille (pas sur un bloc ni un bouton).
  // L'aimant est coupé pendant le geste, puis la bande se cale sur le jour le plus proche.
  const startPan = (ev) => {
    if (ev.pointerType !== 'mouse' || ev.button !== 0 || ev.target.closest('button, a, input')) return;
    const el = scrollRef.current;
    handTakesOver();
    const x0 = ev.clientX;
    const left0 = el.scrollLeft;
    el.style.scrollSnapType = 'none';
    el.style.cursor = 'grabbing';
    const move = (e) => {
      el.scrollLeft = left0 - (e.clientX - x0);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
      window.removeEventListener('pointercancel', end);
      el.style.cursor = '';
      const target = Math.round(el.scrollLeft / colWidth()) + WEEK_OFFSET_MIN;
      go(target);
      setTimeout(() => (el.style.scrollSnapType = ''), 400); // après le calage animé
    };
    ev.preventDefault(); // pas de sélection de texte pendant le geste
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
  };

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
      step = { minutes: snapMinutes(dy, hourPx), days };
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

  // Jours visibles dans la bande (titre de la frise, message « aucun événement »).
  const shown = week ? week.days.slice(offset - WEEK_OFFSET_MIN, offset - WEEK_OFFSET_MIN + visible) : [];
  // Date proposée à l'ajout : aujourd'hui, ou le premier jour affiché s'il est plus loin.
  const firstShown = shown[0]?.day;
  const today = firstShown && firstShown > todayStr ? firstShown : todayStr;
  const selected = week && selectedId ? findEvent(week, selectedId) : null;

  let grid = null;
  if (week) {
    const height = hours * hourPx;
    const columns = `${GUTTER_REM}rem repeat(${week.days.length}, ${dayPx ? `${dayPx}px` : `${DAY_MIN_REM}rem`})`;
    const gutter = 'sticky left-0 z-20 bg-[var(--card-solid)]';
    const cell = 'border-l border-[var(--line)]';
    const open = (e) => {
      if (justDragged.current) return;
      setAdding(false);
      setSelectedId(e.id);
    };
    const edge = 'pointer-events-none absolute right-1 z-10 rounded bg-[var(--card-solid)] px-1 text-[10px] leading-4 text-[var(--ink-muted)]';
    grid = (
      <div
        ref={scrollRef}
        onScroll={onScroll}
        onPointerDown={startPan}
        onWheel={handTakesOver}
        onTouchStart={handTakesOver}
        className="cursor-grab snap-x snap-mandatory overflow-x-auto xl:min-h-0 xl:flex-1 xl:overflow-y-auto"
        style={{ scrollPaddingLeft: `${GUTTER_REM}rem`, visibility: aligned ? 'visible' : 'hidden' }}
        data-testid="agenda-scroll"
      >
        <div className="grid w-max select-none" style={{ gridTemplateColumns: columns }}>
          <div className={`${gutter} top-0 z-30 border-b border-[var(--line-strong)]`} data-testid="agenda-gutter" />
          {week.days.map((d) => (
            <div
              key={d.day}
              className={`${cell} sticky top-0 z-20 snap-start border-b border-[var(--line-strong)] px-1 py-1 text-sm font-semibold capitalize ${
                d.isToday
                  ? 'bg-[var(--card-solid)] text-[var(--ink)] shadow-[inset_0_-2px_0_var(--action)]'
                  : d.isPast
                    ? 'bg-[var(--card-solid)] font-medium text-[var(--ink-muted)]'
                    : 'bg-[var(--card-solid)]'
              }`}
            >
              {d.short}
              {d.isToday && <span className="block text-xs font-normal normal-case">aujourd&apos;hui</span>}
            </div>
          ))}

          <div className={`${gutter} text-xs ${mutedClass}`}>Jour</div>
          {week.days.map((d) => (
            <div key={d.day} className={`${cell} min-h-6 space-y-0.5 p-0.5`}>
              {d.allDay.slice(0, ROW_CHIPS).map((e) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => open(e)}
                  title={`${e.title} (toute la journée)`}
                  className="block w-full truncate rounded-[3px] border-l-[3px] px-1 text-left text-xs"
                  style={{ background: TONES.journee.fill, color: TONES.journee.ink, borderLeftColor: TONES.journee.rule }}
                >
                  {e.title}
                </button>
              ))}
              <MoreChip items={d.allDay.map((e) => e.title)} />
            </div>
          ))}

          <div className={`${gutter} relative`} style={{ height }} data-testid="agenda-hours">
            {Array.from({ length: hours }, (_, i) => (
              <span key={i} className={`absolute right-1 -translate-y-1/2 ${mutedClass}`} style={{ top: i * hourPx }}>
                {i > 0 && `${week.hourStart + i}h`}
              </span>
            ))}
          </div>
          {week.days.map((d, dayIndex) => (
            <div key={d.day} className={`${cell} relative`} style={{ height }} data-testid={`day-${d.day}`}>
              {Array.from({ length: hours }, (_, i) => (
                <div key={i} className="absolute inset-x-0 border-t border-[var(--line)] opacity-60" style={{ top: i * hourPx }} />
              ))}
              {d.nowBand && (
                <div
                  className="absolute inset-x-0 bg-[var(--action-soft)]"
                  style={{ top: `${d.nowBand.top}%`, height: `${d.nowBand.height}%` }}
                  title="Heure en cours"
                  data-testid="now-band"
                />
              )}
              {d.before.length > 0 && (
                <span className={`${edge} top-0.5`} title={`Avant ${week.hourStart} h : ${d.before.join(', ')}`} data-testid="before-chip">
                  {d.before.length} avant {week.hourStart} h
                </span>
              )}
              {d.after.length > 0 && (
                <span className={`${edge} bottom-0.5`} title={`Après ${week.hourEnd} h : ${d.after.join(', ')}`} data-testid="after-chip">
                  {d.after.length} après {week.hourEnd} h
                </span>
              )}
              {d.blocks.map((b) => {
                const linked = linkedOf(b.id, ideas, tasks);
                const px = ((b.visEnd - b.visStart) / 60) * hourPx; // hauteur dessinée du bloc
                const timing = blockTiming(b, now);
                const urgency = blockUrgency(linked.tasks, b, todayStr, now);
                const isDone = b.layer === 'tache' && doneIds.has(b.id);
                const toConfirm = isToConfirm(b);
                const tone = TONES[b.kind] ?? TONES.cours;
                const pastille = b.kind === 'courte' && !isDone;
                const ringColor = b.conflict ? 'var(--late)' : timing.running ? 'var(--action)' : null;
                const shadows = [
                  ...(ringColor ? [ring(ringColor)] : []),
                  ...(selectedId === b.id ? [ringColor ? '0 0 0 5px var(--ink)' : '0 0 0 2px var(--ink)'] : []),
                ].join(', ');
                // États : toujours un mot (ici, dans le title et pour les lecteurs d'écran), pas seulement une couleur.
                const states = [
                  b.conflict && 'conflit',
                  timing.running && 'en cours',
                  urgency.late ? 'retard' : urgency.urgent && 'urgent',
                  isDone && 'fait',
                  toConfirm && 'à confirmer',
                  b.pending_move && 'à renvoyer vers Google',
                  timing.past && !isDone && 'passé',
                ].filter(Boolean);
                const showWords = states.filter((w) => w !== 'passé');
                const room = Math.max(0, Math.min(3, Math.floor((px - 34) / TASK_LINE_PX)));
                const taskLines = linked.tasks.slice(0, room);
                // Poignées sur le vrai début / la vraie fin seulement (pas sur la suite d'un événement de nuit,
                // ni sur un bord tronqué hors de la plage 8 h - 22 h).
                const ownStart = !b.clippedTop && (b.startMin > 0 || timeParis(b.starts_at) === '00h00');
                const ownEnd = !b.clippedBottom && b.endMin < 1440;
                const handle = 'absolute inset-x-0 h-1.5 cursor-ns-resize';
                const inset = b.over ? TASK_INSET_PX : 1;
                const span = `(100% - ${inset + 1}px)`;
                const range = b.ends_at ? `${timeParis(b.starts_at)}-${timeParis(b.ends_at)}` : timeParis(b.starts_at);
                const label = `${b.title} (${timeParis(b.starts_at)})${states.length ? ` : ${states.join(', ')}` : ''}${
                  linked.tasks.length > taskLines.length ? ` · ${linked.tasks.length} tâche(s) liée(s)` : ''
                }${b.clippedTop ? ` · commence avant ${week.hourStart} h` : ''}${b.clippedBottom ? ` · finit après ${week.hourEnd} h` : ''}`;
                const border = pastille
                  ? { border: `1.5px solid ${urgency.late ? 'var(--late)' : 'var(--action)'}` }
                  : toConfirm
                    ? { border: '1.5px dashed var(--ink-muted)' }
                    : { borderLeft: `3px solid ${urgency.late ? 'var(--late)' : isDone ? 'var(--done)' : tone.rule}` };
                return (
                  <div
                    key={b.id}
                    className={`group absolute hover:z-30 focus-within:z-30 ${b.layer === 'tache' ? 'z-[5]' : 'z-[1]'}`}
                    style={{
                      top: `${b.top}%`, height: `${b.height}%`,
                      left: `calc(${inset}px + ${span} * ${b.col / b.cols})`, width: `calc(${span} / ${b.cols})`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => open(b)}
                      onPointerDown={(ev) => startDrag(ev, b, dayIndex, 'move')}
                      title={label}
                      className={`relative block h-full w-full cursor-grab touch-none select-none overflow-hidden text-left text-xs leading-[1.2] focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${
                        pastille ? 'rounded-[10px]' : 'rounded-[5px]'
                      } ${isDone ? 'line-through' : ''}`}
                      style={{
                        background: toConfirm ? 'transparent' : isDone ? 'var(--done-soft)' : tone.fill,
                        color: toConfirm ? 'var(--ink)' : isDone ? 'var(--done)' : tone.ink,
                        opacity: isDone ? 0.85 : timing.past ? (b.layer === 'tache' ? 0.72 : 0.6) : 1, // passé : atténué, moins pour une tâche (posée sur une plage, elle ne doit pas virer au gris)
                        ...border,
                        ...(shadows && { boxShadow: shadows }),
                      }}
                      data-testid="event-block"
                      data-kind={b.kind}
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
                      <span className="flex h-full min-h-0 flex-col px-1.5 py-0.5">
                        {b.clippedTop && <span className="block text-[10px] leading-3 opacity-80">avant {week.hourStart} h</span>}
                        <span className="flex items-start gap-1">
                          {urgency.urgent && <BlockIcon kind="urgent" className="mt-px" />}
                          {showBlockIcon(b) && <BlockIcon kind={b.kind} className="mt-px" />}
                          <span className={`min-w-0 font-medium ${px < 34 ? 'truncate' : 'break-words'}`}>{b.title}</span>
                        </span>
                        {px >= 44 && (
                          <span className="block text-[11px] opacity-85">
                            {range}
                            {showWords.map((w) => (
                              <span key={w} className="ml-1.5 font-semibold">
                                {w}
                              </span>
                            ))}
                          </span>
                        )}
                        {px < 44 && <span className="sr-only">{showWords.join(', ')}</span>}
                        {b.pending_move && px >= 44 && (
                          <span className="flex items-center gap-0.5 text-[11px]">
                            <BlockIcon kind="renvoi" size={11} />
                            à renvoyer vers Google
                          </span>
                        )}
                        {taskLines.length > 0 && (
                          <span className="mt-0.5 block space-y-px" data-testid="block-tasks">
                            {taskLines.map((t) => (
                              <span key={t.id} className="block truncate">
                                <Tick /> {t.title}
                              </span>
                            ))}
                            {linked.tasks.length > taskLines.length && <span className="block opacity-70">+{linked.tasks.length - taskLines.length}</span>}
                          </span>
                        )}
                        {b.clippedBottom && <span className="mt-auto block text-[10px] leading-3 opacity-80">après {week.hourEnd} h</span>}
                      </span>
                    </button>
                    {linked.ideas.length > 0 && (
                      <div
                        role="tooltip"
                        className="invisible absolute left-0 top-full z-40 mt-1 w-56 max-w-[80vw] rounded-[5px] border border-[var(--line)] bg-[var(--card-solid)] p-2 text-left text-sm leading-snug text-[var(--ink)] opacity-0 shadow-md transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 motion-reduce:transition-none"
                      >
                        {linked.ideas.map((n) => (
                          <p key={n.id} className="break-words">
                            <span className="font-semibold">Idée :</span> {n.content}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const noEvents = shown.length > 0 && shown.every((d) => !d.allDay.length && !d.blocks.length && !d.before.length && !d.after.length);
  return (
    <Panel title="Agenda" state={state} file="agenda.sql" fill className="xl:h-full" bodyClassName="flex min-h-0 flex-1 flex-col p-3">
      <div className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {shown.length > 0 ? (
          <WeekNav offset={offset} go={go} step={step} first={shown[0].short} last={shown.at(-1).short} visible={visible} />
        ) : (
          <span />
        )}
        <div className="flex items-center gap-3">
          {/* Même périmètre que la tuile « À trancher » : J à J+7, pas toute la frise. */}
          {serverWeek?.conflicts > 0 && (
            <span className="border-l-2 border-[var(--late)] pl-2 text-sm font-semibold">{serverWeek.conflicts} conflit(s)</span>
          )}
          <AddMenu
            disabled={!week}
            onAdd={() => {
              setSelectedId(null);
              setEditingCategories(false);
              setAdding(true);
            }}
            onCategories={() => {
              setAdding(false);
              setEditingCategories(true);
            }}
          />
        </div>
      </div>
      {adding && <EventForm today={today} categories={categories} onDone={() => setAdding(false)} />}
      <CategoryEditor categories={categories} open={editingCategories} onClose={() => setEditingCategories(false)} />
      {noEvents && (
        <p className="my-2 shrink-0 text-sm text-[var(--ink-muted)]">
          Aucun événement de {shown[0].short} à {shown.at(-1).short}.
        </p>
      )}
      {grid}
      <ErrorLine error={moving.error} />
      {selected && (
        <EventDetail
          key={selected.id}
          event={selected}
          today={today}
          categories={categories}
          onClose={() => setSelectedId(null)}
          ideas={ideas}
          tasks={tasks}
          onMove={commit}
          moving={moving.pending}
          kindMap={kindMap}
          onKind={setKind}
        />
      )}
    </Panel>
  );
}
