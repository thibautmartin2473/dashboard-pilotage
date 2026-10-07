// Logique pure de la démo « Ma journée » (aucun accès base, aucun état).
import { categoryOf, isOverdue, timeParis } from '@/lib/home';

export const MAX_PINS = 3;
export const COURSE_KEY = '11'; // catégorie rouge : cours EDHEC

export function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const dayOf = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

const endMs = (e) => Date.parse(e.ends_at ?? e.starts_at);

// « 08/10 » à partir de AAAA-MM-JJ.
export const shortDate = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

// Dernier jour (Paris) couvert par un événement horaire.
function lastDay(e) {
  return e.ends_at && endMs(e) > Date.parse(e.starts_at) ? dayOf(endMs(e) - 1) : dayOf(e.starts_at);
}

export const isCourse = (e) => e.color_id === COURSE_KEY;
export const isWorkBlock = (e, categories) => categoryOf(categories, e.color_id).kind === 'tache';

// Événements horaires qui touchent `day`, dans l'ordre horaire.
export function blocksOfDay(events, day) {
  return events
    .filter((e) => !e.all_day && dayOf(e.starts_at) <= day && day <= lastDay(e))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at) || a.title.localeCompare(b.title));
}

export const allDayOf = (events, day) =>
  events.filter((e) => e.all_day && dayOf(e.starts_at) <= day && day < (e.ends_at ? dayOf(e.ends_at) : addDays(day, 1)) );

export const timeRange = (e) => `${timeParis(e.starts_at)} - ${timeParis(new Date(endMs(e)).toISOString())}`;

const STOP = new Set(['les', 'des', 'une', 'pour', 'avec', 'dans', 'sur', 'bloc', 'planifie', 'faire', 'tache', 'travail', 'cours', 'plus', 'cette', 'mon', 'mes', 'aux', 'par']);
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const keywords = (s) => new Set(norm(s ?? '').split(/[^a-z0-9]+/).filter((w) => w.length >= 3 && !STOP.has(w)));

// Prochain bloc de travail à venir qui partage un mot-clé avec la tâche ou son bloc d'origine,
// sinon le prochain bloc de travail. -> { event, shared } ou null.
export function suggestBlock(task, origin, events, categories, nowMs) {
  const upcoming = events
    .filter((e) => !e.all_day && Date.parse(e.starts_at) > nowMs && isWorkBlock(e, categories) && e.id !== origin?.id)
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at));
  if (!upcoming.length) return null;
  const mine = keywords(`${task.title} ${origin?.title ?? ''}`);
  for (const e of upcoming) {
    const shared = [...keywords(e.title)].find((w) => mine.has(w));
    if (shared) return { event: e, shared };
  }
  return { event: upcoming[0], shared: null };
}

// Répartition des tâches pour le jour `day` (today = vrai aujourd'hui).
// state : { done: {id: bool}, placed: {id: eventId}, dropped: {id: true} }
export function organize({ tasks, events, categories, day, today, nowMs, state }) {
  const isDone = (t) => state.done[t.id] ?? t.done;
  const eventOf = (t) => state.placed[t.id] ?? t.event_id;
  const byId = new Map(events.map((e) => [e.id, e]));
  const live = tasks.filter((t) => !state.dropped[t.id]);
  const blocks = blocksOfDay(events, day);

  const inBlocks = new Set();
  const perBlock = new Map(blocks.map((b) => [b.id, []]));
  for (const t of live) {
    const id = eventOf(t);
    if (id && perBlock.has(id)) {
      perBlock.get(id).push(t);
      inBlocks.add(t.id);
    }
  }
  const loose = live.filter((t) => !inBlocks.has(t.id) && t.due_date === day && !(state.placed[t.id]));

  const looseIds = new Set(loose.map((t) => t.id));
  const recaser = [];
  const later = [];
  for (const t of live) {
    if (inBlocks.has(t.id) || looseIds.has(t.id) || isDone(t)) continue;
    const origin = t.event_id ? byId.get(t.event_id) : null;
    const pastBlock = origin && lastDay(origin) < today;
    if (state.placed[t.id]) { later.push(t); continue; }
    if (isOverdue({ ...t, done_at: null }, today) || pastBlock) recaser.push(t);
    else later.push(t);
  }
  const sorted = (list) => [...list].sort((a, b) => (a.due_date ?? '9').localeCompare(b.due_date ?? '9') || a.title.localeCompare(b.title));
  const withSuggestion = sorted(recaser).map((t) => ({
    task: t,
    origin: t.event_id ? byId.get(t.event_id) ?? null : null,
    suggestion: suggestBlock(t, t.event_id ? byId.get(t.event_id) : null, events, categories, nowMs),
  }));
  return { blocks, perBlock, loose, recaser: withSuggestion, later: sorted(later), isDone };
}

// Bloc « en grand » du mode Focus : en cours aujourd'hui, sinon le prochain, sinon le premier du jour.
export function focusBlock(blocks, categories, day, today, nowMs) {
  const cand = blocks.filter((b) => !isCourse(b));
  if (!cand.length) return null;
  if (day !== today) return cand[0];
  return (
    cand.find((b) => Date.parse(b.starts_at) <= nowMs && nowMs < endMs(b)) ??
    cand.find((b) => Date.parse(b.starts_at) > nowMs) ??
    cand[cand.length - 1]
  );
}
