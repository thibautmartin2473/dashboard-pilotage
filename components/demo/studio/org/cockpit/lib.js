// Logique pure du Cockpit (aucun accès base, aucun effet) : mise en page de la frise, tri des
// tâches entre « dans un bloc » et « à placer », bilan d'hier, prochaine échéance.
import { dayLabel, isOverdue, timeParis } from '@/lib/home';
import { addDays, blocksOfDay, dayOf, isWorkBlock } from '@/components/demo/TodayLogic';
import { classify, diffDays } from '@/components/demo/DeadlinesLogic';

export const VIEWS = [
  { id: 'jour', label: 'Jour', length: 1, step: 1 },
  { id: 'trois', label: '3 jours', length: 3, step: 3 },
  { id: 'semaine', label: 'Semaine', length: 7, step: 7 },
];

const endMs = (e) => Date.parse(e.ends_at ?? e.starts_at);
const pad = (n) => String(n).padStart(2, '0');

// Les blocs de travail portent « [bloc planifié] » en tête de titre : inutile à l'écran.
export const cleanTitle = (title) => String(title ?? '').replace(/^\s*\[[^\]]*\]\s*/, '').trim() || 'Sans titre';
export const minToLabel = (m) => `${pad(Math.floor(m / 60) % 24)}h${pad(m % 60)}`;
export const shortDay = (day) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;
export const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export const lastDayOf = (e) => (e.ends_at && endMs(e) > Date.parse(e.starts_at) ? dayOf(endMs(e) - 1) : dayOf(e.starts_at));

// Fenêtre affichée : en vue Semaine on cale sur le lundi du jour visé. -> { offset, length }
export function windowFor(view, offset, today) {
  const v = VIEWS.find((x) => x.id === view) ?? VIEWS[0];
  if (v.id !== 'semaine') return { offset, length: v.length };
  const dow = new Date(`${addDays(today, offset)}T12:00:00Z`).getUTCDay(); // 0 = dimanche
  return { offset: offset - ((dow + 6) % 7), length: 7 };
}

// Entrées d'une colonne de la frise : blocs, plages libres (>= 20 min), repère « maintenant ».
export function layoutDay(day, nowMin) {
  const items = [];
  let end = null;
  let marked = !day.isToday;
  for (const b of day.blocks) {
    const live = day.isToday && b.startMin <= nowMin && nowMin < b.endMin;
    if (!marked && !live && nowMin < b.startMin) {
      items.push({ type: 'now', key: `now-${day.day}` });
      marked = true;
    }
    if (end !== null && b.startMin - end >= 20) items.push({ type: 'gap', key: `gap-${b.id}-${day.day}`, minutes: b.startMin - end });
    items.push({ type: 'block', key: `${b.id}-${day.day}`, block: b, live });
    if (live) marked = true;
    end = end === null ? b.endMin : Math.max(end, b.endMin);
  }
  if (!marked) items.push({ type: 'now', key: `now-${day.day}` });
  return items;
}

export const minutesLabel = (m) => {
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${h} h${r ? ` ${pad(r)}` : ''} libre${h > 1 ? 's' : ''}` : `${r} min libres`;
};

// Tâches (déjà fusionnées avec l'état local : `done`, `eventId`) -> { byBlock, tray }.
// Une tâche est dans son bloc tant que celui-ci existe et n'est pas passé ; sinon elle est « à placer »
// (sans bloc, bloc introuvable ou bloc passé). Les tâches d'hier attendent le bilan : hors du tiroir.
export function partitionTasks({ tasks, eventsById, today, yesterday, bilanPending }) {
  const byBlock = new Map();
  const tray = [];
  for (const t of tasks) {
    const ev = t.eventId ? eventsById.get(t.eventId) : null;
    if (ev) byBlock.set(ev.id, [...(byBlock.get(ev.id) ?? []), t]);
    if (t.done) continue;
    const last = ev ? lastDayOf(ev) : null;
    if (ev && last >= today) continue; // dans un bloc d'aujourd'hui ou à venir
    if (ev && bilanPending && last === yesterday) continue; // attend la carte de bilan
    const reasons = [];
    if (!ev) reasons.push(t.eventId ? 'bloc absent de l’agenda' : 'sans bloc');
    else reasons.push(`bloc du ${shortDay(last)} passé`);
    if (isOverdue({ ...t, done_at: null }, today)) reasons.push(`échéance dépassée de ${diffDays(today, t.due_date)} j`);
    else if (t.due_date) reasons.push(`pour le ${shortDay(t.due_date)}`);
    tray.push({ task: t, reason: reasons.join(' · '), overdue: isOverdue({ ...t, done_at: null }, today) });
  }
  tray.sort((a, b) => (a.task.due_date ?? '9999').localeCompare(b.task.due_date ?? '9999') || a.task.title.localeCompare(b.task.title));
  return { byBlock, tray };
}

// Blocs de travail à venir (pour « recaser » et « placer dans le prochain bloc »).
export function futureWorkBlocks(events, categories, nowMs, today) {
  return events
    .filter((e) => !e.all_day && Date.parse(e.starts_at) > nowMs && isWorkBlock(e, categories))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))
    .map((e) => ({ id: e.id, title: cleanTitle(e.title), dayLabel: dayLabel(dayOf(e.starts_at), today), time: timeParis(e.starts_at), day: dayOf(e.starts_at) }));
}

// Bilan d'hier : blocs de travail d'hier qui ont encore des tâches ouvertes (affectation d'origine).
export function bilanGroups({ events, categories, tasks, yesterday }) {
  return blocksOfDay(events, yesterday)
    .filter((b) => isWorkBlock(b, categories))
    .map((b) => ({
      block: b,
      title: cleanTitle(b.title),
      time: `${timeParis(b.starts_at)} - ${timeParis(new Date(endMs(b)).toISOString())}`,
      tasks: tasks.filter((t) => t.event_id === b.id),
    }))
    .filter((g) => g.tasks.length > 0);
}

const H48 = 48 * 3600 * 1000;
// Prochaines échéances datées (candidatures, tests, examens...) avec compte à rebours.
export function upcomingDeadlines({ tasks, events, today, nowMs, n = 3 }) {
  const { deadlines } = classify({ tasks, events, today });
  const byId = new Map(events.map((e) => [e.id, e]));
  const out = [];
  for (const d of deadlines) {
    if (d.days === null || d.days < 0) continue;
    const ev = d.source === 'event' ? byId.get(d.id.slice(2)) : null;
    const start = ev ? Date.parse(ev.starts_at) : null;
    if (start !== null && d.days === 0 && start < nowMs) continue; // déjà commencé : plus à venir
    out.push({ ...d, start, time: ev && !ev.all_day ? timeParis(ev.starts_at) : null });
    if (out.length >= n) break;
  }
  return out;
}

// { big, sub } : « 3 h 20 » à moins de 48 h quand l'heure est connue, sinon « J-5 ».
export function countdown(d, nowMs) {
  if (d.start !== null && d.start - nowMs > 0 && d.start - nowMs < H48) {
    const mins = Math.floor((d.start - nowMs) / 60000);
    const h = Math.floor(mins / 60);
    return { big: h ? `${h} h ${pad(mins % 60)}` : `${mins} min`, sub: `avant ${d.time ?? 'le début'}` };
  }
  if (d.days === 0) return { big: "Aujourd'hui", sub: d.time ? `à ${d.time}` : '' };
  return { big: `J-${d.days}`, sub: d.time ? `à ${d.time}` : '' };
}

export const frDay = (day) =>
  capital(new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }));
export const frDayShort = (day) =>
  new Date(`${day}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
